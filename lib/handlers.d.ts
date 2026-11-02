import type { AutoMasClient } from './client';
import type { Config } from './config';
import type { CoreHealth, HistoryDetail, HistorySearchOut, PowerCountdownSnapshot, QueueGetOut, QueueItemGetOut, ScriptsGetOut, SettingGetOut, TaskRuntimeSnapshot, TaskStatus, UserGetOut } from './types';
/** 完整的 UUID 在手机上会折行，默认只显示前 8 位，指令支持前缀匹配 */
export declare function shortId(value: string): string;
export interface PushSettingInfo {
    enabled: boolean;
    address: string;
    tokenConfigured: boolean;
}
export declare function readPushSetting(setting: SettingGetOut | undefined): PushSettingInfo;
export declare function formatStatus(health: CoreHealth, snapshot: TaskRuntimeSnapshot, push?: PushSettingInfo): string;
export declare function formatTaskList(snapshot: TaskRuntimeSnapshot): string;
export declare function formatTaskStatus(task: TaskStatus): string;
export declare function formatQueueList(result: QueueGetOut, verbose?: boolean): string;
export declare function formatScriptList(result: ScriptsGetOut, verbose?: boolean): string;
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
/** 名称或 ID 前缀匹配用户；返回全部候选，由调用方判断唯一性 */
export declare function matchUsers(users: Array<{
    uid: string;
    name: string;
}>, token: string): Array<{
    uid: string;
    name: string;
}>;
/** 取出队列项里已绑定脚本的 ID；未绑定（"-"）的项跳过，按队列顺序去重 */
export declare function queueScriptIds(result: QueueItemGetOut): string[];
export declare function formatPower(snapshot: PowerCountdownSnapshot): string;
export declare function formatHistory(result: HistorySearchOut): string;
export declare function formatHistoryDetail(detail: HistoryDetail): string;
/** 列出脚本下的用户；只展示名称与用户 ID，不带账号等隐私字段 */
export declare function formatUserList(scriptName: string, result: UserGetOut, verbose?: boolean): string;
/** 启动失败时给出可能的候选名称，减少来回查表 */
export declare function suggestNames(names: string[], query: string, limit?: number): string;
export declare function formatRunningTasks(snapshot: TaskRuntimeSnapshot): string;
export interface AdbTarget {
    adbPath: string;
    serial: string;
    /** 自动发现的字段说明，便于出错时提示用户 */
    notes: string[];
}
/** 按 MAS 自己的规则从模拟器路径推导 adb：同目录下的 adb.exe（MuMu/雷电等） */
export declare function deriveAdbPath(emulatorPath: string): string;
/**
 * 解析 ADB 截图目标：手动配置优先，缺项时从 MAS 的模拟器配置与运行状态自动发现。
 * 不要求 adb 文件在 Koishi 所在机器上存在——路径最终由 AUTO-MAS 所在主机执行。
 */
export declare function resolveAdbTarget(client: AutoMasClient, config: Config): Promise<AdbTarget>;
