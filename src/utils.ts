import { Logger } from 'koishi'
import { DEFAULT_KOISHI_PORT, LOGGER_NAME, MAX_MESSAGE_LENGTH } from './constants'

export const logger = new Logger(LOGGER_NAME)

export interface Identity {
  platform: string
  userId: string
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

let debugLevelRaised = false

/**
 * 打开「调试」开关后，只把插件自己的 logger 级别提到 debug（3），不影响其他插件与 Koishi 全局等级。
 * 只抬高、不压低：关闭时恢复默认行为，避免覆盖用户在控制台设置过的级别。
 */
export function raiseDebugLevel(enabled: boolean): void {
  if (!enabled || debugLevelRaised) return
  debugLevelRaised = true
  if (logger.level < 3) logger.level = 3
}

export function debugLog(enabled: boolean, scope: string, message: string): void {
  // 调试开关打开时 raiseDebugLevel 已把本插件 logger 提到 debug；关闭时这里不输出
  if (enabled) logger.debug(`[${scope}] ${message}`)
}

/** 给常见失败补充下一步动作，避免用户只看到原始错误 */
export function describeFailure(message: string): string {
  const text = message.trim()
  if (/部分通知发送失败.*Koishi|未找到名为 \[Koishi\]/i.test(text)) {
    return `${text}
AUTO-MAS 的 Koishi 推送通道未启动。修改推送设置后需要重启一次 AUTO-MAS。`
  }
  if (/无法连接 AUTO-MAS|请求超时/.test(text)) {
    return `${text}
请确认 AUTO-MAS 正在运行，且配置的 baseUrl 可达。`
  }
  if (/平台机器人未连接|连接已断开|connection has closed|websocket.*closed|ECONNRESET/i.test(text)) {
    return `${text}
请检查 OneBot/NapCat 与 QQ 是否在线，重连后再试。`
  }
  return text
}

export function truncate(value: string, max = MAX_MESSAGE_LENGTH): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

export function normalizeBaseUrl(value: string): string {
  let url = String(value ?? '').trim()
  if (!url) return 'http://127.0.0.1:36163'
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`
  return url.replace(/\/+$/, '')
}

export function normalizeListenPath(value: string): string {
  let path = String(value ?? '').trim()
  if (!path) return '/AUTO_MAS'
  if (!path.startsWith('/')) path = `/${path}`
  return path.replace(/\/+$/, '') || '/'
}

/** 解析 `平台:用户ID`；用户 ID 里出现冒号时按第一个冒号切分 */
export function parseIdentity(value: string): Identity | undefined {
  const text = String(value ?? '').trim()
  const index = text.indexOf(':')
  if (index <= 0) return undefined
  const platform = text.slice(0, index).trim()
  const userId = text.slice(index + 1).trim()
  if (!platform || !userId) return undefined
  return { platform, userId }
}

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 推断 AUTO-MAS 应该填写的推送地址：复用 Koishi 服务时默认 5140 */
export function expectedPushAddress(config: {
  listenMode: string
  listenPath: string
  host: string
  port: number
}): string {
  const port = config.listenMode === 'standalone' ? config.port : DEFAULT_KOISHI_PORT
  const host = config.listenMode === 'standalone'
    ? (config.host === '0.0.0.0' ? '127.0.0.1' : config.host)
    : '127.0.0.1'
  return `ws://${host}:${port}${config.listenPath}`
}

/** AUTO-MAS 的 HTML 正文转纯文本，保留换行与表格分隔 */
export function htmlToText(input: string): string {
  return input
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li|table|section|article)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
