import { h, type Bot, type Context, type Element } from 'koishi'
import type { Config, NotifyTarget } from './config'
import { renderNotificationImage } from './image'
import type { PushPayload } from './types'
import { MAX_MESSAGE_LENGTH, NOTIFICATION_CATEGORIES } from './constants'
import { debugLog, getErrorMessage, htmlToText, logger } from './utils'

interface RenderedNotification {
  /** 用于分类与文本回退的纯文本 */
  text: string
  /** HTML 渲染出的图片，渲染失败为空 */
  image?: Buffer
}

/** 按 AUTO-MAS 的 msgtype 渲染通知：text / html / picture */
export async function renderPayload(payload: PushPayload, options: { sendImages: boolean; notifyImage: boolean; imageWidth: number }): Promise<RenderedNotification | undefined> {
  const type = typeof payload.msgtype === 'string' ? payload.msgtype.toLowerCase() : 'text'
  const message = typeof payload.message === 'string' ? payload.message : ''
  if (!message.trim()) return undefined

  if (type === 'picture') {
    if (!options.sendImages) return undefined
    const image = decodeBase64Image(message)
    if (!image) {
      logger.debug('[通知] 收到无法识别的图片推送')
      return undefined
    }
    return { text: 'AUTO-MAS 图片通知', image: image.buffer }
  }

  const text = type === 'html' ? htmlToText(message) : message
  if (!text.trim()) return undefined

  if (type === 'html' && options.notifyImage) {
    try {
      const image = await renderNotificationImage(message, { width: options.imageWidth })
      if (image) return { text, image }
      debugLog(true, 'notify', 'HTML 渲染图片为空，回退文本')
    } catch (error) {
      logger.debug(`[通知] HTML 渲染图片失败，回退文本: ${getErrorMessage(error)}`)
    }
  }
  return { text }
}

function decodeBase64Image(value: string): { buffer: Buffer; mime: string } | undefined {
  const trimmed = value.trim()
  const dataUrl = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(trimmed)
  const base64 = (dataUrl ? dataUrl[2] : trimmed).replace(/\s+/g, '')
  if (!base64) return undefined
  const buffer = Buffer.from(base64, 'base64')
  if (!buffer.length) return undefined
  const mime = detectMime(buffer) ?? (dataUrl ? dataUrl[1] : 'image/png')
  return { buffer, mime }
}

function detectMime(buffer: Buffer): string | undefined {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.length >= 6 && buffer.toString('ascii', 0, 3) === 'GIF') return 'image/gif'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return undefined
}

/** 推送正文没有结构化分类，只能按关键词判断；一条通知可能同时命中多类 */
export function classifyNotification(text: string): string[] {
  const categories: string[] = []
  const add = (key: string) => {
    if (!categories.includes(key)) categories.push(key)
  }
  if (/测试|test/i.test(text)) add('test')
  if (/六星|喜报/i.test(text)) add('sixStar')
  if (/签到/i.test(text)) add('sign')
  if (/材料|收获/i.test(text)) add('material')
  if (/活动|卡池|公告|理智/i.test(text)) add('activity')
  if (/异常|失败|错误|未送达|error/i.test(text)) add('error')
  if (/统计报告|统计|报告/i.test(text)) add('statistic')
  if (/自动代理|任务|完成|成功/i.test(text)) add('task')
  if (!categories.length) add('other')
  return categories
}

/** 把长文本拆成多条消息，优先在换行处断开 */
export function splitMessage(text: string, limit = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= limit) return [text]
  const chunks: string[] = []
  let current = ''
  for (const line of text.split('\n')) {
    if (current && current.length + line.length + 1 > limit) {
      chunks.push(current)
      current = ''
    }
    if (line.length > limit) {
      if (current) {
        chunks.push(current)
        current = ''
      }
      for (let i = 0; i < line.length; i += limit) chunks.push(line.slice(i, i + limit))
      continue
    }
    current = current ? `${current}\n${line}` : line
  }
  if (current) chunks.push(current)
  return chunks
}

export class Notifier {
  private warned = false

  constructor(
    private readonly ctx: Context,
    private readonly config: Config,
  ) {}

