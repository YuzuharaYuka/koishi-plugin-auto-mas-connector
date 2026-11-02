import { Schema } from 'koishi'
import {
  DEFAULT_BASE_URL,
  DEFAULT_GAME_WINDOW,
  DEFAULT_IMAGE_WIDTH,
  DEFAULT_LISTEN_PATH,
  DEFAULT_PROCESS_TIMEOUT,
  DEFAULT_STANDALONE_PORT,
  NOTIFICATION_CATEGORIES,
} from './constants'
import { clampNumber, normalizeBaseUrl, normalizeListenPath, parseIdentity } from './utils'

export type ListenMode = 'auto' | 'server' | 'standalone'
export type ScreenshotMode = 'auto' | 'window' | 'adb'
export type ChannelType = 'guild' | 'private'

export interface NotifyTarget {
  /** 平台名，如 onebot */
  platform: string
  channelType: ChannelType
  /** 群号，或私聊用户 ID */
  channelId: string
  /** 接收类别；空数组表示全部 */
  events: string[]
  /** 关键词，逗号分隔；命中标题或正文才接收，留空不过滤 */
  keywords: string
}

/** 全局接收类别，按表格顺序展示，enabled 控制是否接收 */
export interface NotifyCategorySetting {
  category: string
  enabled: boolean
}

export interface Config {
  /** AUTO-MAS 后端地址 */
  baseUrl: string
  /** 请求超时，毫秒 */
  timeout: number
  /** 推送服务方式 */
  listenMode: ListenMode
  /** 推送服务 WebSocket 路径 */
  listenPath: string
  /** 推送令牌，空串表示不校验 */
  token: string
  /** 独立监听地址 */
  host: string
  /** 独立监听端口 */
  port: number
  /** 允许通过指令控制 AUTO-MAS 进程 */
  processControl: boolean
  /** AUTO-MAS 启动文件路径 */
  masExePath: string
  /** 等待进程启动/关闭的秒数 */
  processTimeout: number
  notifyEnabled: boolean
  notifyTargets: NotifyTarget[]
  /** 全局接收类别 */
  notifyEvents: NotifyCategorySetting[]
  /** 把推送文本渲染成图片 */
  notifyImage: boolean
  /** 纯文本推送使用合并转发 */
  mergeForward: boolean
  /** 渲染图片宽度 */
  imageWidth: number
  sendImages: boolean
  /** 管理员标识，格式 平台:用户ID */
  admins: string[]
  enableChineseAlias: boolean
  /** 截图方式 */
  screenshotMode: ScreenshotMode
  gameWindow: string
  /** 窗口截图失败时回退的 adb 路径 */
  adbPath: string
  /** ADB 设备序列号 */
  adbSerial: string
  debug: boolean
}

const categoryChoices = Object.entries(NOTIFICATION_CATEGORIES).map(([value, label]) =>
  Schema.const(value).description(label),
)

