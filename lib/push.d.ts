import type { Context } from 'koishi';
import type { Config } from './config';
import type { PushPayload } from './types';
/**
 * 接收 AUTO-MAS 推送的 WebSocket 服务端。
 * AUTO-MAS 以客户端身份连接，先发 auth 再发 notify，协议见其 notification_channels/koishi。
 */
export declare class PushServer {
    private readonly ctx;
    private readonly config;
    private readonly onNotify;
    private layer?;
    private wss?;
    private http?;
    private readonly sockets;
    private stopped;
    constructor(ctx: Context, config: Config, onNotify: (payload: PushPayload) => void);
    start(): void;
    stop(): void;
    private listenStandalone;
    private accept;
}
