import { Logger } from 'koishi';
export declare const logger: Logger;
export interface Identity {
    platform: string;
    userId: string;
}
export declare function getErrorMessage(error: unknown): string;
/**
 * 打开「调试」开关后，只把插件自己的 logger 级别提到 debug（3），不影响其他插件与 Koishi 全局等级。
 * 只抬高、不压低：关闭时恢复默认行为，避免覆盖用户在控制台设置过的级别。
 */
export declare function raiseDebugLevel(enabled: boolean): void;
export declare function debugLog(enabled: boolean, scope: string, message: string): void;
/** 给常见失败补充下一步动作，避免用户只看到原始错误 */
export declare function describeFailure(message: string): string;
export declare function truncate(value: string, max?: number): string;
export declare function clampNumber(value: unknown, min: number, max: number, fallback: number): number;
export declare function normalizeBaseUrl(value: string): string;
export declare function normalizeListenPath(value: string): string;
/** 解析 `平台:用户ID`；用户 ID 里出现冒号时按第一个冒号切分 */
export declare function parseIdentity(value: string): Identity | undefined;
export declare function formatDate(date: Date): string;
/** 推断 AUTO-MAS 应该填写的推送地址：复用 Koishi 服务时默认 5140 */
export declare function expectedPushAddress(config: {
    listenMode: string;
    listenPath: string;
    host: string;
    port: number;
}): string;
/** AUTO-MAS 的 HTML 正文转纯文本，保留换行与表格分隔 */
export declare function htmlToText(input: string): string;
