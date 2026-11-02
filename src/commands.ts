import { spawn, spawnSync } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { h, type Context, type Element, type Session } from 'koishi'
import type { AutoMasClient } from './client'
import type { Config } from './config'
import { DEFAULT_LISTEN_PATH, HELP_TEXT, POWER_ALIASES, POWER_SIGNALS } from './constants'
import {
  findQueue,
  findScript,
  formatHistory,
  formatPower,
  formatQueueList,
  formatRunningTasks,
  formatScriptList,
  formatStatus,
  formatTaskList,
  formatTaskStatus,
  formatUserList,
  matchUsers,
  queueScriptIds,
  normalizeSearch,
  readPushSetting,
  resolveAdbTarget,
  scriptEntries,
  scriptName,
  suggestNames,
} from './handlers'
import type { Notifier } from './notify'
import type { ScriptsGetOut } from './types'
import { clampNumber, debugLog, describeFailure, expectedPushAddress, formatDate, getErrorMessage, logger, parseIdentity } from './utils'

export interface CommandDependencies {
  ctx: Context
  config: Config
  client: AutoMasClient
  notify: Notifier
}

const DAY = 86_400_000
const NL = String.fromCharCode(10)

function queueEntries(result: { index?: Array<{ uid: string }>; data?: Record<string, { Info?: { Name?: string } }> }): Array<{ uid: string; name: string }> {
  return (result.index ?? []).map((item) => ({ uid: item.uid, name: result.data?.[item.uid]?.Info?.Name ?? '未命名' }))
}

function screenshotImage(result: { image_base64?: string } | undefined, emptyText: string): string | Element {
  if (!result?.image_base64) return emptyText
  const buffer = Buffer.from(result.image_base64, 'base64')
  if (!buffer.length) return 'AUTO-MAS 返回的图片为空，请稍后重试'
  return h.image(buffer, 'image/png')
}

interface ResolvedUser {
  uid: string
  name: string
}

interface UserResolution {
  /** scriptId -> 匹配到的用户 ID */
  queueUserIds: Record<string, string[]>
  /** 队列里没有匹配到用户的脚本名 */
  skipped: string[]
  /** 一个脚本都没匹配上的用户名 */
  unmatched: string[]
  /** 在某个脚本里匹配到多个用户、无法确定的用户名 */
  ambiguous: string[]
}

