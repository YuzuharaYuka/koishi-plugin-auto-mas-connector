import type {
  CoreHealth,
  HistoryDetail,
  HistorySearchOut,
  PowerCountdownSnapshot,
  QueueGetOut,
  QueueItemGetOut,
  RuntimeTask,
  ScriptsGetOut,
  TaskRuntimeSnapshot,
  TaskStatus,
  UserGetOut,
} from './types'
import { truncate } from './utils'

/** v5.7 用 DONE 表示成功，v5.8 用 SUCCESS，这里统一兼容 */
const SUCCESS_STATUSES = new Set(['SUCCESS', 'DONE', 'OK', 'COMPLETED'])

function isSuccessStatus(status: string | undefined): boolean {
  return SUCCESS_STATUSES.has(String(status ?? '').toUpperCase())
}

export function formatStatus(health: CoreHealth, snapshot: TaskRuntimeSnapshot): string {
  const lines: string[] = []
  const version = health.version ?? '未知版本'
  const state = health.ready ? '就绪' : '未就绪'
  const background = health.backgroundStatus ? `（${health.backgroundStatus}）` : ''
  lines.push(`AUTO-MAS ${version} · ${state}${background}`)

  const tasks = snapshot.tasks ?? []
  const scheduled = snapshot.scheduledScripts ?? []
  lines.push(`运行中任务：${tasks.length} 个；已安排脚本：${scheduled.length} 个`)
  if (!tasks.length) {
    lines.push('当前没有运行中的任务。')
    return lines.join('\n')
  }
  for (const task of tasks.slice(0, 8)) lines.push(`- ${describeTask(task)}`)
  if (tasks.length > 8) lines.push(`……另有 ${tasks.length - 8} 个任务`)
  return lines.join('\n')
}

export function formatTaskList(snapshot: TaskRuntimeSnapshot): string {
  const tasks = snapshot.tasks ?? []
  if (!tasks.length) return '当前没有运行中的任务。'
  return ['运行中的任务：', ...tasks.map((task) => `- ${describeTask(task)}`)].join('\n')
}

export function formatTaskStatus(task: TaskStatus): string {
  const lines: string[] = []
  lines.push(`任务 ${task.taskId}`)
  lines.push(`状态：${statusLabel(task.status)}${task.stopping ? '（正在停止）' : ''}`)
  if (task.mode) lines.push(`模式：${task.mode}${task.isCycle ? '（循环）' : ''}`)
  if (task.scriptId) lines.push(`脚本：${task.scriptId}`)
  if (task.queueId) lines.push(`队列：${task.queueId}`)
  if (task.userId) lines.push(`用户：${task.userId}`)
  if (task.finishedAt) lines.push(`结束时间：${task.finishedAt}`)
  if (task.detail) lines.push(`详情：${truncate(task.detail, 400)}`)
  if (task.error) lines.push(`错误：${truncate(task.error, 400)}`)
  return lines.join('\n')
}

export function formatQueueList(result: QueueGetOut): string {
  const index = result.index ?? []
  if (!index.length) return '当前没有调度队列。'
  const lines = ['调度队列：']
  for (const item of index) {
    const config = result.data?.[item.uid]
    const info = config?.Info ?? {}
    const flags: string[] = []
    if (info.CycleEnabled) flags.push('循环')
    if (info.TimeEnabled) flags.push('定时')
    const name = info.Name ? `「${info.Name}」` : ''
    lines.push(`- ${name}${item.uid}${flags.length ? `（${flags.join(' / ')}）` : ''}`)
  }
  lines.push('用 mas.start 「ID 或名称」启动。')
  return lines.join('\n')
}

export function formatScriptList(result: ScriptsGetOut): string {
  const index = result.index ?? []
  if (!index.length) return '当前没有脚本配置。'
  const lines = ['脚本配置：']
  for (const item of index) {
    const config = result.data?.[item.uid]
    const name = config?.Info?.Name ?? '未命名'
    const game = config?.activityGame ? `（${config.activityGame}）` : ''
    lines.push(`- ${name}${game}：${item.uid}`)
  }
  lines.push('用 mas.start 「ID 或名称」启动脚本自动代理。')
  return lines.join('\n')
}