  async handle(payload: PushPayload): Promise<void> {
    if (!this.config.notifyEnabled) return

    const rendered = await renderPayload(payload, {
      sendImages: this.config.sendImages,
      notifyImage: this.config.notifyImage,
      imageWidth: this.config.imageWidth,
    })
    if (!rendered) return

    const categories = classifyNotification(rendered.text)
    if (!this.acceptGlobally(categories)) {
      debugLog(this.config.debug, 'notify', `类别 ${categories.join(',')} 被全局配置过滤`)
      return
    }

    const targets = this.config.notifyTargets.filter((target) => this.acceptTarget(target, categories))
    if (!targets.length) {
      if (!this.warned) {
        logger.warn('收到 AUTO-MAS 推送，但没有匹配的推送目标，请检查通知配置。')
        this.warned = true
      }
      return
    }

    await Promise.all(targets.map((target) => this.deliver(target, rendered)))
  }

  /** 发送一条测试消息到所有目标，忽略类别过滤 */
  async sendTest(): Promise<string> {
    if (!this.config.notifyTargets.length) {
      return '还没有配置推送目标，请先在通知配置里添加平台、会话类型和会话 ID。'
    }

    const message = `AUTO-MAS 测试通知\n时间：${new Date().toLocaleString('zh-CN', { hour12: false })}\n收到这条消息说明 Koishi 到聊天平台的链路正常。`
    const lines: string[] = []
    for (const target of this.config.notifyTargets) {
      const bot = this.findBot(target.platform)
      if (!bot) {
        lines.push(`- ${describeTarget(target)}：找不到平台机器人`)
        continue
      }
      try {
        await this.sendTo(bot, target, message)
        lines.push(`- ${describeTarget(target)}：已发送`)
      } catch (error) {
        lines.push(`- ${describeTarget(target)}：失败（${getErrorMessage(error)}）`)
      }
    }
    return ['测试通知已处理：', ...lines].join('\n')
  }

  private acceptGlobally(categories: string[]): boolean {
    const enabled = this.config.notifyEvents.filter((item) => item.enabled).map((item) => item.category)
    if (!enabled.length) return false
    return categories.some((category) => enabled.includes(category))
  }

  private acceptTarget(target: NotifyTarget, categories: string[]): boolean {
    const events = target.events ?? []
    if (!events.length) return true
    return categories.some((category) => events.includes(category))
  }

  private async deliver(target: NotifyTarget, rendered: RenderedNotification): Promise<void> {
    const bot = this.findBot(target.platform)
    if (!bot) {
      logger.warn(`找不到平台 ${target.platform} 的机器人，通知未发送。`)
      return
    }

    try {
      if (rendered.image) {
        await this.sendTo(bot, target, h.image(rendered.image, 'image/png'))
      } else if (this.config.mergeForward) {
        await this.sendTo(bot, target, buildForwardMessage(bot, splitMessage(rendered.text)))
      } else {
        for (const chunk of splitMessage(rendered.text)) {
          await this.sendTo(bot, target, chunk)
        }
      }
      debugLog(this.config.debug, 'notify', `已发送到 ${describeTarget(target)}`)
    } catch (error) {
      logger.warn(`发送通知到 ${describeTarget(target)} 失败: ${getErrorMessage(error)}`)
    }
  }

  private async sendTo(bot: Bot, target: NotifyTarget, content: string | Element): Promise<void> {
    if (target.channelType === 'private') {
      await bot.sendPrivateMessage(target.channelId, content)
      return
    }
    await bot.sendMessage(target.channelId, content)
  }

  private findBot(platform: string): Bot | undefined {
    const bots = this.ctx.bots as Bot[]
    return bots.find((bot) => bot.platform === platform) ?? (platform ? undefined : bots[0])
  }
}

function describeTarget(target: NotifyTarget): string {
  const type = target.channelType === 'private' ? '私聊' : '群聊'
  return `${target.platform}/${type} ${target.channelId}`
}

/** 给调试日志用的类别说明 */
export function describeCategories(categories: string[]): string {
  return categories.map((category) => NOTIFICATION_CATEGORIES[category] ?? category).join('、')
}

/** OneBot 适配器识别 message 元素上的 forward 标记，把子节点转成转发节点 */
function buildForwardMessage(bot: Bot, chunks: string[]): Element {
  return h(
    'message',
    { forward: true },
    ...chunks.map((text) => h('message', { userId: bot.selfId, nickname: 'AUTO-MAS' }, text)),
  )
}
