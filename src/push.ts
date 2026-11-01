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
      this.layer = server.ws(this.config.listenPath, (socket) => this.accept(socket))
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
    wss.on('connection', (socket) => this.accept(socket))
    wss.on('error', (error) => logger.warn(`推送服务错误: ${getErrorMessage(error)}`))

    this.http = http
    this.wss = wss
    if (!this.config.token) {
      logger.warn('推送令牌为空，独立监听下任何能访问该端口的程序都可以伪造 AUTO-MAS 通知。')
    }
  }

  private accept(socket: WebSocket): void {
    if (this.stopped) {
      socket.close(1001, 'plugin-dispose')
      return
    }

    let authed = this.config.token === ''
    let timer: ReturnType<typeof setTimeout> | undefined
    if (!authed) {
      timer = setTimeout(() => {
        logger.warn('[推送] AUTO-MAS 在超时前没有完成认证，已断开连接。')
        socket.close(4001, 'auth-timeout')
      }, AUTH_TIMEOUT)
      timer.unref?.()
    }

    socket.on('message', (raw) => {
      let message: { id?: unknown; type?: unknown; data?: unknown }
      try {
        message = JSON.parse(raw.toString())
      } catch {
        debugLog(this.config.debug, 'push', '收到无法解析的消息')
        return
      }

      if (message.type === 'auth') {
        const token = typeof (message.data as Record<string, unknown> | undefined)?.token === 'string'
          ? String((message.data as Record<string, unknown>).token)
          : ''
        if (!authed && token !== this.config.token) {
          logger.warn('[推送] AUTO-MAS 令牌不匹配，已断开连接。')
          socket.close(4001, 'invalid-token')
          return
        }
        authed = true
        if (timer) clearTimeout(timer)
        timer = undefined
        this.sockets.add(socket)
        logger.info('[推送] AUTO-MAS 通知通道已连接。')
        return
      }

      if (message.type !== 'notify') return
      if (!authed) {
        socket.close(4001, 'auth-required')
        return
      }
      const payload = message.data
      if (!payload || typeof payload !== 'object') return
      this.onNotify(payload as PushPayload)
    })

    socket.on('close', () => {
      if (timer) clearTimeout(timer)
      timer = undefined
      if (this.sockets.delete(socket)) logger.info('[推送] AUTO-MAS 通知通道已断开。')
    })

    socket.on('error', (error) => {
      debugLog(this.config.debug, 'push', `连接错误: ${getErrorMessage(error)}`)
    })
  }
}
