import { type Context } from 'koishi';
import type { Config } from './config';
import type { PushPayload } from './types';
interface RenderedNotification {
    /** 用于分类与文本回退的纯文本 */
    text: string;
    /** HTML 渲染出的图片，渲染失败为空 */
    image?: Buffer;
}
/** 按 AUTO-MAS 的 msgtype 渲染通知：text / html / picture */
export declare function renderPayload(payload: PushPayload, options: {
    sendImages: boolean;
    notifyImage: boolean;
    imageWidth: number;
    debug: boolean;
}): Promise<RenderedNotification | undefined>;
/** 推送正文没有结构化分类，只能按关键词判断；一条通知可能同时命中多类 */
export declare function classifyNotification(text: string): string[];
/** 把长文本拆成多条消息，优先在换行处断开 */
export declare function splitMessage(text: string, limit?: number): string[];
export declare class Notifier {
    private readonly ctx;
    private readonly config;
    private warned;
    constructor(ctx: Context, config: Config);
    handle(payload: PushPayload): Promise<void>;
    /** 发送一条测试消息到所有目标，忽略类别过滤 */
    sendTest(): Promise<string>;
    private acceptGlobally;
    private acceptTarget;
    private deliver;
    private sendTo;
    private activeBots;
}
/** 给调试日志用的类别说明 */
export declare function describeCategories(categories: string[]): string;
export {};
