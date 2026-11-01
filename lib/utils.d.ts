import { Logger } from 'koishi';
export declare const logger: Logger;
export interface Identity {
    platform: string;
    userId: string;
}
export declare function getErrorMessage(error: unknown): string;
export declare function debugLog(enabled: boolean, scope: string, message: string): void;
export declare function truncate(value: string, max?: number): string;
export declare function clampNumber(value: unknown, min: number, max: number, fallback: number): number;
export declare function normalizeBaseUrl(value: string): string;
export declare function normalizeListenPath(value: string): string;
/** 解析 `平台:用户ID`；用户 ID 里出现冒号时按第一个冒号切分 */
export declare function parseIdentity(value: string): Identity | undefined;
export declare function formatDate(date: Date): string;
/** AUTO-MAS 的 HTML 正文转纯文本，保留换行与表格分隔 */
export declare function htmlToText(input: string): string;