const defaultCategories = Object.keys(NOTIFICATION_CATEGORIES).map((category) => ({ category, enabled: true }))

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    baseUrl: Schema.string()
      .default(DEFAULT_BASE_URL)
      .description('AUTO-MAS 后端地址；跨机填对方可达地址'),
    timeout: Schema.number()
      .min(1000)
      .max(30000)
      .step(500)
      .default(8000)
      .description('请求超时（毫秒）'),
  }).description('连接'),

  Schema.object({
    listenMode: Schema.union([
      Schema.const('auto').description('自动'),
      Schema.const('server').description('复用 Koishi 服务'),
      Schema.const('standalone').description('独立监听'),
    ]).role('radio')
      .default('auto')
      .description('AUTO-MAS 推送连接的挂载方式'),
    listenPath: Schema.string()
      .default(DEFAULT_LISTEN_PATH)
      .description('推送路径，需与 AUTO-MAS 的推送地址一致'),
    host: Schema.string()
      .default('127.0.0.1')
      .description('独立监听地址；跨机访问填 0.0.0.0'),
    token: Schema.string()
      .role('secret')
      .default('')
      .description('与 AUTO-MAS 的 KoishiToken 一致；留空不校验'),
    port: Schema.natural()
      .min(1024)
      .max(65535)
      .default(DEFAULT_STANDALONE_PORT)
      .description('独立监听端口'),
  }).description('推送服务'),

  Schema.object({
    processControl: Schema.boolean()
      .default(false)
      .description('允许通过 mas.process 关闭、启动或重启 AUTO-MAS'),
    masExePath: Schema.string()
      .default('')
      .description('AUTO-MAS 启动文件路径；留空自动识别'),
    processTimeout: Schema.number()
      .min(10)
      .max(300)
      .step(5)
      .default(DEFAULT_PROCESS_TIMEOUT)
      .description('等待启动或关闭的秒数'),
  }).description('进程管理'),

  Schema.object({
    notifyEnabled: Schema.boolean()
      .default(true)
      .description('接收 AUTO-MAS 推送'),
    notifyImage: Schema.boolean()
      .default(true)
      .description('把通知文本渲染为图片发送'),
    sendImages: Schema.boolean()
      .default(true)
      .description('转发推送中的图片'),
    mergeForward: Schema.boolean()
      .default(true)
      .description('文本通知使用合并转发'),
    imageWidth: Schema.number()
      .min(480)
      .max(1200)
      .step(20)
      .role('slider')
      .default(DEFAULT_IMAGE_WIDTH)
      .description('图片宽度（像素）'),
    notifyEvents: Schema.array(Schema.object({
      category: Schema.union(categoryChoices).description('类别'),
      enabled: Schema.boolean().default(true).description('是否接收'),
    }))
      .role('table')
      .default(defaultCategories)
      .description('**接收类别**<br>拖动排序，关闭即不接收'),
    notifyTargets: Schema.array(Schema.object({
      platform: Schema.string()
        .default('onebot')
        .description('平台名'),
      channelType: Schema.union([
        Schema.const('guild').description('群聊'),
        Schema.const('private').description('私聊'),
      ])
        .default('guild')
        .description('会话类型'),
      channelId: Schema.string()
        .default('')
        .description('群号或用户 ID'),
      events: Schema.array(Schema.union(categoryChoices))
        .role('checkbox')
        .default([])
        .description('类别'),
      keywords: Schema.string()
        .default('')
        .description('关键词'),
    }))
      .role('table')
      .default([])
      .description('**推送目标**<br>类别与关键词留空表示不过滤，关键词用逗号分隔'),
  }).description('通知'),

  Schema.object({
    admins: Schema.array(Schema.string())
      .role('table')
      .default([])
      .description('管理员标识，格式 `平台:用户ID`；留空时控制指令不可用'),
  }).description('权限'),

  Schema.object({
    enableChineseAlias: Schema.boolean()
      .default(true)
      .description('启用中文指令别名'),
  }).description('指令'),

  Schema.object({
    screenshotMode: Schema.union([
      Schema.const('auto').description('自动：窗口优先，失败时回退 ADB'),
      Schema.const('window').description('窗口：只按窗口标题截图'),
      Schema.const('adb').description('ADB：直接通过 adb 截图'),
    ]).role('radio')
      .default('auto')
      .description('截图方式'),
    gameWindow: Schema.string()
      .default(DEFAULT_GAME_WINDOW)
      .description('窗口标题关键字'),
    adbPath: Schema.string()
      .default('')
      .description('adb 路径；留空自动识别'),
    adbSerial: Schema.string()
      .default('')
      .description('设备序列号；留空自动识别'),
  }).description('截图'),

  Schema.object({
    debug: Schema.boolean()
      .default(false)
      .description('输出调试日志'),
  }).description('调试').collapse(),
])

