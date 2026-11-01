export interface CoreHealth {
    ready?: boolean;
    backgroundStatus?: string;
    protocol?: number;
    version?: string;
    commit?: string;
}
export interface TaskScriptInfo {
    scriptId?: string;
    scriptType?: string;
    [key: string]: unknown;
}
export interface RuntimeTask {
    taskId: string;
    mode?: string;
    isCycle?: boolean;
    queueId?: string;
    scriptId?: string;
    userId?: string;
    stopping?: boolean;
    scripts?: TaskScriptInfo[];
    task_info?: TaskScriptInfo[];
    cycleNextList?: string[];
    log?: string;
    logSeq?: number;
    logFirstLine?: string;
}
export interface ScheduledScript {
    scriptId?: string;
    scriptType?: string;
}
export interface TaskRuntimeSnapshot {
    tasks: RuntimeTask[];
    scheduledScripts: ScheduledScript[];
}
export interface TaskStatus {
    taskId: string;
    status: string;
    detail?: string;
    error?: string;
    mode?: string;
    isCycle?: boolean;
    queueId?: string;
    scriptId?: string;
    userId?: string;
    stopping?: boolean;
    finishedAt?: string;
}
export interface QueueInfo {
    Name?: string;
    TimeEnabled?: boolean;
    CycleEnabled?: boolean;
    StartUpMode?: string;
    [key: string]: unknown;
}
export interface QueueConfig {
    Info?: QueueInfo;
    Time?: unknown[];
    [key: string]: unknown;
}
export interface QueueGetOut {
    index: Array<{
        uid: string;
        type?: string;
    }>;
    data: Record<string, QueueConfig>;
}
export interface QueueItemConfig {
    Info?: {
        ScriptId?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
export interface QueueItemGetOut {
    index: Array<{
        uid: string;
        type?: string;
    }>;
    data: Record<string, QueueItemConfig>;
}
export interface ScriptInfo {
    Name?: string;
    [key: string]: unknown;
}
export interface ScriptConfig {
    Info?: ScriptInfo;
    activityGame?: string;
    [key: string]: unknown;
}
export interface ScriptsGetOut {
    index: Array<{
        uid: string;
        type?: string;
    }>;
    data: Record<string, ScriptConfig>;
}
export interface UserIndexItem {
    uid: string;
    type?: string;
}
export interface UserConfig {
    Info?: {
        Name?: string;
        Id?: string;
        Server?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
export interface UserGetOut {
    index?: UserIndexItem[];
    data?: Record<string, UserConfig>;
}
export interface PowerCountdownSnapshot {
    active: boolean;
    operation?: string;
    remaining?: number;
}
export interface HistoryIndexRecord {
    id?: string;
    time?: string;
    date?: string;
    username?: string;
    script_name?: string;
    status?: string;
    message?: string;
    result?: string;
    storage_error_count?: number;
    jsonFile?: string;
    [key: string]: unknown;
}
export interface HistoryBucket {
    index?: HistoryIndexRecord[];
    data?: unknown;
    aggregate_errors?: string[];
    replays?: unknown[];
}
export interface HistorySearchOut {
    data: Record<string, Record<string, HistoryBucket>>;
}
export interface HistoryDetail {
    record?: HistoryIndexRecord;
    log_content?: string;
    log_available?: boolean;
    [key: string]: unknown;
}
export interface ScreenshotOut {
    image_base64: string;
    region?: unknown;
    image_width?: number;
    image_height?: number;
}
export interface SettingGetOut {
    Notify?: Record<string, unknown>;
    [key: string]: unknown;
}
export interface PushPayload {
    msgtype?: unknown;
    message?: unknown;
}
