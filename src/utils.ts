import { Logger } from 'koishi'
import { LOGGER_NAME, MAX_MESSAGE_LENGTH } from './constants'

export const logger = new Logger(LOGGER_NAME)

export interface Identity {
  platform: string
  userId: string
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function debugLog(enabled: boolean, scope: string, message: string): void {
  if (enabled) logger.debug(`[${scope}] ${message}`)
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
