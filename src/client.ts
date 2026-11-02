import type { Config } from './config'
import type {
  CoreHealth,
  EmulatorGetOut,
  EmulatorStatusOut,
  HistoryDetail,
  HistorySearchOut,
  PowerCountdownSnapshot,
  QueueGetOut,
  QueueItemGetOut,
  ScreenshotOut,
  ScriptsGetOut,
  SettingGetOut,
  TaskRuntimeSnapshot,
  TaskStatus,
  UserGetOut,
} from './types'
import { debugLog, getErrorMessage } from './utils'

export class AutoMasError extends Error {
  constructor(message: string, readonly status?: number, readonly body?: string) {
    super(message)
    this.name = 'AutoMasError'
  }
}

export class AutoMasClient {
  constructor(private readonly config: Config) {}

  private url(path: string): string {
    return `${this.config.baseUrl}${path}`
  }

  /** 发送请求并拆掉 AUTO-MAS 的 { success, data } 信封；失败时抛出带下一步提示的错误 */
  async request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    const method = init.method ?? 'GET'
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (init.body !== undefined) headers['Content-Type'] = 'application/json'

    let response: Response
    try {
      response = await fetch(this.url(path), {
        method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(this.config.timeout),
      })
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new AutoMasError(`请求超时（${this.config.timeout} 毫秒）：${this.config.baseUrl}${path}`)
      }
      throw new AutoMasError(`无法连接 AUTO-MAS（${this.config.baseUrl}）：${getErrorMessage(error)}`)
    }

    const text = await response.text()
    let payload: unknown
    try {
      payload = text ? JSON.parse(text) : undefined
    } catch {
      payload = undefined
    }

    if (!response.ok) {
      const message = readMessage(payload) ?? text.slice(0, 200)
      throw new AutoMasError(`AUTO-MAS 返回 HTTP ${response.status}${message ? `：${message}` : ''}`, response.status, text.slice(0, 500))
    }

    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>
      if (typeof record.success === 'boolean') {
        if (!record.success) {
          const message = readMessage(payload) ?? '未提供原因'
          throw new AutoMasError(`AUTO-MAS 拒绝了该操作：${message}`)
        }
        debugLog(this.config.debug, 'client', `${method} ${path} -> success`)
        return record.data as T
      }
      if (typeof record.code === 'number' && record.code >= 400) {
        const message = readMessage(payload) ?? '未提供原因'
        throw new AutoMasError(`AUTO-MAS 返回错误 ${record.code}：${message}`)
      }
    }

    debugLog(this.config.debug, 'client', `${method} ${path} -> ok`)
    return payload as T
  }

  health(): Promise<CoreHealth> {
    return this.request<CoreHealth>('/api/core/health')
  }

  getRuntimeSnapshot(): Promise<TaskRuntimeSnapshot> {
    return this.request<TaskRuntimeSnapshot>('/api/dispatch/runtime-snapshot')
  }

  getTask(taskId: string): Promise<TaskStatus> {
    return this.request<TaskStatus>(`/api/dispatch/task/${encodeURIComponent(taskId)}`)
  }

  startTask(taskId: string, mode: 'AutoProxy' | 'ScriptConfig' | 'Update' | 'CycleRun'): Promise<{ taskId: string }> {
    return this.request<{ taskId: string }>('/api/dispatch/start', {
      method: 'POST',
      body: { taskId, mode },
    })
  }

  startQueueWithUsers(taskId: string, queueUserIds: Record<string, string[]>): Promise<{ taskId: string }> {
    return this.request<{ taskId: string }>('/api/dispatch/start', {
      method: 'POST',
      body: { taskId, mode: 'AutoProxy', queueUserIds },
    })
  }

  stopTask(taskId: string): Promise<unknown> {
    return this.request('/api/dispatch/stop', { method: 'POST', body: { taskId } })
  }

  getPowerSnapshot(): Promise<PowerCountdownSnapshot> {
    return this.request<PowerCountdownSnapshot>('/api/dispatch/power/countdown-snapshot')
  }

  setPower(signal: string): Promise<unknown> {
    return this.request('/api/dispatch/set/power', { method: 'POST', body: { signal } })
  }

  getQueues(): Promise<QueueGetOut> {
    return this.request<QueueGetOut>('/api/queue/get', { method: 'POST', body: {} })
  }

  getQueueItems(queueId: string): Promise<QueueItemGetOut> {
    return this.request<QueueItemGetOut>('/api/queue/item/get', { method: 'POST', body: { queueId } })
  }

  getScripts(): Promise<ScriptsGetOut> {
    return this.request<ScriptsGetOut>('/api/scripts/get', { method: 'POST', body: {} })
  }

  getUsers(scriptId: string, userId?: string): Promise<UserGetOut> {
    return this.request<UserGetOut>('/api/scripts/user/get', {
      method: 'POST',
      body: userId ? { scriptId, userId } : { scriptId },
    })
  }

  getSetting(): Promise<SettingGetOut> {
    return this.request<SettingGetOut>('/api/setting/get', { method: 'POST', body: {} })
  }

  /** 更新 AUTO-MAS 的通知设置；AUTO-MAS 会对传入的片段做合并 */
  updateNotifySetting(patch: Record<string, unknown>): Promise<unknown> {
    return this.request('/api/setting/update', { method: 'POST', body: { data: { Notify: patch } } })
  }

  /** 让 AUTO-MAS 用它已启用的通知渠道发一条测试通知 */
  testNotify(): Promise<unknown> {
    return this.request('/api/setting/test_notify', { method: 'POST', body: {} })
  }

  getEmulators(): Promise<EmulatorGetOut> {
    return this.request<EmulatorGetOut>('/api/emulator/get', { method: 'POST', body: {} })
  }

  getEmulatorStatus(): Promise<EmulatorStatusOut> {
    return this.request<EmulatorStatusOut>('/api/emulator/status', { method: 'POST', body: {} })
  }

  searchHistory(mode: 'DAILY' | 'WEEKLY' | 'MONTHLY', startDate: string, endDate: string): Promise<HistorySearchOut> {
    return this.request<HistorySearchOut>('/api/history/search', {
      method: 'POST',
      body: { mode, start_date: startDate, end_date: endDate },
    })
  }

  getHistoryDetail(recordId: string): Promise<HistoryDetail> {
    return this.request<HistoryDetail>('/api/history/detail', {
      method: 'POST',
      body: { recordId },
    })
  }

  screenshot(windowTitle: string): Promise<ScreenshotOut> {
    return this.request<ScreenshotOut>('/api/ocr/screenshot', {
      method: 'POST',
      body: { window_title: windowTitle },
    })
  }

  screenshotAdb(adbPath: string, serial: string, useScreencap = true): Promise<ScreenshotOut> {
    return this.request<ScreenshotOut>('/api/ocr/screenshot/adb', {
      method: 'POST',
      body: { adb_path: adbPath, serial, use_screencap: useScreencap },
    })
  }
}

function readMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const record = payload as Record<string, unknown>
  if (typeof record.message === 'string' && record.message.trim()) return record.message.trim()
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail.trim()
  return undefined
}