export function scriptName(result: ScriptsGetOut, uid: string): string {
  return result.data?.[uid]?.Info?.Name ?? '未命名'
}

export function scriptEntries(result: ScriptsGetOut): Array<{ uid: string; name: string }> {
  return (result.index ?? []).map((item) => ({ uid: item.uid, name: scriptName(result, item.uid) }))
}

/** 名称搜索忽略空格与大小写，「新maa」也能命中「新 MAA 脚本」 */
export function normalizeSearch(value: string): string {
  return String(value ?? '').replace(/\s+/g, '').toLowerCase()
}

export function findScript(result: ScriptsGetOut, query: string): { uid: string; name: string } | undefined {
  const text = query.trim()
  if (!text) return undefined
  const matched = (result.index ?? []).find((item) => item.uid === text)
  if (matched) {
    const name = result.data?.[matched.uid]?.Info?.Name ?? matched.uid
    return { uid: matched.uid, name }
  }
  const key = normalizeSearch(text)
  const entries = Object.entries(result.data ?? {})
  for (const [uid, config] of entries) {
    if (config?.Info?.Name === text) return { uid, name: String(config.Info.Name) }
  }
  for (const [uid, config] of entries) {
    const name = String(config?.Info?.Name ?? '')
    if (name && normalizeSearch(name) === key) return { uid, name }
  }
  const partial = entries.filter(([, config]) => normalizeSearch(String(config?.Info?.Name ?? '')).includes(key))
  if (partial.length === 1) {
    const [uid, config] = partial[0]
    return { uid, name: String(config.Info?.Name ?? uid) }
  }
  return undefined
}

export function findQueue(result: QueueGetOut, query: string): { uid: string; name: string; cycleEnabled: boolean } | undefined {
  const text = query.trim()
  if (!text) return undefined
  const resolve = (uid: string) => {
    const config = result.data?.[uid]
    return {
      uid,
      name: config?.Info?.Name ?? uid,
      cycleEnabled: config?.Info?.CycleEnabled === true,
    }
  }
  const matched = (result.index ?? []).find((item) => item.uid === text)
  if (matched) return resolve(matched.uid)
  const key = normalizeSearch(text)
  const entries = Object.entries(result.data ?? {})
  for (const [uid, config] of entries) {
    if (config?.Info?.Name === text) return resolve(uid)
  }
  for (const [uid, config] of entries) {
    const name = String(config?.Info?.Name ?? '')
    if (name && normalizeSearch(name) === key) return resolve(uid)
  }
  const partial = entries.filter(([, config]) => normalizeSearch(String(config?.Info?.Name ?? '')).includes(key))
  if (partial.length === 1) return resolve(partial[0][0])
  return undefined
}

/** 取出队列项里已绑定脚本的 ID；未绑定（"-"）的项跳过，按队列顺序去重 */
export function queueScriptIds(result: QueueItemGetOut): string[] {
  const ids: string[] = []
  for (const item of result.index ?? []) {
    const scriptId = result.data?.[item.uid]?.Info?.ScriptId
    if (typeof scriptId !== 'string' || !scriptId || scriptId === '-') continue
    if (!ids.includes(scriptId)) ids.push(scriptId)
  }
  return ids
}

export function formatPower(snapshot: PowerCountdownSnapshot): string {
  if (!snapshot.active) return '当前没有待执行的电源操作。'
  const action = snapshot.operation ?? '未知操作'
  const remaining = typeof snapshot.remaining === 'number' ? `${snapshot.remaining} 秒` : '未知'
  return `待执行电源操作：${action}，剩余 ${remaining}。`
}