/** 运行时夹逼：手改 koishi.yml 或旧配置升级都可能绕过 Schema 约束 */
export function normalizeConfig(raw: Config): Config {
  return {
    baseUrl: normalizeBaseUrl(raw.baseUrl),
    timeout: clampNumber(raw.timeout, 1000, 30000, 8000),
    listenMode: raw.listenMode === 'server' || raw.listenMode === 'standalone' ? raw.listenMode : 'auto',
    listenPath: normalizeListenPath(raw.listenPath),
    token: String(raw.token ?? '').trim(),
    host: String(raw.host ?? '').trim() || '127.0.0.1',
    port: clampNumber(raw.port, 1024, 65535, DEFAULT_STANDALONE_PORT),
    processControl: raw.processControl === true,
    masExePath: String(raw.masExePath ?? '').trim(),
    processTimeout: clampNumber(raw.processTimeout, 10, 300, DEFAULT_PROCESS_TIMEOUT),
    notifyEnabled: raw.notifyEnabled !== false,
    notifyTargets: normalizeTargets(raw.notifyTargets),
    notifyEvents: normalizeCategorySettings(raw.notifyEvents),
    notifyImage: raw.notifyImage !== false,
    mergeForward: raw.mergeForward !== false,
    imageWidth: clampNumber(raw.imageWidth, 480, 1200, DEFAULT_IMAGE_WIDTH),
    sendImages: raw.sendImages !== false,
    admins: normalizeAdmins(raw.admins),
    enableChineseAlias: raw.enableChineseAlias !== false,
    screenshotMode: raw.screenshotMode === 'window' || raw.screenshotMode === 'adb' ? raw.screenshotMode : 'auto',
    gameWindow: String(raw.gameWindow ?? '').trim() || DEFAULT_GAME_WINDOW,
    adbPath: String(raw.adbPath ?? '').trim(),
    adbSerial: String(raw.adbSerial ?? '').trim(),
    debug: raw.debug === true,
  }
}

function normalizeTargets(input: unknown): NotifyTarget[] {
  if (!Array.isArray(input)) return []
  const targets: NotifyTarget[] = []
  const seen = new Set<string>()
  for (const item of input) {
    if (!item || typeof item !== 'object') continue
    const record = item as Partial<NotifyTarget>
    const platform = String(record.platform ?? '').trim()
    const channelId = String(record.channelId ?? '').trim()
    if (!platform || !channelId) continue
    const channelType: ChannelType = record.channelType === 'private' ? 'private' : 'guild'
    const key = `${platform}:${channelType}:${channelId}`
    if (seen.has(key)) continue
    seen.add(key)
    targets.push({
      platform,
      channelType,
      channelId,
      events: normalizeEventList(record.events),
      keywords: String(record.keywords ?? '').trim(),
    })
  }
  return targets
}

function normalizeAdmins(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const admins: string[] = []
  const seen = new Set<string>()
  for (const item of input) {
    const identity = parseIdentity(String(item ?? ''))
    if (!identity) continue
    const key = `${identity.platform}:${identity.userId}`
    if (seen.has(key)) continue
    seen.add(key)
    admins.push(key)
  }
  return admins
}

/** 兼容旧配置：也接受字符串数组（表示全部启用），表格里未知类别直接丢弃 */
export function normalizeCategorySettings(input: unknown): NotifyCategorySetting[] {
  const values: NotifyCategorySetting[] = []
  const seen = new Set<string>()
  const items = Array.isArray(input) ? input : []
  for (const item of items) {
    const record = item && typeof item === 'object' ? (item as Partial<NotifyCategorySetting>) : undefined
    const key = resolveCategory(String(record?.category ?? item ?? ''))
    if (!key || seen.has(key)) continue
    seen.add(key)
    values.push({ category: key, enabled: record ? record.enabled !== false : true })
  }
  if (!values.length) return defaultCategories.map((item) => ({ ...item }))
  // 表格里没列出的类别默认不接收，保持用户看到的就是实际生效的
  return values
}

export function resolveCategory(input: string): string | undefined {
  const text = input.trim()
  if (!text) return undefined
  const lower = text.toLowerCase()
  if (Object.prototype.hasOwnProperty.call(NOTIFICATION_CATEGORIES, lower)) return lower
  for (const [code, label] of Object.entries(NOTIFICATION_CATEGORIES)) {
    if (text === label) return code
  }
  return undefined
}

/** 把旧配置的逗号分隔字符串或新配置的类别数组统一成类别代码列表 */
export function normalizeEventList(input: unknown): string[] {
  const parts = Array.isArray(input) ? input : String(input ?? '').split(/[,，、\s]+/)
  const values: string[] = []
  for (const part of parts) {
    const key = resolveCategory(typeof part === 'string' ? part : String(part))
    if (key && !values.includes(key)) values.push(key)
  }
  return values
}
