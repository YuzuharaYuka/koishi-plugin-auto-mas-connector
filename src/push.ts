import { createServer, type IncomingMessage, type Server as HttpServer } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import type { Context } from 'koishi'
import type { Config } from './config'
import type { PushPayload } from './types'
import { debugLog, getErrorMessage, logger } from './utils'

interface WsLayer {
  close(): void
}

/** @koishijs/plugin-server 的 ctx.server 只用到这些能力 */
interface WsCapableServer {
  ws(path: string, callback: (socket: WebSocket, request: IncomingMessage) => void): WsLayer
}

interface ServerContext extends Context {
  server?: WsCapableServer
}

const AUTH_TIMEOUT = 10_000

/**
 * 接收 AUTO-MAS 推送的 WebSocket 服务端。
 * AUTO-MAS 以客户端身份连接，先发 auth 再发 notify，协议见其 notification_channels/koishi。
 */
export class PushServer {
  private layer?: WsLayer
  private wss?: WebSocketServer
  private http?: HttpServer
  private readonly sockets = new Set<WebSocket>()
  private stopped = false

  constructor(
    private readonly ctx: Context,
    private readonly config: Config,
    private readonly onNotify: (payload: PushPayload) => void,
  ) {}

  start(): void {
    if (this.config.listenMode === 'standalone') {
      this.listenStandalone()
      return
    }

    const server = (this.ctx as ServerContext).server
    if (server?.ws) {
      this.layer = server.ws(this.config.listenPath, (socket, request) => this.accept(socket, request))
      logger.info(`[推送] 已挂载到 Koishi HTTP 服务，路径 ${this.config.listenPath}。`)
      if (!this.config.token) {
        logger.warn('推送令牌为空，任何能访问该端口的程序都可以伪造 AUTO-MAS 通知。')
      }
      return
    }

    if (this.config.listenMode === 'server') {
      logger.error('推送服务方式为 server，但没有可用的 Koishi HTTP 服务，推送未启动。')
      return
    }

    logger.warn('[推送] 没有可用的 Koishi HTTP 服务，改为独立监听。')
    this.listenStandalone()
  }

  stop(): void {
    if (this.stopped) return
    this.stopped = true
    for (const socket of this.sockets) socket.close(1001, 'plugin-dispose')
    this.sockets.clear()
    this.layer?.close()
    this.layer = undefined
    this.wss?.close()
    this.wss = undefined
    this.http?.close()
    this.http = undefined
  }

  private listenStandalone(): void {
    const http = createServer((request, response) => {
      response.writeHead(426, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('该端口只接受 WebSocket 连接')
    })
    http.on('error', (error) => {
      logger.error(`推送服务监听 ${this.config.host}:${this.config.port} 失败: ${getErrorMessage(error)}`)
      logger.error('请修改独立监听端口，或把推送服务方式改为 server。')
    })
    http.listen(this.config.port, this.config.host, () => {
      logger.info(`[推送] 独立监听 ws://${this.config.host}:${this.config.port}${this.config.listenPath}。`)
    })

    const wss = new WebSocketServer({ server: http, path: this.config.listenPath })
    wss.on('connection', (socket, request) => this.accept(socket, request))
    wss.on('error', (error) => logger.warn(`推送服务错误: ${getErrorMessage(error)}`))

    this.http = http
    this.wss = wss
    if (!this.config.token) {
      logger.warn('推送令牌为空，独立监听下任何能访问该端口的程序都可以伪造 AUTO-MAS 通知。')
    }
  }

  private accept(socket: WebSocket, request?: IncomingMessage): void {
    if (this.stopped) {
      socket.close(1001, 'plugin-dispose')
      return
    }

    const remote = request?.socket.remoteAddress ?? '未知地址'
    debugLog(this.config.debug, 'push', `新连接：${remote}`)
    let authed = this.config.token === ''
    let timer: ReturnType<typeof setTimeout> | undefined
    if (!authed) {
      timer = setTimeout(() => {
        logger.warn(`[推送] ${remote} 在超时前没有完成认证，已断开连接。`)
        socket.close(4001, 'auth-timeout')
      }, AUTH_TIMEOUT)
      timer.unref?.()
    } else {
      this.sockets.add(socket)
      logger.info(`[推送] AUTO-MAS 通知通道已连接（${remote}，未启用令牌）。`)
    }

    socket.on('message', (raw) => {
      let message: { id?: unknown; type?: unknown; data?: unknown }
      try {
        message = JSON.parse(raw.toString())
      } catch {
        logger.warn('[推送] 收到无法解析的消息，已忽略（可能是非 AUTO-MAS 客户端）。')
        return
      }

      if (message.type === 'auth') {
        const token = typeof (message.data as Record<string, unknown> | undefined)?.token === 'string'
          ? String((message.data as Record<string, unknown>).token)
          : ''
        if (!authed && token !== this.config.token) {
          logger.warn(`[推送] ${remote} 的令牌不匹配，已断开连接；请检查插件 token 与 AUTO-MAS 的 KoishiToken 是否一致。`)
          socket.close(4001, 'invalid-token')
          return
        }
        const firstAuth = !authed
        authed = true
        if (timer) clearTimeout(timer)
        timer = undefined
        if (firstAuth) {
          this.sockets.add(socket)
          logger.info(`[推送] AUTO-MAS 通知通道已连接（${remote}，已认证）。`)
        }
        return
      }

      if (message.type !== 'notify') {
        debugLog(this.config.debug, 'push', `忽略未知消息类型：${String(message.type)}`)
        return
      }
      if (!authed) {
        socket.close(4001, 'auth-required')
        return
      }
      const payload = message.data
      if (!payload || typeof payload !== 'object') {
        logger.warn('[推送] 收到格式无效的通知，已忽略。')
        return
      }
      const record = payload as Record<string, unknown>
      const kind = typeof record.msgtype === 'string' ? record.msgtype : 'text'
      const size = typeof record.message === 'string' ? record.message.length : 0
      debugLog(this.config.debug, 'push', `收到通知：msgtype=${kind}，长度=${size}`)
      this.onNotify(payload as PushPayload)
    })

    socket.on('close', (code, reason) => {
      if (timer) clearTimeout(timer)
      timer = undefined
      const wasAuthed = this.sockets.delete(socket)
      if (wasAuthed) {
        logger.info(`[推送] AUTO-MAS 通知通道已断开（code=${code}${reason?.length ? `，${reason.toString()}` : ''}）。`)
      } else {
        debugLog(this.config.debug, 'push', `未认证连接已关闭（code=${code}）。`)
      }
    })

    socket.on('error', (error) => {
      debugLog(this.config.debug, 'push', `连接错误：${getErrorMessage(error)}`)
    })
  }
}
