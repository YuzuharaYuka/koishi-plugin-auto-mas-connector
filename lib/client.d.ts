import type { Config } from './config';
import type { CoreHealth, HistoryDetail, HistorySearchOut, PowerCountdownSnapshot, QueueGetOut, QueueItemGetOut, ScreenshotOut, ScriptsGetOut, SettingGetOut, TaskRuntimeSnapshot, TaskStatus, UserGetOut } from './types';
export declare class AutoMasError extends Error {
    readonly status?: number | undefined;
    readonly body?: string | undefined;
    constructor(message: string, status?: number | undefined, body?: string | undefined);
}
export declare class AutoMasClient {
    private readonly config;
    constructor(config: Config);
    private url;
    /** 发送请求并拆掉 AUTO-MAS 的 { success, data } 信封；失败时抛出带下一步提示的错误 */
    request<T>(path: string, init?: {
        method?: string;
        body?: unknown;
    }): Promise<T>;
    health(): Promise<CoreHealth>;
    getRuntimeSnapshot(): Promise<TaskRuntimeSnapshot>;
    getTask(taskId: string): Promise<TaskStatus>;
    startTask(taskId: string, mode: 'AutoProxy' | 'ScriptConfig' | 'Update' | 'CycleRun'): Promise<{
        taskId: string;
    }>;
    startQueueWithUsers(taskId: string, queueUserIds: Record<string, string[]>): Promise<{
        taskId: string;
    }>;
    stopTask(taskId: string): Promise<unknown>;
    getPowerSnapshot(): Promise<PowerCountdownSnapshot>;
    setPower(signal: string): Promise<unknown>;
    getQueues(): Promise<QueueGetOut>;
    getQueueItems(queueId: string): Promise<QueueItemGetOut>;
    getScripts(): Promise<ScriptsGetOut>;
    getUsers(scriptId: string, userId?: string): Promise<UserGetOut>;
    getSetting(): Promise<SettingGetOut>;
    searchHistory(mode: 'DAILY' | 'WEEKLY' | 'MONTHLY', startDate: string, endDate: string): Promise<HistorySearchOut>;
    getHistoryDetail(recordId: string): Promise<HistoryDetail>;
    screenshot(windowTitle: string): Promise<ScreenshotOut>;
    screenshotAdb(adbPath: string, serial: string, useScreencap?: boolean): Promise<ScreenshotOut>;
}