export function formatHistory(result: HistorySearchOut): string {
  const data = result.data ?? {}
  const dates = Object.keys(data).sort().reverse()
  if (!dates.length) return '所选范围内没有执行历史。'
  const lines: string[] = ['执行历史：']
  for (const date of dates.slice(0, 7)) {
    lines.push(`【${date}】`)
    const users = data[date] ?? {}
    const names = Object.keys(users)
    if (!names.length) {
      lines.push('- 无记录')
      continue
    }
    for (const username of names) {
      const bucket = users[username] ?? {}
      const records = bucket.index ?? []
      const success = records.filter((record) => isSuccessStatus(record.status)).length
      lines.push(`- ${username}：${records.length} 条，成功 ${success}，失败 ${records.length - success}`)
      for (const record of records.slice(-2)) {
        lines.push(`  - ${describeHistoryRecord(record)}`)
      }
    }
  }
  return truncate(lines.join('\n'), 2200)
}

export function formatHistoryDetail(detail: HistoryDetail): string {
  const record = detail.record ?? {}
  const lines: string[] = []
  lines.push(`记录 ${record.id ?? '未知'}`)
  if (record.time ?? record.date) lines.push(`时间：${record.time ?? record.date}`)
  if (record.username) lines.push(`用户：${record.username}`)
  if (record.script_name) lines.push(`脚本：${record.script_name}`)
  if (record.status) lines.push(`状态：${record.status}`)
  if (record.message ?? record.result) lines.push(`结果：${truncate(String(record.message ?? record.result), 400)}`)
  if (detail.log_available === false) lines.push('日志：不可用')
  if (detail.log_content) lines.push(`日志末尾：\n${truncate(detail.log_content.slice(-800), 800)}`)
  return lines.join('\n')
}

function describeHistoryRecord(record: { time?: string; date?: string; status?: string; message?: string; result?: string }): string {
  const time = record.time ?? record.date ?? ''
  const raw = String(record.status ?? '').toUpperCase()
  const status = isSuccessStatus(raw) ? '成功' : raw === 'ERROR' ? '失败' : raw || '未知'
  const summary = record.message ?? record.result ?? ''
  return `${time} ${status}${summary ? `：${truncate(String(summary), 40)}` : ''}`
}

/** 列出脚本下的用户；只展示名称与用户 ID，不带账号等隐私字段 */
export function formatUserList(scriptName: string, result: UserGetOut): string {
  const index = result.index ?? []
  const lines: string[] = [`脚本「${scriptName}」的用户：`]
  if (!index.length) return `脚本「${scriptName}」下还没有用户。`
  for (const item of index) {
    const name = result.data?.[item.uid]?.Info?.Name ?? '未命名'
    lines.push(`- ${name}：${item.uid}`)
  }
  lines.push('用 mas开队 时可以直接写用户名称或 ID。')
  return lines.join('\n')
}

/** 启动失败时给出可能的候选名称，减少来回查表 */
export function suggestNames(names: string[], query: string, limit = 5): string {
  const text = normalizeSearch(query)
  const matched = text ? names.filter((name) => normalizeSearch(name).includes(text)) : names
  const chosen = (matched.length ? matched : names).slice(0, limit)
  return chosen.length ? `相近的有：${chosen.map((name) => `「${name}」`).join('、')}` : ''
}

export function formatRunningTasks(snapshot: TaskRuntimeSnapshot): string {
  const tasks = snapshot.tasks ?? []
  if (!tasks.length) return '当前没有运行中的任务，不需要停止。'
  return ['运行中的任务：', ...tasks.map((task) => `- ${describeTask(task)}`)].join('\n')
}

function describeTask(task: RuntimeTask): string {
  const parts: string[] = [task.taskId, task.mode ?? '未知模式']
  if (task.scriptId) parts.push(`脚本 ${shortId(task.scriptId)}`)
  if (task.queueId) parts.push(`队列 ${shortId(task.queueId)}`)
  if (task.isCycle) parts.push('循环')
  if (task.stopping) parts.push('正在停止')
  return parts.join(' · ')
}

function shortId(value: string): string {
  return value.length > 8 ? value.slice(0, 8) : value
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    running: '运行中',
    success: '成功',
    error: '失败',
    cancelled: '已取消',
  }
  return labels[status] ?? status
}