export function registerCommands(deps: CommandDependencies): void {
  const { config, client, notify } = deps
  const ctx = deps.ctx

  const isAdmin = (session: Session): boolean => {
    for (const entry of config.admins) {
      const identity = parseIdentity(entry)
      if (identity && identity.platform === session.platform && identity.userId === String(session.userId)) return true
    }
    return false
  }

  const checkAdmin = (session: Session, label: string): boolean => {
    if (isAdmin(session)) {
      debugLog(config.debug, 'command', `${label} 管理员校验通过（${session.platform}:${session.userId}）`)
      return true
    }
    logger.warn(`[权限] ${session.platform}:${session.userId} 尝试使用 ${label}。`)
    void session.send(`该指令仅管理员可用\n把 ${session.platform}:${session.userId} 加入管理员配置后即可使用`)
    return false
  }

  /** 统一出口：兜住异常，给出可读原因而不是堆栈 */
  const run = async (label: string, task: () => Promise<string | Element | (string | Element)[]>): Promise<string | Element | (string | Element)[]> => {
    const started = Date.now()
    debugLog(config.debug, 'command', `${label} 开始`)
    try {
      const result = await task()
      debugLog(config.debug, 'command', `${label} 完成，用时 ${Date.now() - started}ms`)
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      logger.warn(`[指令] ${label} 失败: ${message}`)
      return `操作失败：${describeFailure(message)}`
    }
  }

  const MAS_IMAGES = ['AUTO-MAS.exe', 'auto-mas-runtime.exe']

  /** 统计本机同名进程数量 */
  const countProcess = (image: string): number => {
    const result = spawnSync('tasklist', ['/FI', `IMAGENAME eq ${image}`, '/FO', 'CSV', '/NH'], { windowsHide: true, encoding: 'utf8' })
    const text = String(result.stdout ?? '')
    return text.split(/\r?\n/).filter((line) => line.toLowerCase().includes(image.toLowerCase())).length
  }

  /** 关掉窗口与运行器；后端已由 /close 正常退出 */
  const killMasProcesses = (): void => {
    for (const image of MAS_IMAGES) {
      spawnSync('taskkill', ['/IM', image, '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
    }
  }

  const waitForProcessExit = async (seconds: number): Promise<boolean> => {
    const deadline = Date.now() + seconds * 1000
    do {
      if (MAS_IMAGES.every((image) => countProcess(image) === 0)) return true
      await new Promise((resolve) => setTimeout(resolve, 500))
    } while (Date.now() < deadline)
    return false
  }

  /** 判断 baseUrl 是否指向本机：启动/重启进程只能同机执行 */
  const isLocalBaseUrl = (baseUrl: string): boolean => {
    try {
      const host = new URL(baseUrl).hostname.toLowerCase()
      return ['127.0.0.1', 'localhost', '::1', '[::1]', '0.0.0.0'].includes(host)
    } catch {
      return false
    }
  }

  /** 按完整 ID 或唯一前缀在运行中任务里查找任务 */
  const resolveTaskId = (snapshot: { tasks?: Array<{ taskId: string }> }, input: string): { id?: string; candidates: string[] } => {
    const ids = (snapshot.tasks ?? []).map((task) => task.taskId)
    if (ids.includes(input)) return { id: input, candidates: [] }
    const matches = ids.filter((id) => id.startsWith(input))
    if (matches.length === 1) return { id: matches[0], candidates: [] }
    return { candidates: matches }
  }

  const waitForHealth = async (wantReady: boolean, seconds: number): Promise<boolean> => {
    const deadline = Date.now() + seconds * 1000
    let interval = 1000
    let lastNote = 0
    for (;;) {
      const health = await client.health(true).catch(() => undefined)
      if (wantReady ? health?.ready : !health?.ready) return true
      const elapsed = Math.round((Date.now() - (deadline - seconds * 1000)) / 1000)
      if (elapsed >= lastNote + 5) {
        lastNote = elapsed
        trace('wait', `等待${wantReady ? '就绪' : '关闭'}，已等待 ${elapsed}s`)
      }
      if (Date.now() + interval >= deadline) return false
      await new Promise((resolve) => setTimeout(resolve, interval))
      interval = Math.min(interval * 2, 5000)
    }
  }

  let cachedExePath: string | undefined

  /** 同步执行 PowerShell 并取标准输出，失败时返回空字符串 */
  const runPowerShell = (script: string): string => {
    const result = spawnSync('powershell', ['-NoProfile', '-Command', script], {
      windowsHide: true,
      encoding: 'utf8',
      timeout: 8000,
    })
    return String(result.stdout ?? '').trim()
  }

  /** 校验并清理候选路径：去掉引号与图标序号，确认 exe 存在 */
  const validExe = (path: string | undefined): string | undefined => {
    const cleaned = path?.trim().replace(/^"|"$/g, '').replace(/,\d+$/, '')
    if (cleaned && cleaned.toLowerCase().endsWith('.exe') && existsSync(cleaned)) return cleaned
    return undefined
  }

  /** 依次从运行中的进程、卸载注册表、开始菜单快捷方式识别启动文件 */
  const detectExePath = (): string | undefined => {
    const fromProcess = validExe(runPowerShell('(Get-Process -Name AUTO-MAS -ErrorAction SilentlyContinue | Select-Object -First 1).Path'))
    if (fromProcess) return fromProcess
    const registry = runPowerShell(
      "$paths=@('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'); " +
        "Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq 'AUTO-MAS' } | Select-Object -First 1 -ExpandProperty DisplayIcon"
    )
    const fromRegistry = validExe(registry)
    if (fromRegistry) return fromRegistry
    const shortcuts = [
      process.env.ProgramData ? `${process.env.ProgramData}\\Microsoft\\Windows\\Start Menu\\Programs\\AUTO-MAS.lnk` : '',
      process.env.APPDATA ? `${process.env.APPDATA}\\Microsoft\\Windows\\Start Menu\\Programs\\AUTO-MAS.lnk` : '',
    ].filter(Boolean)
    for (const shortcut of shortcuts) {
      if (!existsSync(shortcut)) continue
      const target = runPowerShell(`$s=(New-Object -ComObject WScript.Shell).CreateShortcut('${shortcut.replace(/'/g, "''")}'); $s.TargetPath`)
      const fromShortcut = validExe(target)
      if (fromShortcut) return fromShortcut
    }
    return undefined
  }

  /** 优先使用配置里的路径；否则自动识别并缓存 */
  const resolveMasExePath = (): string | undefined => {
    const configured = validExe(config.masExePath)
    if (configured) return configured
    if (cachedExePath) return cachedExePath
    const detected = detectExePath()
    if (detected) {
      cachedExePath = detected
      logger.info(`[进程] 已自动识别 AUTO-MAS 启动路径：${detected}`)
    }
    return detected
  }

  /** 当前进程所在会话是否存在可见桌面 */
  const hasInteractiveDesktop = (): boolean => {
    const output = runPowerShell(
      "$sid=(Get-Process -Id $PID).SessionId; $ex=@(Get-Process explorer -ErrorAction SilentlyContinue | Select-Object -ExpandProperty SessionId -Unique); \"{0}|{1}\" -f $sid, ($ex -join ',')"
    )
    const [sidText, sessionText] = output.split('|')
    const sid = Number.parseInt(sidText ?? '', 10)
    const sessions = (sessionText ?? '')
      .split(',')
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => !Number.isNaN(value))
    if (Number.isNaN(sid) || sessions.length === 0) return true
    return sessions.includes(sid)
  }

  const LAUNCH_TASK = 'Koishi-AUTO-MAS-Launcher'

  /** 在登录用户的交互会话里通过计划任务启动，避免 Session 0 启动后没有窗口 */
  const launchViaTask = (exePath: string): boolean => {
    const userSid = runPowerShell('([Security.Principal.WindowsIdentity]::GetCurrent()).User.Value')
    if (!userSid) return false
    const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const xml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers />
  <Principals>
    <Principal id="Author">
      <UserId>${escape(userSid)}</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${escape(exePath)}</Command>
      <WorkingDirectory>${escape(dirname(exePath))}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>`
    const file = join(tmpdir(), 'auto-mas-connector-launch.xml')
    try {
      writeFileSync(file, '﻿' + xml, 'utf16le')
      const create = spawnSync('schtasks', ['/Create', '/TN', LAUNCH_TASK, '/XML', file, '/F'], { windowsHide: true, encoding: 'utf8' })
      const runTask = spawnSync('schtasks', ['/Run', '/TN', LAUNCH_TASK], { windowsHide: true, encoding: 'utf8' })
      if (create.status !== 0 || runTask.status !== 0) {
        logger.warn(`[进程] 计划任务启动失败：${String(create.stderr || runTask.stderr || '').trim()}`)
        return false
      }
      debugLog(config.debug, 'process', `已通过计划任务在交互会话启动 ${exePath}`)
      return true
    } finally {
      rmSync(file, { force: true })
    }
  }

  const spawnMas = (exePath: string): void => {
    if (!existsSync(exePath)) throw new Error(`找不到 AUTO-MAS 启动文件：${exePath}`)
    const env = { ...process.env }
    delete env.ELECTRON_RUN_AS_NODE
    const child = spawn(exePath, [], {
      cwd: dirname(exePath),
      detached: true,
      stdio: 'ignore',
      env,
    })
    child.on('error', (error) => logger.warn(`[进程] 启动失败：${getErrorMessage(error)}`))
    child.unref()
    debugLog(config.debug, 'process', `已启动 ${exePath}（PID ${child.pid ?? 'unknown'}）`)
  }

  /** 指令级调试日志：记录参数、匹配结果与关键返回值 */
  const trace = (label: string, detail: string): void => {
    debugLog(config.debug, 'command', `${label} ${detail}`)
  }

  const alias = <T extends { alias(...names: string[]): T }>(command: T, name: string): T => {
    if (config.enableChineseAlias) command.alias(name)
    return command
  }

  /** 启动失败时列出当前脚本与队列，省得用户再查一次 */
  const describeTargets = async (): Promise<string> => {
    const [scripts, queues] = await Promise.all([client.getScripts(), client.getQueues()])
    const scriptNames = scriptEntries(scripts).map((item) => item.name).filter(Boolean)
    const queueNames = queueEntries(queues).map((item) => item.name).filter(Boolean)
    const lines = ['请带上脚本或队列的 ID / 名称：']
    if (scriptNames.length) lines.push(`脚本：${scriptNames.map((name) => `「${name}」`).join('、')}`)
    if (queueNames.length) lines.push(`队列：${queueNames.map((name) => `「${name}」`).join('、')}`)
    if (!scriptNames.length && !queueNames.length) lines.push('AUTO-MAS 里还没有脚本或队列')
    return lines.join('\n')
  }

  /** 读取脚本下的用户，data 是权威来源，index 只用来保持顺序 */
  const loadUsers = async (scriptId: string): Promise<ResolvedUser[]> => {
    const result = await client.getUsers(scriptId)
    const data = result.data ?? {}
    const ordered = (result.index ?? []).map((item) => item.uid).filter((uid) => data[uid])
    const uids = ordered.length ? ordered : Object.keys(data)
    const users = uids.map((uid) => ({ uid, name: data[uid]?.Info?.Name ?? uid }))
    trace('加载用户', `脚本 ${scriptId}：${users.length} 个`)
    return users
  }

  const matchUser = (users: ResolvedUser[], token: string): ResolvedUser | undefined => {
    const matched = matchUsers(users, token)
    return matched.length === 1 ? matched[0] : undefined
  }

  /** 把用户名称解析成队列里每个脚本各自的用户 ID */
  const resolveQueueUsers = async (scriptIds: string[], scripts: ScriptsGetOut, tokens: string[]): Promise<UserResolution> => {
    const names = new Map<string, string>()
    for (const item of scriptEntries(scripts)) {
      names.set(item.uid, item.name)
    }

    const resolution: UserResolution = { queueUserIds: {}, skipped: [], unmatched: [...tokens], ambiguous: [] }
    for (const scriptId of scriptIds) {
      const users = await loadUsers(scriptId)
      const matched: string[] = []
      for (const token of tokens) {
        const candidates = matchUsers(users, token)
        if (candidates.length > 1) {
          if (!resolution.ambiguous.includes(token)) resolution.ambiguous.push(token)
          continue
        }
        if (!candidates.length) continue
        const user = candidates[0]
        if (!matched.includes(user.uid)) matched.push(user.uid)
        const index = resolution.unmatched.indexOf(token)
        if (index >= 0) resolution.unmatched.splice(index, 1)
      }
      resolution.queueUserIds[scriptId] = matched
      if (!matched.length) resolution.skipped.push(names.get(scriptId) ?? scriptId)
    }
    return resolution
  }

  ctx.command('mas', 'AUTO-MAS 控制')
    .usage(HELP_TEXT)
    .action(({ session }) => {
      if (!session) return ''
      trace('mas', '显示帮助')
      return HELP_TEXT
    })

  alias(ctx.command('mas.status', '查看 AUTO-MAS 状态'), 'mas状态')
    .usage('检查后端是否就绪，并列出运行中的任务、已安排的脚本数量与推送状态。')
    .example('mas.status')
    .action(({ session }) => {
      if (!session) return ''
      return run('mas.status', async () => {
        const [health, snapshot] = await Promise.all([client.health(), client.getRuntimeSnapshot()])
        let pushInfo
        try {
          pushInfo = readPushSetting(await client.getSetting())
        } catch {
          pushInfo = undefined
        }
        trace('mas.status', `ready=${String(health.ready)}，运行中 ${snapshot.tasks?.length ?? 0}，已安排 ${snapshot.scheduledScripts?.length ?? 0}，推送 ${pushInfo ? (pushInfo.enabled ? '已启用' : '未启用') : '未知'}`)
        return formatStatus(health, snapshot, pushInfo)
      })
    })

  alias(ctx.command('mas.task [taskId:string]', '查看任务状态'), 'mas任务')
    .usage('不带参数时列出运行中的任务；带完整任务 ID 或运行中任务 ID 的前缀时查询该任务的结果。')
    .example('mas.task')
    .example('mas.task 0f6f0c8e-2f4a-4a7f-9f2e-8f6a1c3d5b7e')
    .action(({ session }, taskId) => {
      if (!session) return ''
      return run('mas.task', async () => {
        if (!taskId) {
          const snapshot = await client.getRuntimeSnapshot()
          trace('mas.task', `列出运行中任务：${snapshot.tasks?.length ?? 0} 个`)
          return formatTaskList(snapshot)
        }
        let resolvedId = taskId
        if (!/^[0-9a-f-]{36}$/i.test(taskId)) {
          const snapshot = await client.getRuntimeSnapshot()
          const resolved = resolveTaskId(snapshot, taskId)
          if (!resolved.id) {
            if (resolved.candidates.length) {
              return [`有多个任务匹配「${taskId}」`, ...resolved.candidates.map((id) => `· ${id}`), '请改用更长的 ID'].join(NL)
            }
            return `运行中的任务里没有匹配「${taskId}」的 ID${NL}用 mas.task 查看运行中的任务，或粘贴完整任务 ID`
          }
          resolvedId = resolved.id
        }
        const status = await client.getTask(resolvedId)
        trace('mas.task', `查询任务 ${resolvedId}：${status.status ?? '未知状态'}`)
        return formatTaskStatus(status)
      })
    })

  alias(ctx.command('mas.queue', '查看调度队列'), 'mas队列')
    .option('verbose', '-v, --verbose 显示完整 ID')
    .usage('列出调度队列、是否启用定时或循环，以及队列 ID；ID 默认只显示前 8 位。')
    .example('mas.queue')
    .action(({ session, options }) => {
      if (!session) return ''
      return run('mas.queue', async () => {
        const result = await client.getQueues()
        trace('mas.queue', `verbose=${Boolean(options?.verbose)}，返回 ${result.index?.length ?? 0} 个队列`)
        return formatQueueList(result, Boolean(options?.verbose))
      })
    })

  alias(ctx.command('mas.scripts', '查看脚本配置'), 'mas脚本')
    .option('verbose', '-v, --verbose 显示完整 ID')
    .usage('列出脚本配置、所属游戏与脚本 ID；ID 默认只显示前 8 位。')
    .example('mas.scripts')
    .action(({ session, options }) => {
      if (!session) return ''
      return run('mas.scripts', async () => {
        const result = await client.getScripts()
        trace('mas.scripts', `verbose=${Boolean(options?.verbose)}，返回 ${result.index?.length ?? 0} 个脚本`)
        return formatScriptList(result, Boolean(options?.verbose))
      })
    })

  alias(ctx.command('mas.users [script:string]', '查看脚本下的用户'), 'mas用户')
    .option('verbose', '-v, --verbose 显示完整用户 ID')
    .usage('不带参数时列出脚本和用户数量；带脚本 ID 或名称时列出该脚本下的用户名与用户 ID。')
    .example('mas.users')
    .example('mas.users 剿灭')
    .action(({ session, options }, scriptQuery) => {
      if (!session) return ''
      return run('mas.users', async () => {
        const scripts = await client.getScripts()
        const items = scriptEntries(scripts)
        trace('mas.users', `脚本 ${items.length} 个，参数「${scriptQuery ?? ''}」`)
        if (!items.length) return 'AUTO-MAS 里还没有脚本配置'

        if (!scriptQuery) {
          const lines = [`脚本与用户数量（${items.length} 个）`]
          for (const item of items) {
            const result = await client.getUsers(item.uid)
            const count = (result.index?.length ?? 0) || Object.keys(result.data ?? {}).length
            lines.push(`· ${item.name} ${count} 个用户`)
          }
          trace('mas.users', `概览：${items.length} 个脚本`)
          lines.push('', '用 mas用户 [脚本] 查看具体用户')
          return lines.join('\n')
        }

        const text = scriptQuery.trim()
        const key = normalizeSearch(text)
        const matches = items.filter((item) => item.uid === text || item.name === text || normalizeSearch(item.name) === key)
        const chosen = matches.length ? matches : items.filter((item) => normalizeSearch(item.name).includes(key))
        if (!chosen.length) {
          const names = items.map((item) => item.name)
          const hint = suggestNames(names, text)
          return [`没有找到名称里包含「${text}」的脚本`, hint].filter(Boolean).join('\n')
        }
        trace('mas.users', `命中 ${chosen.length} 个脚本：${chosen.map((item) => item.name).join('、')}`)
        const blocks: string[] = []
        for (const item of chosen.slice(0, 3)) {
          blocks.push(formatUserList(item.name, await client.getUsers(item.uid), Boolean(options?.verbose)))
        }
        return blocks.join('\n\n')
      })
    })

  alias(ctx.command('mas.history [days:number]', '查询执行历史'), 'mas历史')
    .usage('按天查询执行历史，默认最近 1 天，最多 90 天；兼容 AUTO-MAS 5.7 与 5.8。')
    .example('mas.history')
    .example('mas.history 7')
    .action(({ session }, days) => {
      if (!session) return ''
      return run('mas.history', async () => {
        const span = clampNumber(days ?? 1, 1, 90, 1)
        const end = new Date()
        const start = new Date(end.getTime() - (span - 1) * DAY)
        trace('mas.history', `${span} 天：${formatDate(start)} ~ ${formatDate(end)}`)
        const result = await client.searchHistory('DAILY', formatDate(start), formatDate(end))
        trace('mas.history', `返回 ${Object.keys(result.data ?? {}).length} 天记录`)
        return formatHistory(result)
      })
    })

  alias(ctx.command('mas.start [query:string]', '启动脚本或队列'), 'mas启动')
    .option('cycle', '-c, --cycle 以循环模式启动队列')
    .usage('参数可以是脚本或队列的 ID，也可以是名称；先匹配脚本，再匹配队列。')
    .example('mas.start')
    .example('mas.start 剿灭 -c')
    .action(({ session, options }, query) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.start')) return ''
      const cycle = Boolean(options?.cycle)
      trace('mas.start', `参数「${query ?? ''}」，循环 ${cycle}`)
      return run('mas.start', async () => {
        if (!query) return describeTargets()

        const [scripts, queues] = await Promise.all([client.getScripts(), client.getQueues()])
        const script = findScript(scripts, query)
        if (script) {
          trace('mas.start', `匹配脚本「${script.name}」（${script.uid}）`)
          const result = await client.startTask(script.uid, 'AutoProxy')
          trace('mas.start', `脚本任务已提交：${result.taskId}`)
          return `已启动脚本「${script.name}」\n任务 ID ${result.taskId}\n用 mas.task ${result.taskId} 查看进度`
        }
        const queue = findQueue(queues, query)
        if (!queue) {
          const names = [
            ...scriptEntries(scripts).map((item) => item.name).filter(Boolean),
            ...queueEntries(queues).map((item) => item.name).filter(Boolean),
          ]
          const hint = suggestNames(names, query)
          return [`没有找到 ID 或名称是「${query}」的脚本或队列`, hint].filter(Boolean).join('\n')
        }
        trace('mas.start', `匹配队列「${queue.name}」（${queue.uid}），循环 ${cycle}`)
        if (cycle && !queue.cycleEnabled) return `队列「${queue.name}」没有启用循环\n请先去掉 -c，或在 AUTO-MAS 里打开循环`
        const result = await client.startTask(queue.uid, cycle ? 'CycleRun' : 'AutoProxy')
        trace('mas.start', `队列任务已提交：${result.taskId}`)
        return `已启动队列「${queue.name}」${cycle ? '（循环）' : ''}\n任务 ID ${result.taskId}`
      })
    })

  alias(ctx.command('mas.startqueue [queue:string] [users:text]', '用指定用户启动队列'), 'mas开队')
    .usage(
      '第一个参数是队列 ID 或名称，后面跟一个或多个用户名 / 用户 ID。\n' +
      '用户会按队列里每个脚本分别匹配；没有匹配到用户的脚本本次跳过。',
    )
    .example('mas.startqueue 剿灭 affk10')
    .action(({ session }, queueQuery, userText) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.startqueue')) return ''
      const tokens = String(userText ?? '')
        .split(/[,，、\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
      trace('mas.startqueue', `队列「${queueQuery ?? ''}」，用户「${tokens.join('、')}」`)
      return run('mas.startqueue', async () => {
        if (!queueQuery) {
          const queues = await client.getQueues()
          const names = queueEntries(queues).map((item) => item.name).filter(Boolean)
          return names.length
            ? `请带上队列 ID 或名称：${names.map((name) => `「${name}」`).join('、')}`
            : 'AUTO-MAS 里还没有调度队列'
        }
        if (!tokens.length) return '请至少提供一个用户名或用户 ID\n可用 mas.users 「脚本名称」 查看'

        const [queues, scripts] = await Promise.all([client.getQueues(), client.getScripts()])
        const queue = findQueue(queues, queueQuery)
        if (queue) trace('mas.startqueue', `匹配队列「${queue.name}」（${queue.uid}）`)
        if (!queue) {
          const hint = suggestNames(queueEntries(queues).map((item) => item.name), queueQuery)
          return [`没有找到 ID 或名称是「${queueQuery}」的队列`, hint].filter(Boolean).join('\n')
        }

        const scriptIds = queueScriptIds(await client.getQueueItems(queue.uid))
        trace('mas.startqueue', `队列项脚本 ${scriptIds.length} 个：${scriptIds.join('、')}`)
        if (!scriptIds.length) {
          return `队列「${queue.name}」里没有已绑定脚本的队列项\n先在 AUTO-MAS 里给队列添加脚本`
        }

        const resolution = await resolveQueueUsers(scriptIds, scripts, tokens)
        trace(
          'mas.startqueue',
          `匹配结果：${Object.entries(resolution.queueUserIds).map(([id, users]) => `${id.slice(0, 8)}=${users.length}`).join('，')}；` +
            `跳过 ${resolution.skipped.length}，未匹配 ${resolution.unmatched.length}，歧义 ${resolution.ambiguous.length}`,
        )
        if (resolution.ambiguous.length) {
          return [
            `这些用户名在脚本里匹配到多个用户，请写得更具体：${resolution.ambiguous.join('、')}`,
            '可用 mas用户 [脚本] 查看用户名与 ID',
          ].join('\n')
        }
        if (resolution.unmatched.length) {
          const names = new Set<string>()
          for (const scriptId of scriptIds) {
            for (const user of await loadUsers(scriptId)) names.add(user.name)
          }
          const hint = suggestNames([...names], resolution.unmatched[0])
          return [
            `这些用户没有匹配到任何脚本：${resolution.unmatched.join('、')}`,
            [...names].length ? `当前脚本里的用户：${[...names].slice(0, 8).join('、')}` : '',
            hint,
          ].filter(Boolean).join('\n')
        }

        const matchedCounts = Object.values(resolution.queueUserIds).filter((list) => list.length)
        const users = new Set(matchedCounts.flat())
        let result
        try {
          result = await client.startQueueWithUsers(queue.uid, resolution.queueUserIds)
        } catch (error) {
          const message = getErrorMessage(error)
          if (message.includes('不属于脚本')) {
            return [
              `启动失败：${message}`,
              '提示：用户必须来自脚本配置内部，不能直接用 QQ 号',
              '先用 mas.users 「脚本名称」 查看用户名和用户 ID',
            ].join(String.fromCharCode(10))
          }
          throw error
        }
        trace('mas.startqueue', `任务已提交：${result.taskId}，用户 ${users.size} 个，脚本 ${matchedCounts.length} 个`)
        const lines = [`已用 ${users.size} 个用户启动队列「${queue.name}」中的 ${matchedCounts.length} 个脚本`,
`任务 ID ${result.taskId}`]
        if (resolution.skipped.length) lines.push('', `跳过的脚本 ${resolution.skipped.join('、')}（这些脚本里没有匹配的用户）`)
        return lines.join('\n')
      })
    })

  alias(ctx.command('mas.stop [taskId:string]', '停止任务'), 'mas停止')
    .usage('不带参数时列出运行中的任务；带完整任务 ID 或运行中任务 ID 的前缀时停止该任务。')
    .example('mas.stop')
    .example('mas.stop 0f6f0c8e-2f4a-4a7f-9f2e-8f6a1c3d5b7e')
    .action(({ session }, taskId) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.stop')) return ''
      return run('mas.stop', async () => {
        if (!taskId) {
          const snapshot = await client.getRuntimeSnapshot()
          trace('mas.stop', `列出运行中任务：${snapshot.tasks?.length ?? 0} 个`)
          return formatRunningTasks(snapshot)
        }
        let resolvedId = taskId
        if (!/^[0-9a-f-]{36}$/i.test(taskId)) {
          const snapshot = await client.getRuntimeSnapshot()
          const resolved = resolveTaskId(snapshot, taskId)
          if (!resolved.id) {
            if (resolved.candidates.length) {
              return [`有多个任务匹配「${taskId}」`, ...resolved.candidates.map((id) => `· ${id}`), '请改用更长的 ID'].join(NL)
            }
            return `运行中的任务里没有匹配「${taskId}」的 ID${NL}用 mas停止 列出运行中的任务，或粘贴完整任务 ID`
          }
          resolvedId = resolved.id
        }
        trace('mas.stop', `停止任务 ${resolvedId}`)
        await client.stopTask(resolvedId)
        return `已请求停止任务 ${resolvedId}
用 mas.task ${resolvedId} 确认状态`
      })
    })

  alias(ctx.command('mas.power [action:string]', '执行电源操作'), 'mas电源')
    .option('yes', '-y, --yes 确认执行')
    .usage('设置所有任务结束后执行的电源操作（控制电脑关机、重启、休眠等），不会立即执行；必须加 -y 确认。NoAction 表示取消。')
    .example('mas.power')
    .example('mas.power 重启 -y')
    .action(({ session, options }, action) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.power')) return ''
      if (!action) return formatPowerHelp()
      trace('mas.power', `操作「${action}」，确认 ${Boolean(options?.yes)}`)
      const signal = resolvePowerSignal(action)
      if (!signal) {
        return `无法识别电源操作「${action}」\n支持：${POWER_SIGNALS.join(' / ')}，也可以用中文（关机、重启、休眠等）`
      }
      if (!options?.yes) return `将设置电源操作 ${signal}，在所有任务结束后执行\n确认请改为：mas.power ${action} -y`
      return run('mas.power', async () => {
        trace('mas.power', `提交信号 ${signal}`)
        await client.setPower(signal)
        return `已设置电源操作 ${signal}\n将在所有任务结束后执行；当前没有运行任务时不会触发\n用 mas.power NoAction -y 可取消`
      })
    })

  alias(ctx.command('mas.process [action:string]', '管理 AUTO-MAS 进程'), 'mas进程')
    .option('yes', '-y, --yes 确认执行')
    .usage('查看、关闭、启动或重启 AUTO-MAS；同机关闭会退出窗口与后端，跨机只能关闭后端；启动和重启需要同机并配置启动路径。必须加 -y 才会执行。')
    .example('mas.process')
    .example('mas.process 重启 -y')
    .action(({ session, options }, action) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.process')) return ''
      const text = String(action ?? '').trim()
      const command = resolveProcessAction(text)
      trace('mas.process', `操作「${text || '状态'}」，确认 ${Boolean(options?.yes)}`)
      if (!text || command === 'status') {
        return run('mas.process', async () => {
          const health = await client.health().catch(() => undefined)
          const local = isLocalBaseUrl(config.baseUrl)
          return [
            `AUTO-MAS ${health?.ready ? `运行中 · ${health.version ?? 'unknown'}` : '未运行'}`,
            '',
            `进程管理 ${config.processControl ? '已启用' : '未启用'}`,
            `启动路径 ${resolveMasExePath() ?? '未识别'}`,
            `地址 ${config.baseUrl}（${local ? '同机' : '跨机，仅支持关闭后端'}）`,
          ].join('\n')
        })
      }
      if (!command) return `无法识别操作「${text}」\n支持：状态、关闭、启动、重启`
      if (command === 'close') {
        if (!options?.yes) {
          const scope = isLocalBaseUrl(config.baseUrl) ? '并退出窗口' : '（仅后端）'
          return `将关闭 AUTO-MAS${scope}，正在运行的任务会被中断\n确认请改为：mas.process 关闭 -y`
        }
        return run('mas.process', async () => {
          const local = isLocalBaseUrl(config.baseUrl)
          const health = await client.health().catch(() => undefined)
          if (health?.ready) {
            await client.close().catch((error) => debugLog(config.debug, 'process', `关闭请求失败：${getErrorMessage(error)}`))
            await waitForHealth(false, Math.min(config.processTimeout, 20))
          }
          if (!local) {
            return '已请求关闭远程 AUTO-MAS 的后端\n跨机部署无法关闭那台机器上的窗口，需要手动退出程序'
          }
          killMasProcesses()
          const gone = await waitForProcessExit(15)
          trace('mas.process', `关闭进程：${gone ? '完成' : '超时'}`)
          return gone
            ? '已关闭 AUTO-MAS（窗口与后端）'
            : '后端已关闭，但还有 AUTO-MAS 进程没有退出\n请到任务管理器检查'
        })
      }
      if (!config.processControl) return '进程管理未启用\n请先在配置的「进程管理」中开启'
      if (!isLocalBaseUrl(config.baseUrl)) return '当前连接的是跨机 AUTO-MAS\n插件只能在同机拉起进程，关闭可以正常使用'
      const exePath = resolveMasExePath()
      if (!exePath) return '自动识别 AUTO-MAS 启动路径失败\n请在配置的「进程管理」中填写启动文件路径'
      if (!options?.yes) return `将${commandLabel(command)} AUTO-MAS（会先退出当前进程）\n确认请改为：mas.process ${text} -y`
      return run('mas.process', async () => {
        const health = await client.health().catch(() => undefined)
        if (command === 'start' && health?.ready) return `AUTO-MAS 已在运行（${health.version ?? 'unknown'}），无需启动`
        if (command === 'restart' && health?.ready) {
          await client.close().catch((error) => debugLog(config.debug, 'process', `关闭请求失败：${getErrorMessage(error)}`))
          await waitForHealth(false, Math.min(config.processTimeout, 20))
        }
        killMasProcesses()
        const gone = await waitForProcessExit(15)
        trace('mas.process', `清理旧进程：${gone ? '完成' : '超时'}`)
        if (!gone) return '旧进程没有完全退出，已取消启动，避免出现两个实例'
        if (!hasInteractiveDesktop() && launchViaTask(exePath)) {
          trace('mas.process', '会话无桌面，已改用计划任务启动')
        } else {
          spawnMas(exePath)
        }
        const ready = await waitForHealth(true, config.processTimeout)
        if (!ready) return '已启动进程，但在等待时间内没有就绪\n请查看 AUTO-MAS 的日志'
        const next = await client.health().catch(() => undefined)
        return `已${command === 'restart' ? '重启' : '启动'} AUTO-MAS${next?.version ? `（${next.version}）` : ''}`
      })
    })

  alias(ctx.command('mas.test', '发送测试通知'), 'mas测试')
    .usage('向通知配置里的所有目标发送一条测试消息，用来检查 Koishi 到聊天平台的链路。')
    .example('mas.test')
    .action(({ session }) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.test')) return ''
      return run('mas.test', async () => {
        trace('mas.test', `目标 ${config.notifyTargets.length} 个`)
        const result = await notify.sendTest()
        trace('mas.test', `结果 ${result.split('\n').length} 行`)
        return result
      })
    })

  alias(ctx.command('mas.screenshot [title:text]', '截取游戏窗口'), 'mas截图')
    .usage('按配置的截图方式执行：自动、窗口或 ADB；-a 强制使用 ADB。ADB 路径或序列号留空时会自动识别。')
    .option('adb', '-a, --adb 直接使用 ADB 截图')
    .example('mas.screenshot')
    .example('mas.screenshot -a')
    .action(({ session, options }, title) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.screenshot')) return ''
      return run('mas.screenshot', async () => {
        const mode = options?.adb ? 'adb' : config.screenshotMode
        trace('mas.screenshot', `方式 ${mode}，窗口「${title?.trim() || config.gameWindow}」`)
        const captureWindow = async () => {
          const result = await client.screenshot(title?.trim() || config.gameWindow)
          trace('mas.screenshot', `窗口截图返回 ${result.image_base64?.length ?? 0} 字节 base64`)
          return screenshotImage(result, 'AUTO-MAS 没有返回图片，请确认游戏窗口标题是否正确')
        }
        const captureAdb = async (): Promise<string | Element> => {
          const target = await resolveAdbTarget(client, config)
          trace('mas.screenshot', `ADB 目标：path=${target.adbPath ?? '(空)'}，serial=${target.serial ?? '(空)'}，备注 ${target.notes.length} 条`)
          if (!target.adbPath || !target.serial) {
            const hint = target.notes.length ? `\n${target.notes.join('\n')}` : ''
            throw new Error(`没有找到可用的 ADB\n先启动模拟器，或在「截图」分组填写 adb 路径与设备序列号${hint}`)
          }
          const result = await client.screenshotAdb(target.adbPath, target.serial)
          trace('mas.screenshot', `ADB 截图返回 ${result.image_base64?.length ?? 0} 字节 base64`)
          return screenshotImage(result, 'ADB 没有返回图片，请确认设备序列号是否正确')
        }
        if (mode === 'adb') return captureAdb()
        if (mode === 'window') return captureWindow()
        try {
          return await captureWindow()
        } catch (windowError) {
          debugLog(config.debug, '截图', `窗口截图失败，改用 ADB: ${getErrorMessage(windowError)}`)
          try {
            return await captureAdb()
          } catch (adbError) {
            return `窗口截图失败：${getErrorMessage(windowError)}\nADB 截图失败：${getErrorMessage(adbError)}`
          }
        }
      })
    })

  alias(ctx.command('mas.push [address:string]', 'AUTO-MAS 推送设置'), 'mas推送')
    .option('enable', '-e, --enable 启用 AUTO-MAS 的 Koishi 推送')
    .option('disable', '-d, --disable 关闭 AUTO-MAS 的 Koishi 推送')
    .option('test', '-t, --test 让 AUTO-MAS 发一条测试通知')
    .usage(
      '查看或修改 AUTO-MAS 的 Koishi 推送设置。\n' +
      '启用时默认使用 ws://127.0.0.1:5140' + DEFAULT_LISTEN_PATH + '，也可在参数里写完整地址；令牌跟随插件配置。\n' +
      'AUTO-MAS 只在启动时初始化推送通道，修改后需要重启一次。',
    )
    .example('mas.push')
    .example('mas.push -e')
    .example('mas.push ws://192.168.5.20:5140/AUTO_MAS -e')
    .action(({ session, options }, address) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.push')) return ''
      return run('mas.push', async () => {
        trace('mas.push', `参数「${address ?? ''}」，enable=${Boolean(options?.enable)}，disable=${Boolean(options?.disable)}，test=${Boolean(options?.test)}`)
        if (options?.disable) {
          await client.updateNotifySetting({ IfKoishiSupport: false })
          return '已关闭 AUTO-MAS 的 Koishi 推送'
        }
        if (options?.enable) {
          const target = String(address ?? '').trim() || expectedPushAddress(config)
          await client.updateNotifySetting({
            IfKoishiSupport: true,
            KoishiServerAddress: target,
            KoishiToken: config.token,
          })
          return [
            '已启用 AUTO-MAS 的 Koishi 推送',
            `地址 ${target}`,
            `令牌 ${config.token ? '与插件一致' : '未设置'}`,
            '设置已写入',
            '需要重启一次 AUTO-MAS 才会启动推送通道',
            '重启后可用 mas推送 -t 验证',
          ].join('\n')
        }
        if (options?.test) {
          try {
            await client.testNotify()
            return '已请求 AUTO-MAS 发送测试通知\n请查看聊天目标是否收到'
          } catch (error) {
            const message = getErrorMessage(error)
            if (/koishi/i.test(message)) {
              return [
                `测试通知发送失败：${message}`,
                'AUTO-MAS 的 Koishi 推送通道未启动',
                '修改推送设置后需要重启一次 AUTO-MAS',
                '重启后仍失败时，检查 KoishiServerAddress 是否为 ws://<Koishi 地址>:<端口>/AUTO_MAS，以及该端口是否可达。',
              ].join('\n')
            }
            throw error
          }
        }

        const push = readPushSetting(await client.getSetting())
        const expected = expectedPushAddress(config)
        const lines = [
          `推送 ${push.enabled ? '已启用' : '未启用'}`,
          `地址 ${push.address || '未设置'}`,
          `令牌 ${push.tokenConfigured ? '已设置' : '未设置'}`,
          `建议 ${expected}`,
        ]
        if (!push.enabled) lines.push('启用：mas推送 -e，写入后重启 AUTO-MAS')
        else if (push.address && push.address !== expected) lines.push('当前地址与建议值不同，如有需要可重新执行 mas推送 -e')
        else lines.push('修改设置后需重启 AUTO-MAS 才会生效')
        return lines.join('\n')
      })
    })

  alias(ctx.command('mas.whoami', '查看自己的平台标识'), 'mas我是谁')
    .usage('显示 平台:用户ID，用来填写管理员名单。')
    .example('mas.whoami')
    .action(({ session }) => {
      if (!session) return ''
      const identity = `${session.platform}:${session.userId}`
      trace('mas.whoami', `${identity}，管理员 ${isAdmin(session)}`)
      return `你的标识：${identity}\n管理员权限：${isAdmin(session) ? '可用' : '不可用（把上面的标识加入管理员配置即可）'}`
    })
}

function formatPowerHelp(): string {
  return [
    '电源操作控制电脑关机、重启、休眠、注销等，在所有任务结束后执行，不会立即生效；必须加 -y 确认',
    '支持的写法：',
    '- 关机 / shutdown',
    '- 强制关机 / shutdownforce',
    '- 重启 / reboot',
    '- 休眠 / hibernate',
    '- 睡眠 / sleep',
    '- 退出 / killself',
    '- 重启自身 / restartself',
    '- 注销 / logoff',
    '示例：mas.power 重启 -y',
  ].join('\n')
}

function resolveProcessAction(input: string): 'status' | 'close' | 'start' | 'restart' | undefined {
  const text = input.trim().toLowerCase()
  if (!text) return 'status'
  if (['状态', '查看', 'status'].includes(text)) return 'status'
  if (['关闭', '退出', 'close', 'stop'].includes(text)) return 'close'
  if (['启动', 'start', 'launch'].includes(text)) return 'start'
  if (['重启', 'restart', 'relaunch'].includes(text)) return 'restart'
  return undefined
}

function commandLabel(command: 'start' | 'restart'): string {
  return command === 'restart' ? '重启' : '启动'
}

function resolvePowerSignal(input: string | undefined): string | undefined {
  const text = String(input ?? '').trim()
  if (!text) return undefined
  const direct = POWER_ALIASES[text.toLowerCase()] ?? POWER_ALIASES[text]
  if (direct) return direct
  const upper = text.toUpperCase()
  return (POWER_SIGNALS as readonly string[]).includes(upper) ? upper : undefined
}
