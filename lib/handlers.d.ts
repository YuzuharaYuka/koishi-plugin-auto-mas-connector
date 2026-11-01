import type { CoreHealth, HistoryDetail, HistorySearchOut, PowerCountdownSnapshot, QueueGetOut, QueueItemGetOut, ScriptsGetOut, TaskRuntimeSnapshot, TaskStatus, UserGetOut } from './types';
export declare function formatStatus(health: CoreHealth, snapshot: TaskRuntimeSnapshot): string;
export declare function formatTaskList(snapshot: TaskRuntimeSnapshot): string;
export declare function formatTaskStatus(task: TaskStatus): string;
export declare function formatQueueList(result: QueueGetOut): string;
export declare function formatScriptList(result: ScriptsGetOut): string;
export declare function scriptName(result: ScriptsGetOut, uid: string): string;
export declare function scriptEntries(result: ScriptsGetOut): Array<{
    uid: string;
    name: string;
}>;
/** 名称搜索忽略空格与大小写，「新maa」也能命中「新 MAA 脚本」 */
export declare function normalizeSearch(value: string): string;
export declare function findScript(result: ScriptsGetOut, query: string): {
    uid: string;
    name: string;
} | undefined;
export declare function findQueue(result: QueueGetOut, query: string): {
    uid: string;
    name: string;
    cycleEnabled: boolean;
} | undefined;
/** 取出队列项里已绑定脚本的 ID；未绑定（"-"）的项跳过，按队列顺序去重 */
export declare function queueScriptIds(result: QueueItemGetOut): string[];
export declare function formatPower(snapshot: PowerCountdownSnapshot): string;
export declare function formatHistory(result: HistorySearchOut): string;
export declare function formatHistoryDetail(detail: HistoryDetail): string;
/** 列出脚本下的用户；只展示名称与用户 ID，不带账号等隐私字段 */
export declare function formatUserList(scriptName: string, result: UserGetOut): string;
/** 启动失败时给出可能的候选名称，减少来回查表 */
export declare function suggestNames(names: string[], query: string, limit?: number): string;
export declare function formatRunningTasks(snapshot: TaskRuntimeSnapshot): string;
