import { Schema } from 'koishi';
export type ListenMode = 'auto' | 'server' | 'standalone';
export type ScreenshotMode = 'auto' | 'window' | 'adb';
export type ChannelType = 'guild' | 'private';
export interface NotifyTarget {
    /** 平台名，如 onebot */
    platform: string;
    channelType: ChannelType;
    /** 群号，或私聊用户 ID */
    channelId: string;
    /** 接收类别；空数组表示全部 */
    events: string[];
}
/** 全局接收类别，按表格顺序展示，enabled 控制是否接收 */
export interface NotifyCategorySetting {
    category: string;
    enabled: boolean;
}
export interface Config {
    /** AUTO-MAS 后端地址 */
    baseUrl: string;
    /** 请求超时，毫秒 */
    timeout: number;
    /** 推送服务方式 */
    listenMode: ListenMode;
    /** 推送服务 WebSocket 路径 */
    listenPath: string;
    /** 推送令牌，空串表示不校验 */
    token: string;
    /** 独立监听地址 */
    host: string;
    /** 独立监听端口 */
    port: number;
    /** 允许通过指令控制 AUTO-MAS 进程 */
    processControl: boolean;
    /** AUTO-MAS 启动文件路径 */
    masExePath: string;
    /** 等待进程启动/关闭的秒数 */
    processTimeout: number;
    notifyEnabled: boolean;
    notifyTargets: NotifyTarget[];
    /** 全局接收类别 */
    notifyEvents: NotifyCategorySetting[];
    /** 把 HTML 推送渲染成图片 */
    notifyImage: boolean;
    /** 纯文本推送使用合并转发 */
    mergeForward: boolean;
    /** 渲染图片宽度 */
    imageWidth: number;
    sendImages: boolean;
    /** 管理员标识，格式 平台:用户ID */
    admins: string[];
    enableChineseAlias: boolean;
    /** 截图方式 */
    screenshotMode: ScreenshotMode;
    gameWindow: string;
    /** 窗口截图失败时回退的 adb 路径 */
    adbPath: string;
    /** ADB 设备序列号 */
    adbSerial: string;
    debug: boolean;
}
export declare const Config: Schema<Config>;
/** 运行时夹逼：手改 koishi.yml 或旧配置升级都可能绕过 Schema 约束 */
export declare function normalizeConfig(raw: Config): Config;
/** 兼容旧配置：也接受字符串数组（表示全部启用），表格里未知类别直接丢弃 */
export declare function normalizeCategorySettings(input: unknown): NotifyCategorySetting[];
export declare function resolveCategory(input: string): string | undefined;
/** 把旧配置的逗号分隔字符串或新配置的类别数组统一成类别代码列表 */
export declare function normalizeEventList(input: unknown): string[];
