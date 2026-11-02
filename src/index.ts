import type { Context } from 'koishi'
import { AutoMasClient } from './client'
import { registerCommands } from './commands'
import { type Config, normalizeConfig } from './config'
import { PLUGIN_NAME, USAGE_MARKDOWN } from './constants'
import { readPushSetting } from './handlers'
import { Notifier } from './notify'
import { PushServer } from './push'
import { debugLog, expectedPushAddress, getErrorMessage, logger, raiseDebugLevel } from './utils'

export * from './config'
export const name = PLUGIN_NAME

/** server 是可选服务：同机部署时把推送服务挂到 Koishi 的 HTTP 端口上 */
export const inject = { optional: ['server'] }

export const usage = USAGE_MARKDOWN

export function apply(ctx: Context, rawConfig: Config): void {
  const config = normalizeConfig(rawConfig)
  raiseDebugLevel(config.debug)
  if (config.debug) logger.info('[调试] 已开启，本插件日志级别提到 debug。')
  const client = new AutoMasClient(config)
  const notifier = new Notifier(ctx, config)
  const push = new PushServer(ctx, config, (payload) => {
    void notifier.handle(payload)
  })

  ctx.on('ready', () => {
    const mode = config.listenMode === 'standalone'
      ? `独立监听 ${config.host}:${config.port}`
      : `挂载 ${config.listenPath}`
    logger.info(`[启动] AUTO-MAS ${config.baseUrl}，推送${mode}，通知目标 ${config.notifyTargets.length} 个。`)
    try {
      push.start()
    } catch (error) {
      logger.error(`推送服务启动失败: ${getErrorMessage(error)}`)
    }
    void checkPushSetting(client, config)
  })

  ctx.on('dispose', () => {
    push.stop()
  })

  registerCommands({ ctx, config, client, notify: notifier })
}

/** 启动时检查 AUTO-MAS 是否真的会向插件推送，未启用时给出可执行的修复提示 */
async function checkPushSetting(client: AutoMasClient, config: Config): Promise<void> {
  try {
    const push = readPushSetting(await client.getSetting())
    const expected = expectedPushAddress(config)
    if (!push.enabled) {
      logger.warn('AUTO-MAS 的 Koishi 推送未启用，插件收不到任务通知；在 AUTO-MAS 设置中启用，或执行 mas推送 -e。')
      return
    }
    debugLog(config.debug, 'push', `AUTO-MAS 推送设置：enabled=${push.enabled}，address=${push.address ?? '(空)'}`)
    if (push.address && push.address !== expected) {
      logger.warn(`AUTO-MAS 推送地址为 ${push.address}，与插件期望的 ${expected} 不一致；可执行 mas推送 -e 修正。`)
    }
  } catch (error) {
    debugLog(config.debug, 'push', `检查 AUTO-MAS 推送设置失败: ${getErrorMessage(error)}`)
  }
}
