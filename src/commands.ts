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
import { clampNumber, expectedPushAddress, formatDate, getErrorMessage, logger, parseIdentity } from './utils'

export interface CommandDependencies {
  ctx: Context
  config: Config
  client: AutoMasClient
  notify: Notifier
}

const DAY = 86_400_000

function queueEntries(result: { index?: Array<{ uid: string }>; data?: Record<string, { Info?: { Name?: string } }> }): Array<{ uid: string; name: string }> {
  return (result.index ?? []).map((item) => ({ uid: item.uid, name: result.data?.[item.uid]?.Info?.Name ?? '未命名' }))
}

function screenshotImage(result: { image_base64?: string } | undefined, emptyText: string): string | Element {
  if (!result?.image_base64) return emptyText
  const buffer = Buffer.from(result.image_base64, 'base64')
  if (!buffer.length) return 'AUTO-MAS 返回的图片为空，请稍后重试。'
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
    if (isAdmin(session)) return true
    logger.warn(`[权限] ${session.platform}:${session.userId} 尝试使用 ${label}。`)
    void session.send(`该指令仅管理员可用；把 ${session.platform}:${session.userId} 加入管理员配置后即可使用。`)
    return false
  }

  /** 统一出口：兜住异常，给出可读原因而不是堆栈 */
  const run = async (label: string, task: () => Promise<string | Element | (string | Element)[]>): Promise<string | Element | (string | Element)[]> => {
    try {
      return await task()
    } catch (error) {
      const message = getErrorMessage(error)
      logger.warn(`[指令] ${label} 失败: ${message}`)
      return `操作失败：${message}`
    }
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
    if (!scriptNames.length && !queueNames.length) lines.push('AUTO-MAS 里还没有脚本或队列。')
    return lines.join('\n')
  }

  /** 读取脚本下的用户，data 是权威来源，index 只用来保持顺序 */
  const loadUsers = async (scriptId: string): Promise<ResolvedUser[]> => {
    const result = await client.getUsers(scriptId)
    const data = result.data ?? {}
    const ordered = (result.index ?? []).map((item) => item.uid).filter((uid) => data[uid])
    const uids = ordered.length ? ordered : Object.keys(data)
    return uids.map((uid) => ({ uid, name: data[uid]?.Info?.Name ?? uid }))
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
    .action(({ session }) => (session ? HELP_TEXT : ''))

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
        return formatStatus(health, snapshot, pushInfo)
      })
    })

  alias(ctx.command('mas.task [taskId:string]', '查看任务状态'), 'mas任务')
    .usage('不带参数时列出运行中的任务；带任务 ID 时查询该任务的结果。')
    .example('mas.task')
    .example('mas.task 0f6f0c8e-2f4a-4a7f-9f2e-8f6a1c3d5b7e')
    .action(({ session }, taskId) => {
      if (!session) return ''
      return run('mas.task', async () => {
        if (!taskId) return formatTaskList(await client.getRuntimeSnapshot())
        return formatTaskStatus(await client.getTask(taskId))
      })
    })

  alias(ctx.command('mas.queue', '查看调度队列'), 'mas队列')
    .option('verbose', '-v, --verbose 显示完整 ID')
    .usage('列出调度队列、是否启用定时或循环，以及队列 ID；ID 默认只显示前 8 位。')
    .example('mas.queue')
    .action(({ session, options }) => {
      if (!session) return ''
      return run('mas.queue', async () => formatQueueList(await client.getQueues(), Boolean(options?.verbose)))
    })

  alias(ctx.command('mas.scripts', '查看脚本配置'), 'mas脚本')
    .option('verbose', '-v, --verbose 显示完整 ID')
    .usage('列出脚本配置、所属游戏与脚本 ID；ID 默认只显示前 8 位。')
    .example('mas.scripts')
    .action(({ session, options }) => {
      if (!session) return ''
      return run('mas.scripts', async () => formatScriptList(await client.getScripts(), Boolean(options?.verbose)))
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
        if (!items.length) return 'AUTO-MAS 里还没有脚本配置。'

        if (!scriptQuery) {
          const lines = [`脚本与用户数量（${items.length} 个）`]
          for (const item of items) {
            const result = await client.getUsers(item.uid)
            const count = (result.index?.length ?? 0) || Object.keys(result.data ?? {}).length
            lines.push(`· ${item.name} ${count} 个用户`)
          }
          lines.push('用 mas用户 [脚本] 查看具体用户。')
          return lines.join('\n')
        }

        const text = scriptQuery.trim()
        const key = normalizeSearch(text)
        const matches = items.filter((item) => item.uid === text || item.name === text || normalizeSearch(item.name) === key)
        const chosen = matches.length ? matches : items.filter((item) => normalizeSearch(item.name).includes(key))
        if (!chosen.length) {
          const names = items.map((item) => item.name)
          const hint = suggestNames(names, text)
          return [`没有找到名称里包含「${text}」的脚本。`, hint].filter(Boolean).join('\n')
        }
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
        const result = await client.searchHistory('DAILY', formatDate(start), formatDate(end))
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
      return run('mas.start', async () => {
        if (!query) return describeTargets()

        const [scripts, queues] = await Promise.all([client.getScripts(), client.getQueues()])
        const script = findScript(scripts, query)
        if (script) {
          const result = await client.startTask(script.uid, 'AutoProxy')
          return `已启动脚本「${script.name}」，任务 ID：${result.taskId}。用 mas.task ${result.taskId} 查看进度。`
        }
        const queue = findQueue(queues, query)
        if (!queue) {
          const names = [
            ...scriptEntries(scripts).map((item) => item.name).filter(Boolean),
            ...queueEntries(queues).map((item) => item.name).filter(Boolean),
          ]
          const hint = suggestNames(names, query)
          return [`没有找到 ID 或名称是「${query}」的脚本或队列。`, hint].filter(Boolean).join('\n')
        }
        if (cycle && !queue.cycleEnabled) return `队列「${queue.name}」没有启用循环，请先去掉 -c，或在 AUTO-MAS 里打开循环。`
        const result = await client.startTask(queue.uid, cycle ? 'CycleRun' : 'AutoProxy')
        return `已启动队列「${queue.name}」${cycle ? '（循环）' : ''}，任务 ID：${result.taskId}。`
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
      return run('mas.startqueue', async () => {
        if (!queueQuery) {
          const queues = await client.getQueues()
          const names = queueEntries(queues).map((item) => item.name).filter(Boolean)
          return names.length
            ? `请带上队列 ID 或名称：${names.map((name) => `「${name}」`).join('、')}`
            : 'AUTO-MAS 里还没有调度队列。'
        }
        if (!tokens.length) return '请至少提供一个用户名或用户 ID；可用 mas.users 「脚本名称」 查看。'

        const [queues, scripts] = await Promise.all([client.getQueues(), client.getScripts()])
        const queue = findQueue(queues, queueQuery)
        if (!queue) {
          const hint = suggestNames(queueEntries(queues).map((item) => item.name), queueQuery)
          return [`没有找到 ID 或名称是「${queueQuery}」的队列。`, hint].filter(Boolean).join('\n')
        }

        const scriptIds = queueScriptIds(await client.getQueueItems(queue.uid))
        if (!scriptIds.length) {
          return `队列「${queue.name}」里没有已绑定脚本的队列项；先在 AUTO-MAS 里给队列添加脚本。`
        }

        const resolution = await resolveQueueUsers(scriptIds, scripts, tokens)
        if (resolution.ambiguous.length) {
          return [
            `这些用户名在脚本里匹配到多个用户，请写得更具体：${resolution.ambiguous.join('、')}。`,
            '可用 mas用户 [脚本] 查看用户名与 ID。',
          ].join('\n')
        }
        if (resolution.unmatched.length) {
          const names = new Set<string>()
          for (const scriptId of scriptIds) {
            for (const user of await loadUsers(scriptId)) names.add(user.name)
          }
          const hint = suggestNames([...names], resolution.unmatched[0])
          return [
            `这些用户没有匹配到任何脚本：${resolution.unmatched.join('、')}。`,
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
              '提示：用户必须来自脚本配置内部，不能直接用 QQ 号；先用 mas.users 「脚本名称」 查看用户名和用户 ID。',
            ].join(String.fromCharCode(10))
          }
          throw error
        }
        const lines = [`已用 ${users.size} 个用户启动队列「${queue.name}」中的 ${matchedCounts.length} 个脚本，任务 ID：${result.taskId}。`]
        if (resolution.skipped.length) lines.push(`跳过的脚本：${resolution.skipped.join('、')}（这些脚本里没有匹配的用户）。`)
        return lines.join('\n')
      })
    })

  alias(ctx.command('mas.stop [taskId:string]', '停止任务'), 'mas停止')
    .usage('不带参数时列出运行中的任务；带任务 ID 时停止该任务。')
    .example('mas.stop')
    .example('mas.stop 0f6f0c8e-2f4a-4a7f-9f2e-8f6a1c3d5b7e')
    .action(({ session }, taskId) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.stop')) return ''
      return run('mas.stop', async () => {
        if (!taskId) return formatRunningTasks(await client.getRuntimeSnapshot())
        await client.stopTask(taskId)
        return `已请求停止任务 ${taskId}。用 mas.task ${taskId} 确认状态。`
      })
    })

  alias(ctx.command('mas.power [action:string]', '执行电源操作'), 'mas电源')
    .option('yes', '-y, --yes 确认执行')
    .usage('危险操作，会中断当前任务并影响 AUTO-MAS 所在的主机；必须加 -y 才会执行。')
    .example('mas.power')
    .example('mas.power 重启 -y')
    .action(({ session, options }, action) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.power')) return ''
      if (!action) return formatPowerHelp()
      const signal = resolvePowerSignal(action)
      if (!signal) {
        return `无法识别电源操作「${action}」；支持：${POWER_SIGNALS.join(' / ')}，也可以用中文（关机、重启、休眠等）。`
      }
      if (!options?.yes) return `即将执行 ${signal}，会中断当前任务。确认请改为：mas.power ${action} -y`
      return run('mas.power', async () => {
        await client.setPower(signal)
        return `已提交电源操作 ${signal}。`
      })
    })

  alias(ctx.command('mas.test', '发送测试通知'), 'mas测试')
    .usage('向通知配置里的所有目标发送一条测试消息，用来检查 Koishi 到聊天平台的链路。')
    .example('mas.test')
    .action(({ session }) => {
      if (!session) return ''
      if (!checkAdmin(session, 'mas.test')) return ''
      return run('mas.test', () => notify.sendTest())
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
        const captureWindow = async () => {
          const result = await client.screenshot(title?.trim() || config.gameWindow)
          return screenshotImage(result, 'AUTO-MAS 没有返回图片，请确认游戏窗口标题是否正确。')
        }
        const captureAdb = async (): Promise<string | Element> => {
          const target = await resolveAdbTarget(client, config)
          if (!target.adbPath || !target.serial) {
            const hint = target.notes.length ? `\n${target.notes.join('\n')}` : ''
            throw new Error(`没有找到可用的 ADB：先启动模拟器，或在「截图」分组填写 adb 路径与设备序列号。${hint}`)
          }
          const result = await client.screenshotAdb(target.adbPath, target.serial)
          return screenshotImage(result, 'ADB 没有返回图片，请确认设备序列号是否正确。')
        }
        const mode = options?.adb ? 'adb' : config.screenshotMode
        if (mode === 'adb') return captureAdb()
        if (mode === 'window') return captureWindow()
        try {
          return await captureWindow()
        } catch (windowError) {
          logger.debug(`[截图] 窗口截图失败，改用 ADB: ${getErrorMessage(windowError)}`)
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
        if (options?.disable) {
          await client.updateNotifySetting({ IfKoishiSupport: false })
          return '已关闭 AUTO-MAS 的 Koishi 推送。'
        }
        if (options?.enable) {
          const target = String(address ?? '').trim() || expectedPushAddress(config)
          await client.updateNotifySetting({
            IfKoishiSupport: true,
            KoishiServerAddress: target,
            KoishiToken: config.token,
          })
          return [
            '已启用 AUTO-MAS 的 Koishi 推送。',
            `地址 ${target}`,
            `令牌 ${config.token ? '与插件一致' : '未设置'}`,
            '设置已写入；需要重启一次 AUTO-MAS 才会启动推送通道。',
            '重启后可用 mas推送 -t 验证。',
          ].join('\n')
        }
        if (options?.test) {
          await client.testNotify()
          return '已请求 AUTO-MAS 发送测试通知，请查看聊天目标是否收到。'
        }

        const push = readPushSetting(await client.getSetting())
        const expected = expectedPushAddress(config)
        const lines = [
          `推送 ${push.enabled ? '已启用' : '未启用'}`,
          `地址 ${push.address || '未设置'}`,
          `令牌 ${push.tokenConfigured ? '已设置' : '未设置'}`,
          `建议 ${expected}`,
        ]
        if (!push.enabled) lines.push('启用：mas推送 -e')
        else if (push.address && push.address !== expected) lines.push('当前地址与建议值不同，如有需要可重新执行 mas推送 -e')
        return lines.join('\n')
      })
    })

  alias(ctx.command('mas.whoami', '查看自己的平台标识'), 'mas我是谁')
    .usage('显示 平台:用户ID，用来填写管理员名单。')
    .example('mas.whoami')
    .action(({ session }) => {
      if (!session) return ''
      const identity = `${session.platform}:${session.userId}`
      return `你的标识：${identity}\n管理员权限：${isAdmin(session) ? '可用' : '不可用（把上面的标识加入管理员配置即可）'}`
    })
}

function formatPowerHelp(): string {
  return [
    '电源操作会中断当前任务并影响 AUTO-MAS 所在的主机，必须加 -y 才会执行。',
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

function resolvePowerSignal(input: string | undefined): string | undefined {
  const text = String(input ?? '').trim()
  if (!text) return undefined
  const direct = POWER_ALIASES[text.toLowerCase()] ?? POWER_ALIASES[text]
  if (direct) return direct
  const upper = text.toUpperCase()
  return (POWER_SIGNALS as readonly string[]).includes(upper) ? upper : undefined
}
