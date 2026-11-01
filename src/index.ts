import type { Context } from 'koishi'
import { AutoMasClient } from './client'
import { registerCommands } from './commands'
import { type Config, normalizeConfig } from './config'
import { HELP_TEXT, PLUGIN_NAME } from './constants'
import { Notifier } from './notify'
import { PushServer } from './push'
import { getErrorMessage, logger } from './utils'

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
  })

  ctx.on('dispose', () => {
    push.stop()
  })

  registerCommands({ ctx, config, client, notify: notifier })
}
