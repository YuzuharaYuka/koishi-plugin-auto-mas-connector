import type { Context } from 'koishi'
import { AutoMasClient } from './client'
import { registerCommands } from './commands'
import { type Config, normalizeConfig } from './config'
import { HELP_TEXT, PLUGIN_NAME } from './constants'
import { readPushSetting } from './handlers'
import { Notifier } from './notify'
import { PushServer } from './push'
import { expectedPushAddress, getErrorMessage, logger } from './utils'

export * from './config'
export const name = PLUGIN_NAME

/** server 是可选服务：同机部署时把推送服务挂到 Koishi 的 HTTP 端口上 */
export const inject = { optional: ['server'] }

export const usage = HELP_TEXT

export function apply(ctx: Context, rawConfig: Config): void {
  const config = normalizeConfig(rawConfig)
  const client = new AutoMasClient(config)
  const notifier = new Notifier(ctx, config)
  const push = new PushServer(ctx, config, (payload) => {
    void notifier.handle(payload)
  })

  ctx.on('ready', () => {
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
    if (push.address && push.address !== expected) {
      logger.warn(`AUTO-MAS 推送地址为 ${push.address}，与插件期望的 ${expected} 不一致；可执行 mas推送 -e 修正。`)
    }
  } catch (error) {
    logger.debug(`检查 AUTO-MAS 推送设置失败: ${getErrorMessage(error)}`)
  }
}
