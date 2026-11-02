"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Config: () => Config,
  apply: () => apply,
  inject: () => inject,
  name: () => name,
  normalizeCategorySettings: () => normalizeCategorySettings,
  normalizeConfig: () => normalizeConfig,
  normalizeEventList: () => normalizeEventList,
  resolveCategory: () => resolveCategory,
  usage: () => usage
});
module.exports = __toCommonJS(index_exports);

// src/utils.ts
var import_koishi = require("koishi");

// src/constants.ts
var PLUGIN_NAME = "auto-mas-connector";
var LOGGER_NAME = "auto-mas";
var DEFAULT_BASE_URL = "http://127.0.0.1:36163";
var DEFAULT_LISTEN_PATH = "/AUTO_MAS";
var DEFAULT_STANDALONE_PORT = 5150;
var DEFAULT_GAME_WINDOW = "明日方舟";
var DEFAULT_IMAGE_WIDTH = 720;
var MAX_MESSAGE_LENGTH = 2e3;
var DEFAULT_KOISHI_PORT = 5140;
var DEFAULT_PROCESS_TIMEOUT = 60;
var NOTIFICATION_CATEGORIES = {
  statistic: "统计报告",
  task: "任务完成",
  error: "异常",
  sixStar: "六星",
  activity: "活动提醒",
  sign: "社区签到",
  material: "材料收获",
  test: "测试通知",
  other: "其他"
};
var POWER_SIGNALS = [
  "NoAction",
  "Shutdown",
  "ShutdownForce",
  "Reboot",
  "Hibernate",
  "Sleep",
  "KillSelf",
  "RestartSelf",
  "Logoff"
];
var POWER_ALIASES = {
  noaction: "NoAction",
  不操作: "NoAction",
  shutdown: "Shutdown",
  关机: "Shutdown",
  shutdownforce: "ShutdownForce",
  强制关机: "ShutdownForce",
  reboot: "Reboot",
  重启: "Reboot",
  hibernate: "Hibernate",
  休眠: "Hibernate",
  sleep: "Sleep",
  睡眠: "Sleep",
  killself: "KillSelf",
  退出: "KillSelf",
  restartself: "RestartSelf",
  重启自身: "RestartSelf",
  logoff: "Logoff",
  注销: "Logoff"
};
var HELP_TEXT = `
AUTO-MAS 控制台

查询
· mas状态 — 后端状态、运行任务与推送状态
· mas任务 [任务ID] — 任务列表；带 ID 查结果
· mas队列 — 调度队列
· mas脚本 [-v] — 脚本配置；-v 显示完整 ID
· mas用户 [脚本] — 脚本下的用户
· mas历史 [天数] — 执行历史，默认 1 天

控制（仅管理员）
· mas启动 [名称] — 启动脚本或队列；-c 循环执行队列
· mas开队 [队列] [用户...] — 指定用户启动队列
· mas停止 [任务ID] — 停止任务
· mas电源 [操作] -y — 任务结束后关机、重启、休眠等
· mas进程 [操作] -y — 查看、关闭、启动、重启 AUTO-MAS 进程
· mas截图 [窗口] [-a] — 按配置截图；-a 用 ADB

其他
· mas测试 — 给聊天目标发测试通知
· mas推送 [-e|-d|-t] — 查看或修改 AUTO-MAS 推送设置
· mas我是谁 — 查看自己的平台标识

名称支持模糊匹配，ID 支持前缀；查询类所有人可用
首次使用：在 AUTO-MAS 通知设置中启用 Koishi 并重启，或用 mas推送 -e 写入后重启
`;
var USAGE_MARKDOWN = `
通过 Koishi 连接、查询和控制 AUTO-MAS，并接收它推送的通知

| 指令 | 别名 | 说明 |
| :--- | :--- | :--- |
| \`mas.status\` | \`mas状态\` | 后端状态、运行任务与推送状态 |
| \`mas.task [任务ID]\` | \`mas任务\` | 任务列表；带 ID 查结果 |
| \`mas.queue\` | \`mas队列\` | 调度队列；\`-v\` 显示完整 ID |
| \`mas.scripts\` | \`mas脚本\` | 脚本配置；\`-v\` 显示完整 ID |
| \`mas.users [脚本]\` | \`mas用户\` | 脚本用户；\`-v\` 显示完整 ID |
| \`mas.history [天数]\` | \`mas历史\` | 执行历史，默认 1 天 |
| \`mas.start [名称]\` | \`mas启动\` | 启动脚本或队列；\`-c\` 循环执行队列 |
| \`mas.startqueue [队列] [用户...]\` | \`mas开队\` | 指定用户启动队列 |
| \`mas.stop [任务ID]\` | \`mas停止\` | 停止任务 |
| \`mas.power [操作] -y\` | \`mas电源\` | 任务结束后控制电脑关机、重启、休眠 |
| \`mas.process [操作] -y\` | \`mas进程\` | 查看、关闭、启动或重启 AUTO-MAS 进程 |
| \`mas.screenshot [窗口]\` | \`mas截图\` | 按配置截图；\`-a\` 用 ADB |
| \`mas.push [地址]\` | \`mas推送\` | 查看或修改推送设置；\`-e\` 启用、\`-d\` 关闭、\`-t\` 测试 |
| \`mas.test\` | \`mas测试\` | 给聊天目标发测试通知 |
| \`mas.whoami\` | \`mas我是谁\` | 查看自己的平台标识 |

查询类指令所有人可用，控制类指令仅管理员。名称支持模糊匹配，ID 支持前缀

**接入 AUTO-MAS**：在 AUTO-MAS 的通知设置中启用 Koishi，地址填 \`ws://<Koishi 地址>:<端口>/AUTO_MAS\`，保存后重启一次 AUTO-MAS；也可以用 \`mas推送 -e\` 写入。webhook 通道与 Koishi 通道不同，webhook 指向 \`/AUTO_MAS\` 不会被本插件接收。
`;

// src/utils.ts
var logger = new import_koishi.Logger(LOGGER_NAME);
function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}
__name(getErrorMessage, "getErrorMessage");
var debugLevelRaised = false;
function raiseDebugLevel(enabled) {
  if (!enabled || debugLevelRaised) return;
  debugLevelRaised = true;
  if (logger.level < 3) logger.level = 3;
}
__name(raiseDebugLevel, "raiseDebugLevel");
function debugLog(enabled, scope, message) {
  if (enabled) logger.debug(`[${scope}] ${message}`);
}
__name(debugLog, "debugLog");
function describeFailure(message) {
  const text = message.trim();
  if (/部分通知发送失败.*Koishi|未找到名为 \[Koishi\]/i.test(text)) {
    return `${text}
AUTO-MAS 的 Koishi 推送通道未启动。修改推送设置后需要重启一次 AUTO-MAS。`;
  }
  if (/无法连接 AUTO-MAS|请求超时/.test(text)) {
    return `${text}
请确认 AUTO-MAS 正在运行，且配置的 baseUrl 可达。`;
  }
  if (/平台机器人未连接|连接已断开|connection has closed|websocket.*closed|ECONNRESET/i.test(text)) {
    return `${text}
请检查 OneBot/NapCat 与 QQ 是否在线，重连后再试。`;
  }
  return text;
}
__name(describeFailure, "describeFailure");
function truncate(value, max = MAX_MESSAGE_LENGTH) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
__name(truncate, "truncate");
function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}
__name(clampNumber, "clampNumber");
function normalizeBaseUrl(value) {
  let url = String(value ?? "").trim();
  if (!url) return "http://127.0.0.1:36163";
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  return url.replace(/\/+$/, "");
}
__name(normalizeBaseUrl, "normalizeBaseUrl");
function normalizeListenPath(value) {
  let path = String(value ?? "").trim();
  if (!path) return "/AUTO_MAS";
  if (!path.startsWith("/")) path = `/${path}`;
  return path.replace(/\/+$/, "") || "/";
}
__name(normalizeListenPath, "normalizeListenPath");
function parseIdentity(value) {
  const text = String(value ?? "").trim();
  const index = text.indexOf(":");
  if (index <= 0) return void 0;
  const platform = text.slice(0, index).trim();
  const userId = text.slice(index + 1).trim();
  if (!platform || !userId) return void 0;
  return { platform, userId };
}
__name(parseIdentity, "parseIdentity");
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
__name(formatDate, "formatDate");
function expectedPushAddress(config) {
  const port = config.listenMode === "standalone" ? config.port : DEFAULT_KOISHI_PORT;
  const host = config.listenMode === "standalone" ? config.host === "0.0.0.0" ? "127.0.0.1" : config.host : "127.0.0.1";
  return `ws://${host}:${port}${config.listenPath}`;
}
__name(expectedPushAddress, "expectedPushAddress");
function htmlToText(input) {
  return input.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|tr|h[1-6]|li|table|section|article)>/gi, "\n").replace(/<\/t[dh]>/gi, "	").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&amp;/gi, "&").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
__name(htmlToText, "htmlToText");

// src/client.ts
var AutoMasError = class extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = "AutoMasError";
  }
  static {
    __name(this, "AutoMasError");
  }
};
var AutoMasClient = class {
  constructor(config) {
    this.config = config;
  }
  static {
    __name(this, "AutoMasClient");
  }
  url(path) {
    return `${this.config.baseUrl}${path}`;
  }
  /** 发送请求并拆掉 AUTO-MAS 的 { success, data } 信封；失败时抛出带下一步提示的错误 */
  async request(path, init = {}) {
    const method = init.method ?? "GET";
    const started = Date.now();
    if (!init.silent) debugLog(this.config.debug, "client", `请求 ${method} ${path}`);
    const headers = { Accept: "application/json" };
    if (init.body !== void 0) headers["Content-Type"] = "application/json";
    let response;
    try {
      response = await fetch(this.url(path), {
        method,
        headers,
        body: init.body === void 0 ? void 0 : JSON.stringify(init.body),
        signal: AbortSignal.timeout(this.config.timeout)
      });
    } catch (error) {
      const message = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? `请求超时（${this.config.timeout} 毫秒）：${this.config.baseUrl}${path}` : `无法连接 AUTO-MAS（${this.config.baseUrl}）：${getErrorMessage(error)}`;
      if (!init.silent) logger.warn(`[请求] ${method} ${path} 失败：${message}`);
      throw new AutoMasError(message);
    }
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : void 0;
    } catch {
      payload = void 0;
    }
    if (!response.ok) {
      const message = readMessage(payload) ?? text.slice(0, 200);
      const detail = `AUTO-MAS 返回 HTTP ${response.status}${message ? `：${message}` : ""}`;
      if (!init.silent) logger.warn(`[请求] ${method} ${path} 失败：${detail}`);
      throw new AutoMasError(detail, response.status, text.slice(0, 500));
    }
    if (payload && typeof payload === "object") {
      const record = payload;
      if (typeof record.success === "boolean") {
        if (!record.success) {
          const message = readMessage(payload) ?? "未提供原因";
          throw new AutoMasError(`AUTO-MAS 拒绝了该操作：${message}`);
        }
        if (!init.silent) debugLog(this.config.debug, "client", `${method} ${path} -> success，用时 ${Date.now() - started}ms`);
        return record.data;
      }
      if (typeof record.code === "number" && record.code >= 400) {
        const message = readMessage(payload) ?? "未提供原因";
        throw new AutoMasError(`AUTO-MAS 返回错误 ${record.code}：${message}`);
      }
    }
    if (!init.silent) debugLog(this.config.debug, "client", `${method} ${path} -> ok，用时 ${Date.now() - started}ms`);
    return payload;
  }
  health(silent = false) {
    return this.request("/api/core/health", { silent });
  }
  close() {
    return this.request("/api/core/close", { method: "POST", body: {} });
  }
  getRuntimeSnapshot() {
    return this.request("/api/dispatch/runtime-snapshot");
  }
  getTask(taskId) {
    return this.request(`/api/dispatch/task/${encodeURIComponent(taskId)}`);
  }
  startTask(taskId, mode) {
    return this.request("/api/dispatch/start", {
      method: "POST",
      body: { taskId, mode }
    });
  }
  startQueueWithUsers(taskId, queueUserIds) {
    return this.request("/api/dispatch/start", {
      method: "POST",
      body: { taskId, mode: "AutoProxy", queueUserIds }
    });
  }
  stopTask(taskId) {
    return this.request("/api/dispatch/stop", { method: "POST", body: { taskId } });
  }
  getPowerSnapshot() {
    return this.request("/api/dispatch/power/countdown-snapshot");
  }
  setPower(signal) {
    return this.request("/api/dispatch/set/power", { method: "POST", body: { signal } });
  }
  getQueues() {
    return this.request("/api/queue/get", { method: "POST", body: {} });
  }
  getQueueItems(queueId) {
    return this.request("/api/queue/item/get", { method: "POST", body: { queueId } });
  }
  getScripts() {
    return this.request("/api/scripts/get", { method: "POST", body: {} });
  }
  getUsers(scriptId, userId) {
    return this.request("/api/scripts/user/get", {
      method: "POST",
      body: userId ? { scriptId, userId } : { scriptId }
    });
  }
  getSetting() {
    return this.request("/api/setting/get", { method: "POST", body: {} });
  }
  /** 更新 AUTO-MAS 的通知设置；AUTO-MAS 会对传入的片段做合并 */
  updateNotifySetting(patch) {
    return this.request("/api/setting/update", { method: "POST", body: { data: { Notify: patch } } });
  }
  /** 让 AUTO-MAS 用它已启用的通知渠道发一条测试通知 */
  testNotify() {
    return this.request("/api/setting/test_notify", { method: "POST", body: {} });
  }
  getEmulators() {
    return this.request("/api/emulator/get", { method: "POST", body: {} });
  }
  getEmulatorStatus() {
    return this.request("/api/emulator/status", { method: "POST", body: {} });
  }
  searchHistory(mode, startDate, endDate) {
    return this.request("/api/history/search", {
      method: "POST",
      body: { mode, start_date: startDate, end_date: endDate }
    });
  }
  getHistoryDetail(recordId) {
    return this.request("/api/history/detail", {
      method: "POST",
      body: { recordId }
    });
  }
  screenshot(windowTitle) {
    return this.request("/api/ocr/screenshot", {
      method: "POST",
      body: { window_title: windowTitle }
    });
  }
  screenshotAdb(adbPath, serial, useScreencap = true) {
    return this.request("/api/ocr/screenshot/adb", {
      method: "POST",
      body: { adb_path: adbPath, serial, use_screencap: useScreencap }
    });
  }
};
function readMessage(payload) {
  if (!payload || typeof payload !== "object") return void 0;
  const record = payload;
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  if (typeof record.detail === "string" && record.detail.trim()) return record.detail.trim();
  return void 0;
}
__name(readMessage, "readMessage");

// src/commands.ts
var import_node_child_process = require("node:child_process");
var import_node_fs = require("node:fs");
var import_node_os = require("node:os");
var import_node_path = require("node:path");
var import_koishi2 = require("koishi");

// src/handlers.ts
var SUCCESS_STATUSES = /* @__PURE__ */ new Set(["SUCCESS", "DONE", "OK", "COMPLETED"]);
function isSuccessStatus(status) {
  return SUCCESS_STATUSES.has(String(status ?? "").toUpperCase());
}
__name(isSuccessStatus, "isSuccessStatus");
function shortId(value) {
  return value.length > 8 ? value.slice(0, 8) : value;
}
__name(shortId, "shortId");
function readPushSetting(setting) {
  const notify = setting?.data?.Notify ?? {};
  return {
    enabled: notify.IfKoishiSupport === true,
    address: String(notify.KoishiServerAddress ?? ""),
    tokenConfigured: Boolean(String(notify.KoishiToken ?? "").trim())
  };
}
__name(readPushSetting, "readPushSetting");
function formatStatus(health, snapshot, push) {
  const version = health.version ?? "未知版本";
  const state = health.ready ? "就绪" : "未就绪";
  const tasks = snapshot.tasks ?? [];
  const scheduled = snapshot.scheduledScripts ?? [];
  const lines = [`AUTO-MAS ${version} · ${state}`, `运行中 ${tasks.length} · 已安排脚本 ${scheduled.length}`];
  if (push) {
    lines.push(push.enabled ? `推送 已启用 · ${push.address || "地址未设置"}` : "推送 未启用");
  }
  if (!tasks.length) {
    lines.push("", "当前没有运行中的任务");
    return lines.join("\n");
  }
  lines.push("", `运行中的任务 ${tasks.length}`);
  for (const task of tasks.slice(0, 8)) lines.push(`· ${describeTask(task)}`);
  if (tasks.length > 8) lines.push(`另有 ${tasks.length - 8} 个任务`);
  return lines.join("\n");
}
__name(formatStatus, "formatStatus");
function formatTaskList(snapshot) {
  const tasks = snapshot.tasks ?? [];
  if (!tasks.length) return "当前没有运行中的任务";
  return [`运行中的任务 ${tasks.length}`, ...tasks.map((task) => `· ${describeTask(task)}`)].join("\n");
}
__name(formatTaskList, "formatTaskList");
function formatTaskStatus(task) {
  const lines = [`任务 ${shortId(task.taskId)}`];
  lines.push(`状态 ${statusLabel(task.status)}${task.stopping ? "（正在停止）" : ""}`);
  if (task.mode) lines.push(`模式 ${task.mode}${task.isCycle ? " · 循环" : ""}`);
  if (task.scriptId) lines.push(`脚本 ${shortId(task.scriptId)}`);
  if (task.queueId) lines.push(`队列 ${shortId(task.queueId)}`);
  if (task.userId) lines.push(`用户 ${shortId(task.userId)}`);
  if (task.finishedAt) lines.push(`结束 ${task.finishedAt}`);
  if (task.detail) lines.push(`详情 ${truncate(task.detail, 400)}`);
  if (task.error) lines.push(`错误 ${truncate(task.error, 400)}`);
  return lines.join("\n");
}
__name(formatTaskStatus, "formatTaskStatus");
function formatQueueList(result, verbose = false) {
  const index = result.index ?? [];
  if (!index.length) return "当前没有调度队列";
  const lines = [`调度队列 ${index.length} 个`];
  for (const item of index) {
    const info = result.data?.[item.uid]?.Info ?? {};
    const flags = [];
    if (info.CycleEnabled) flags.push("循环");
    if (info.TimeEnabled) flags.push("定时");
    const name2 = info.Name ? String(info.Name) : "未命名";
    const id = verbose ? item.uid : shortId(item.uid);
    lines.push(`· ${name2} ${id}${flags.length ? `（${flags.join(" · ")}）` : ""}`);
  }
  lines.push("", "用 mas启动 [名称或 ID 前缀] 启动");
  return lines.join("\n");
}
__name(formatQueueList, "formatQueueList");
function formatScriptList(result, verbose = false) {
  const index = result.index ?? [];
  if (!index.length) return "当前没有脚本配置";
  const lines = [`脚本 ${index.length} 个`];
  for (const item of index) {
    const config = result.data?.[item.uid];
    const name2 = config?.Info?.Name ?? "未命名";
    const id = verbose ? item.uid : shortId(item.uid);
    lines.push(`· ${name2} ${id}`);
  }
  lines.push("", "用 mas启动 [名称或 ID 前缀] 启动脚本自动代理");
  return lines.join("\n");
}
__name(formatScriptList, "formatScriptList");
function scriptName(result, uid) {
  return result.data?.[uid]?.Info?.Name ?? "未命名";
}
__name(scriptName, "scriptName");
function scriptEntries(result) {
  return (result.index ?? []).map((item) => ({ uid: item.uid, name: scriptName(result, item.uid) }));
}
__name(scriptEntries, "scriptEntries");
function normalizeSearch(value) {
  return String(value ?? "").replace(/\s+/g, "").toLowerCase();
}
__name(normalizeSearch, "normalizeSearch");
function matchUidPrefix(uid, text) {
  return uid.toLowerCase().startsWith(text.toLowerCase());
}
__name(matchUidPrefix, "matchUidPrefix");
function findScript(result, query) {
  const text = query.trim();
  if (!text) return void 0;
  const matches = result.index ?? [];
  const exact = matches.find((item) => item.uid === text);
  if (exact) return { uid: exact.uid, name: result.data?.[exact.uid]?.Info?.Name ?? exact.uid };
  const prefix = matches.filter((item) => matchUidPrefix(item.uid, text));
  if (prefix.length === 1) {
    return { uid: prefix[0].uid, name: result.data?.[prefix[0].uid]?.Info?.Name ?? prefix[0].uid };
  }
  const key = normalizeSearch(text);
  const entries = Object.entries(result.data ?? {});
  for (const [uid, config] of entries) {
    if (config?.Info?.Name === text) return { uid, name: String(config.Info.Name) };
  }
  for (const [uid, config] of entries) {
    const name2 = String(config?.Info?.Name ?? "");
    if (name2 && normalizeSearch(name2) === key) return { uid, name: name2 };
  }
  const partial = entries.filter(([, config]) => normalizeSearch(String(config?.Info?.Name ?? "")).includes(key));
  if (partial.length === 1) {
    const [uid, config] = partial[0];
    return { uid, name: String(config.Info?.Name ?? uid) };
  }
  return void 0;
}
__name(findScript, "findScript");
function findQueue(result, query) {
  const text = query.trim();
  if (!text) return void 0;
  const resolve = /* @__PURE__ */ __name((uid) => {
    const config = result.data?.[uid];
    return {
      uid,
      name: config?.Info?.Name ?? uid,
      cycleEnabled: config?.Info?.CycleEnabled === true
    };
  }, "resolve");
  const matches = result.index ?? [];
  const exact = matches.find((item) => item.uid === text);
  if (exact) return resolve(exact.uid);
  const prefix = matches.filter((item) => matchUidPrefix(item.uid, text));
  if (prefix.length === 1) return resolve(prefix[0].uid);
  const key = normalizeSearch(text);
  const entries = Object.entries(result.data ?? {});
  for (const [uid, config] of entries) {
    if (config?.Info?.Name === text) return resolve(uid);
  }
  for (const [uid, config] of entries) {
    const name2 = String(config?.Info?.Name ?? "");
    if (name2 && normalizeSearch(name2) === key) return resolve(uid);
  }
  const partial = entries.filter(([, config]) => normalizeSearch(String(config?.Info?.Name ?? "")).includes(key));
  if (partial.length === 1) return resolve(partial[0][0]);
  return void 0;
}
__name(findQueue, "findQueue");
function matchUsers(users, token) {
  const text = token.trim();
  if (!text) return [];
  const exact = users.filter((user) => user.uid === text || user.name === text);
  if (exact.length) return exact;
  const key = text.toLowerCase();
  const prefix = users.filter((user) => user.uid.toLowerCase().startsWith(key));
  if (prefix.length) return prefix;
  const partial = users.filter((user) => user.name.toLowerCase().includes(key));
  return partial;
}
__name(matchUsers, "matchUsers");
function queueScriptIds(result) {
  const ids = [];
  for (const item of result.index ?? []) {
    const scriptId = result.data?.[item.uid]?.Info?.ScriptId;
    if (typeof scriptId !== "string" || !scriptId || scriptId === "-") continue;
    if (!ids.includes(scriptId)) ids.push(scriptId);
  }
  return ids;
}
__name(queueScriptIds, "queueScriptIds");
function historyRecordDate(record) {
  const value = record.time ?? record.date;
  if (typeof value !== "string") return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? "";
}
__name(historyRecordDate, "historyRecordDate");
function filterHistory(result, start, end) {
  const data = {};
  for (const users of Object.values(result.data ?? {})) {
    for (const [username, bucket] of Object.entries(users ?? {})) {
      for (const record of bucket.index ?? []) {
        const day = historyRecordDate(record);
        if (!day || day < start || day > end) continue;
        data[day] ??= {};
        data[day][username] ??= { index: [] };
        data[day][username].index?.push(record);
      }
    }
  }
  return { data };
}
__name(filterHistory, "filterHistory");
function formatHistory(result) {
  const data = result.data ?? {};
  const dates = Object.keys(data).sort().reverse();
  if (!dates.length) return "所选范围内没有执行历史";
  const lines = [];
  for (const date of dates.slice(0, 7)) {
    lines.push(date);
    const users = data[date] ?? {};
    const names = Object.keys(users);
    if (!names.length) {
      lines.push("· 无记录");
      continue;
    }
    for (const username of names) {
      const records = users[username]?.index ?? [];
      const success = records.filter((record) => isSuccessStatus(record.status)).length;
      lines.push(`· ${username} ${records.length} 条 · 成功 ${success} · 失败 ${records.length - success}`);
      for (const record of records.slice(-2)) {
        lines.push(`  ${describeHistoryRecord(record)}`);
      }
    }
  }
  return truncate(lines.join("\n"), 2200);
}
__name(formatHistory, "formatHistory");
function describeHistoryRecord(record) {
  const time = record.time ?? record.date ?? "";
  const raw = String(record.status ?? "").toUpperCase();
  const status = isSuccessStatus(raw) ? "成功" : raw === "ERROR" ? "失败" : raw || "未知";
  const summary = record.message ?? record.result ?? "";
  return `${time} ${status}${summary ? ` ${truncate(String(summary), 40)}` : ""}`;
}
__name(describeHistoryRecord, "describeHistoryRecord");
function formatUserList(scriptName3, result, verbose = false) {
  const index = result.index ?? [];
  if (!index.length) return `脚本「${scriptName3}」下还没有用户`;
  const lines = [`脚本「${scriptName3}」的用户 ${index.length} 个`];
  for (const item of index) {
    const name2 = result.data?.[item.uid]?.Info?.Name ?? "未命名";
    lines.push(`· ${name2} ${verbose ? item.uid : shortId(item.uid)}`);
  }
  lines.push("", "mas开队 时可以直接写用户名");
  return lines.join("\n");
}
__name(formatUserList, "formatUserList");
function suggestNames(names, query, limit = 5) {
  const text = normalizeSearch(query);
  const matched = text ? names.filter((name2) => normalizeSearch(name2).includes(text)) : names;
  const chosen = (matched.length ? matched : names).slice(0, limit);
  return chosen.length ? `相近的有：${chosen.join("、")}` : "";
}
__name(suggestNames, "suggestNames");
function formatRunningTasks(snapshot) {
  const tasks = snapshot.tasks ?? [];
  if (!tasks.length) return "当前没有运行中的任务，不需要停止";
  return [`运行中的任务 ${tasks.length}`, ...tasks.map((task) => `· ${describeTask(task)}`)].join("\n");
}
__name(formatRunningTasks, "formatRunningTasks");
function describeTask(task) {
  const parts = [shortId(task.taskId), task.mode ?? "未知模式"];
  if (task.scriptId) parts.push(`脚本 ${shortId(task.scriptId)}`);
  if (task.queueId) parts.push(`队列 ${shortId(task.queueId)}`);
  if (task.isCycle) parts.push("循环");
  if (task.stopping) parts.push("正在停止");
  return parts.join(" · ");
}
__name(describeTask, "describeTask");
function statusLabel(status) {
  const labels = {
    running: "运行中",
    success: "成功",
    error: "失败",
    cancelled: "已取消"
  };
  return labels[status] ?? status;
}
__name(statusLabel, "statusLabel");
function deriveAdbPath(emulatorPath) {
  const text = emulatorPath.trim();
  if (!text) return "";
  const separator = text.includes("\\") ? "\\" : "/";
  const parts = text.split(/[\\/]/);
  const base = parts.pop() ?? "";
  if (/^adb(\.exe)?$/i.test(base)) return text;
  return [...parts, "adb.exe"].join(separator);
}
__name(deriveAdbPath, "deriveAdbPath");
async function resolveAdbTarget(client, config) {
  let adbPath = config.adbPath;
  let serial = config.adbSerial;
  const notes = [];
  if (!adbPath) {
    try {
      const emulators = await client.getEmulators();
      const entries = Object.values(emulators.data ?? {});
      const paths = entries.map((entry) => entry.Info?.Path).filter((path) => typeof path === "string" && path.trim().length > 0);
      const preferred = paths.find((path) => /MuMuManager\.exe$/i.test(path)) ?? paths[0];
      if (preferred) {
        adbPath = deriveAdbPath(preferred);
        notes.push(`adb 路径取自模拟器配置：${adbPath}`);
      }
    } catch (error) {
      notes.push(`读取模拟器配置失败：${String(error.message ?? error)}`);
    }
  }
  try {
    const status = await client.getEmulatorStatus();
    const devices = Object.values(status.data ?? {}).flatMap((slots) => Object.values(slots ?? {}));
    const addresses = devices.map((device) => device.adb_address).filter((value) => typeof value === "string" && value.trim().length > 0);
    if (!serial) {
      if (addresses[0]) {
        serial = addresses[0];
        notes.push(`设备序列号取自运行中的模拟器：${serial}`);
      }
    } else if (addresses.length && !addresses.includes(serial)) {
      notes.push(`配置的设备序列号 ${serial} 不在运行中的设备里，改用 ${addresses[0]}`);
      serial = addresses[0];
    }
  } catch (error) {
    notes.push(`读取模拟器状态失败：${String(error.message ?? error)}`);
  }
  return { adbPath, serial, notes };
}
__name(resolveAdbTarget, "resolveAdbTarget");

// src/commands.ts
var DAY = 864e5;
var NL = String.fromCharCode(10);
function queueEntries(result) {
  return (result.index ?? []).map((item) => ({ uid: item.uid, name: result.data?.[item.uid]?.Info?.Name ?? "未命名" }));
}
__name(queueEntries, "queueEntries");
function screenshotImage(result, emptyText) {
  if (!result?.image_base64) return emptyText;
  const buffer = Buffer.from(result.image_base64, "base64");
  if (!buffer.length) return "AUTO-MAS 返回的图片为空，请稍后重试";
  return import_koishi2.h.image(buffer, "image/png");
}
__name(screenshotImage, "screenshotImage");
function registerCommands(deps) {
  const { config, client, notify } = deps;
  const ctx = deps.ctx;
  const isAdmin = /* @__PURE__ */ __name((session) => {
    for (const entry of config.admins) {
      const identity = parseIdentity(entry);
      if (identity && identity.platform === session.platform && identity.userId === String(session.userId)) return true;
    }
    return false;
  }, "isAdmin");
  const checkAdmin = /* @__PURE__ */ __name((session, label) => {
    if (isAdmin(session)) {
      debugLog(config.debug, "command", `${label} 管理员校验通过（${session.platform}:${session.userId}）`);
      return true;
    }
    logger.warn(`[权限] ${session.platform}:${session.userId} 尝试使用 ${label}。`);
    void session.send(`该指令仅管理员可用
把 ${session.platform}:${session.userId} 加入管理员配置后即可使用`);
    return false;
  }, "checkAdmin");
  const run = /* @__PURE__ */ __name(async (label, task) => {
    const started = Date.now();
    debugLog(config.debug, "command", `${label} 开始`);
    try {
      const result = await task();
      debugLog(config.debug, "command", `${label} 完成，用时 ${Date.now() - started}ms`);
      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      logger.warn(`[指令] ${label} 失败: ${message}`);
      return `操作失败：${describeFailure(message)}`;
    }
  }, "run");
  const MAS_IMAGES = ["AUTO-MAS.exe", "auto-mas-runtime.exe"];
  const countProcess = /* @__PURE__ */ __name((image) => {
    const result = (0, import_node_child_process.spawnSync)("tasklist", ["/FI", `IMAGENAME eq ${image}`, "/FO", "CSV", "/NH"], { windowsHide: true, encoding: "utf8" });
    const text = String(result.stdout ?? "");
    return text.split(/\r?\n/).filter((line) => line.toLowerCase().includes(image.toLowerCase())).length;
  }, "countProcess");
  const killMasProcesses = /* @__PURE__ */ __name(() => {
    for (const image of MAS_IMAGES) {
      (0, import_node_child_process.spawnSync)("taskkill", ["/IM", image, "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    }
  }, "killMasProcesses");
  const waitForProcessExit = /* @__PURE__ */ __name(async (seconds) => {
    const deadline = Date.now() + seconds * 1e3;
    do {
      if (MAS_IMAGES.every((image) => countProcess(image) === 0)) return true;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } while (Date.now() < deadline);
    return false;
  }, "waitForProcessExit");
  const isLocalBaseUrl = /* @__PURE__ */ __name((baseUrl) => {
    try {
      const host = new URL(baseUrl).hostname.toLowerCase();
      return ["127.0.0.1", "localhost", "::1", "[::1]", "0.0.0.0"].includes(host);
    } catch {
      return false;
    }
  }, "isLocalBaseUrl");
  const resolveTaskId = /* @__PURE__ */ __name((snapshot, input) => {
    const ids = (snapshot.tasks ?? []).map((task) => task.taskId);
    if (ids.includes(input)) return { id: input, candidates: [] };
    const matches = ids.filter((id) => id.startsWith(input));
    if (matches.length === 1) return { id: matches[0], candidates: [] };
    return { candidates: matches };
  }, "resolveTaskId");
  const waitForHealth = /* @__PURE__ */ __name(async (wantReady, seconds) => {
    const deadline = Date.now() + seconds * 1e3;
    let interval = 1e3;
    let lastNote = 0;
    for (; ; ) {
      const health = await client.health(true).catch(() => void 0);
      if (wantReady ? health?.ready : !health?.ready) return true;
      const elapsed = Math.round((Date.now() - (deadline - seconds * 1e3)) / 1e3);
      if (elapsed >= lastNote + 5) {
        lastNote = elapsed;
        trace("wait", `等待${wantReady ? "就绪" : "关闭"}，已等待 ${elapsed}s`);
      }
      if (Date.now() + interval >= deadline) return false;
      await new Promise((resolve) => setTimeout(resolve, interval));
      interval = Math.min(interval * 2, 5e3);
    }
  }, "waitForHealth");
  let cachedExePath;
  const runPowerShell = /* @__PURE__ */ __name((script) => {
    const result = (0, import_node_child_process.spawnSync)("powershell", ["-NoProfile", "-Command", script], {
      windowsHide: true,
      encoding: "utf8",
      timeout: 8e3
    });
    return String(result.stdout ?? "").trim();
  }, "runPowerShell");
  const validExe = /* @__PURE__ */ __name((path) => {
    const cleaned = path?.trim().replace(/^"|"$/g, "").replace(/,\d+$/, "");
    if (cleaned && cleaned.toLowerCase().endsWith(".exe") && (0, import_node_fs.existsSync)(cleaned)) return cleaned;
    return void 0;
  }, "validExe");
  const detectExePath = /* @__PURE__ */ __name(() => {
    const fromProcess = validExe(runPowerShell("(Get-Process -Name AUTO-MAS -ErrorAction SilentlyContinue | Select-Object -First 1).Path"));
    if (fromProcess) return fromProcess;
    const registry = runPowerShell(
      "$paths=@('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'); Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq 'AUTO-MAS' } | Select-Object -First 1 -ExpandProperty DisplayIcon"
    );
    const fromRegistry = validExe(registry);
    if (fromRegistry) return fromRegistry;
    const shortcuts = [
      process.env.ProgramData ? `${process.env.ProgramData}\\Microsoft\\Windows\\Start Menu\\Programs\\AUTO-MAS.lnk` : "",
      process.env.APPDATA ? `${process.env.APPDATA}\\Microsoft\\Windows\\Start Menu\\Programs\\AUTO-MAS.lnk` : ""
    ].filter(Boolean);
    for (const shortcut of shortcuts) {
      if (!(0, import_node_fs.existsSync)(shortcut)) continue;
      const target = runPowerShell(`$s=(New-Object -ComObject WScript.Shell).CreateShortcut('${shortcut.replace(/'/g, "''")}'); $s.TargetPath`);
      const fromShortcut = validExe(target);
      if (fromShortcut) return fromShortcut;
    }
    return void 0;
  }, "detectExePath");
  const resolveMasExePath = /* @__PURE__ */ __name(() => {
    const configured = validExe(config.masExePath);
    if (configured) return configured;
    if (cachedExePath) return cachedExePath;
    const detected = detectExePath();
    if (detected) {
      cachedExePath = detected;
      logger.info(`[进程] 已自动识别 AUTO-MAS 启动路径：${detected}`);
    }
    return detected;
  }, "resolveMasExePath");
  const hasInteractiveDesktop = /* @__PURE__ */ __name(() => {
    const output = runPowerShell(
      `$sid=(Get-Process -Id $PID).SessionId; $ex=@(Get-Process explorer -ErrorAction SilentlyContinue | Select-Object -ExpandProperty SessionId -Unique); "{0}|{1}" -f $sid, ($ex -join ',')`
    );
    const [sidText, sessionText] = output.split("|");
    const sid = Number.parseInt(sidText ?? "", 10);
    const sessions = (sessionText ?? "").split(",").map((value) => Number.parseInt(value, 10)).filter((value) => !Number.isNaN(value));
    if (Number.isNaN(sid) || sessions.length === 0) return true;
    return sessions.includes(sid);
  }, "hasInteractiveDesktop");
  const LAUNCH_TASK = "Koishi-AUTO-MAS-Launcher";
  const launchViaTask = /* @__PURE__ */ __name((exePath) => {
    const userSid = runPowerShell("([Security.Principal.WindowsIdentity]::GetCurrent()).User.Value");
    if (!userSid) return false;
    const escape = /* @__PURE__ */ __name((value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), "escape");
    const xml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers />
  <Principals>
    <Principal id="Author">
      <UserId>${escape(userSid)}</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${escape(exePath)}</Command>
      <WorkingDirectory>${escape((0, import_node_path.dirname)(exePath))}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>`;
    const file = (0, import_node_path.join)((0, import_node_os.tmpdir)(), "auto-mas-connector-launch.xml");
    try {
      (0, import_node_fs.writeFileSync)(file, "\uFEFF" + xml, "utf16le");
      const create = (0, import_node_child_process.spawnSync)("schtasks", ["/Create", "/TN", LAUNCH_TASK, "/XML", file, "/F"], { windowsHide: true, encoding: "utf8" });
      const runTask = (0, import_node_child_process.spawnSync)("schtasks", ["/Run", "/TN", LAUNCH_TASK], { windowsHide: true, encoding: "utf8" });
      if (create.status !== 0 || runTask.status !== 0) {
        logger.warn(`[进程] 计划任务启动失败：${String(create.stderr || runTask.stderr || "").trim()}`);
        return false;
      }
      debugLog(config.debug, "process", `已通过计划任务在交互会话启动 ${exePath}`);
      return true;
    } finally {
      (0, import_node_fs.rmSync)(file, { force: true });
    }
  }, "launchViaTask");
  const spawnMas = /* @__PURE__ */ __name((exePath) => {
    if (!(0, import_node_fs.existsSync)(exePath)) throw new Error(`找不到 AUTO-MAS 启动文件：${exePath}`);
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = (0, import_node_child_process.spawn)(exePath, [], {
      cwd: (0, import_node_path.dirname)(exePath),
      detached: true,
      stdio: "ignore",
      env
    });
    child.on("error", (error) => logger.warn(`[进程] 启动失败：${getErrorMessage(error)}`));
    child.unref();
    debugLog(config.debug, "process", `已启动 ${exePath}（PID ${child.pid ?? "unknown"}）`);
  }, "spawnMas");
  const trace = /* @__PURE__ */ __name((label, detail) => {
    debugLog(config.debug, "command", `${label} ${detail}`);
  }, "trace");
  const alias = /* @__PURE__ */ __name((command, name2) => {
    if (config.enableChineseAlias) command.alias(name2);
    return command;
  }, "alias");
  const describeTargets = /* @__PURE__ */ __name(async () => {
    const [scripts, queues] = await Promise.all([client.getScripts(), client.getQueues()]);
    const scriptNames = scriptEntries(scripts).map((item) => item.name).filter(Boolean);
    const queueNames = queueEntries(queues).map((item) => item.name).filter(Boolean);
    const lines = ["请带上脚本或队列的 ID / 名称："];
    if (scriptNames.length) lines.push(`脚本：${scriptNames.map((name2) => `「${name2}」`).join("、")}`);
    if (queueNames.length) lines.push(`队列：${queueNames.map((name2) => `「${name2}」`).join("、")}`);
    if (!scriptNames.length && !queueNames.length) lines.push("AUTO-MAS 里还没有脚本或队列");
    return lines.join("\n");
  }, "describeTargets");
  const loadUsers = /* @__PURE__ */ __name(async (scriptId) => {
    const result = await client.getUsers(scriptId);
    const data = result.data ?? {};
    const ordered = (result.index ?? []).map((item) => item.uid).filter((uid) => data[uid]);
    const uids = ordered.length ? ordered : Object.keys(data);
    const users = uids.map((uid) => ({ uid, name: data[uid]?.Info?.Name ?? uid }));
    trace("加载用户", `脚本 ${scriptId}：${users.length} 个`);
    return users;
  }, "loadUsers");
  const matchUser = /* @__PURE__ */ __name((users, token) => {
    const matched = matchUsers(users, token);
    return matched.length === 1 ? matched[0] : void 0;
  }, "matchUser");
  const resolveQueueUsers = /* @__PURE__ */ __name(async (scriptIds, scripts, tokens) => {
    const names = /* @__PURE__ */ new Map();
    for (const item of scriptEntries(scripts)) {
      names.set(item.uid, item.name);
    }
    const resolution = { queueUserIds: {}, skipped: [], unmatched: [...tokens], ambiguous: [] };
    for (const scriptId of scriptIds) {
      const users = await loadUsers(scriptId);
      const matched = [];
      for (const token of tokens) {
        const candidates = matchUsers(users, token);
        if (candidates.length > 1) {
          if (!resolution.ambiguous.includes(token)) resolution.ambiguous.push(token);
          continue;
        }
        if (!candidates.length) continue;
        const user = candidates[0];
        if (!matched.includes(user.uid)) matched.push(user.uid);
        const index = resolution.unmatched.indexOf(token);
        if (index >= 0) resolution.unmatched.splice(index, 1);
      }
      resolution.queueUserIds[scriptId] = matched;
      if (!matched.length) resolution.skipped.push(names.get(scriptId) ?? scriptId);
    }
    return resolution;
  }, "resolveQueueUsers");
  ctx.command("mas", "AUTO-MAS 控制").usage(HELP_TEXT).action(({ session }) => {
    if (!session) return "";
    trace("mas", "显示帮助");
    return HELP_TEXT;
  });
  alias(ctx.command("mas.status", "查看 AUTO-MAS 状态"), "mas状态").usage("检查后端是否就绪，并列出运行中的任务、已安排的脚本数量与推送状态。").example("mas.status").action(({ session }) => {
    if (!session) return "";
    return run("mas.status", async () => {
      const [health, snapshot] = await Promise.all([client.health(), client.getRuntimeSnapshot()]);
      let pushInfo;
      try {
        pushInfo = readPushSetting(await client.getSetting());
      } catch {
        pushInfo = void 0;
      }
      trace("mas.status", `ready=${String(health.ready)}，运行中 ${snapshot.tasks?.length ?? 0}，已安排 ${snapshot.scheduledScripts?.length ?? 0}，推送 ${pushInfo ? pushInfo.enabled ? "已启用" : "未启用" : "未知"}`);
      return formatStatus(health, snapshot, pushInfo);
    });
  });
  alias(ctx.command("mas.task [taskId:string]", "查看任务状态"), "mas任务").usage("不带参数时列出运行中的任务；带完整任务 ID 或运行中任务 ID 的前缀时查询该任务的结果。").example("mas.task").example("mas.task 0f6f0c8e-2f4a-4a7f-9f2e-8f6a1c3d5b7e").action(({ session }, taskId) => {
    if (!session) return "";
    return run("mas.task", async () => {
      if (!taskId) {
        const snapshot = await client.getRuntimeSnapshot();
        trace("mas.task", `列出运行中任务：${snapshot.tasks?.length ?? 0} 个`);
        return formatTaskList(snapshot);
      }
      let resolvedId = taskId;
      if (!/^[0-9a-f-]{36}$/i.test(taskId)) {
        const snapshot = await client.getRuntimeSnapshot();
        const resolved = resolveTaskId(snapshot, taskId);
        if (!resolved.id) {
          if (resolved.candidates.length) {
            return [`有多个任务匹配「${taskId}」`, ...resolved.candidates.map((id) => `· ${id}`), "请改用更长的 ID"].join(NL);
          }
          return `运行中的任务里没有匹配「${taskId}」的 ID${NL}用 mas.task 查看运行中的任务，或粘贴完整任务 ID`;
        }
        resolvedId = resolved.id;
      }
      const status = await client.getTask(resolvedId);
      trace("mas.task", `查询任务 ${resolvedId}：${status.status ?? "未知状态"}`);
      return formatTaskStatus(status);
    });
  });
  alias(ctx.command("mas.queue", "查看调度队列"), "mas队列").option("verbose", "-v, --verbose 显示完整 ID").usage("列出调度队列、是否启用定时或循环，以及队列 ID；ID 默认只显示前 8 位。").example("mas.queue").action(({ session, options }) => {
    if (!session) return "";
    return run("mas.queue", async () => {
      const result = await client.getQueues();
      trace("mas.queue", `verbose=${Boolean(options?.verbose)}，返回 ${result.index?.length ?? 0} 个队列`);
      return formatQueueList(result, Boolean(options?.verbose));
    });
  });
  alias(ctx.command("mas.scripts", "查看脚本配置"), "mas脚本").option("verbose", "-v, --verbose 显示完整 ID").usage("列出脚本配置、所属游戏与脚本 ID；ID 默认只显示前 8 位。").example("mas.scripts").action(({ session, options }) => {
    if (!session) return "";
    return run("mas.scripts", async () => {
      const result = await client.getScripts();
      trace("mas.scripts", `verbose=${Boolean(options?.verbose)}，返回 ${result.index?.length ?? 0} 个脚本`);
      return formatScriptList(result, Boolean(options?.verbose));
    });
  });
  alias(ctx.command("mas.users [script:string]", "查看脚本下的用户"), "mas用户").option("verbose", "-v, --verbose 显示完整用户 ID").usage("不带参数时列出脚本和用户数量；带脚本 ID 或名称时列出该脚本下的用户名与用户 ID。").example("mas.users").example("mas.users 剿灭").action(({ session, options }, scriptQuery) => {
    if (!session) return "";
    return run("mas.users", async () => {
      const scripts = await client.getScripts();
      const items = scriptEntries(scripts);
      trace("mas.users", `脚本 ${items.length} 个，参数「${scriptQuery ?? ""}」`);
      if (!items.length) return "AUTO-MAS 里还没有脚本配置";
      if (!scriptQuery) {
        const lines = [`脚本与用户数量（${items.length} 个）`];
        for (const item of items) {
          const result = await client.getUsers(item.uid);
          const count = (result.index?.length ?? 0) || Object.keys(result.data ?? {}).length;
          lines.push(`· ${item.name} ${count} 个用户`);
        }
        trace("mas.users", `概览：${items.length} 个脚本`);
        lines.push("", "用 mas用户 [脚本] 查看具体用户");
        return lines.join("\n");
      }
      const text = scriptQuery.trim();
      const key = normalizeSearch(text);
      const matches = items.filter((item) => item.uid === text || item.name === text || normalizeSearch(item.name) === key);
      const chosen = matches.length ? matches : items.filter((item) => normalizeSearch(item.name).includes(key));
      if (!chosen.length) {
        const names = items.map((item) => item.name);
        const hint = suggestNames(names, text);
        return [`没有找到名称里包含「${text}」的脚本`, hint].filter(Boolean).join("\n");
      }
      trace("mas.users", `命中 ${chosen.length} 个脚本：${chosen.map((item) => item.name).join("、")}`);
      const blocks = [];
      for (const item of chosen.slice(0, 3)) {
        blocks.push(formatUserList(item.name, await client.getUsers(item.uid), Boolean(options?.verbose)));
      }
      return blocks.join("\n\n");
    });
  });
  alias(ctx.command("mas.history [days:number]", "查询执行历史"), "mas历史").usage("按天查询执行历史，默认最近 1 天，最多 90 天；兼容 AUTO-MAS 5.7 与 5.8。").example("mas.history").example("mas.history 7").action(({ session }, days) => {
    if (!session) return "";
    return run("mas.history", async () => {
      const span = clampNumber(days ?? 1, 1, 90, 1);
      const end = /* @__PURE__ */ new Date();
      const start = new Date(end.getTime() - (span - 1) * DAY);
      const queryStart = new Date(start.getTime() - DAY);
      trace("mas.history", `${span} 天：${formatDate(start)} ~ ${formatDate(end)}`);
      const raw = await client.searchHistory("DAILY", formatDate(queryStart), formatDate(end));
      const result = filterHistory(raw, formatDate(start), formatDate(end));
      trace("mas.history", `返回 ${Object.keys(result.data ?? {}).length} 天记录`);
      return formatHistory(result);
    });
  });
  alias(ctx.command("mas.start [query:string]", "启动脚本或队列"), "mas启动").option("cycle", "-c, --cycle 以循环模式启动队列").usage("参数可以是脚本或队列的 ID，也可以是名称；先匹配脚本，再匹配队列。").example("mas.start").example("mas.start 剿灭 -c").action(({ session, options }, query) => {
    if (!session) return "";
    if (!checkAdmin(session, "mas.start")) return "";
    const cycle = Boolean(options?.cycle);
    trace("mas.start", `参数「${query ?? ""}」，循环 ${cycle}`);
    return run("mas.start", async () => {
      if (!query) return describeTargets();
      const [scripts, queues] = await Promise.all([client.getScripts(), client.getQueues()]);
      const script = findScript(scripts, query);
      if (script) {
        trace("mas.start", `匹配脚本「${script.name}」（${script.uid}）`);
        const result2 = await client.startTask(script.uid, "AutoProxy");
        trace("mas.start", `脚本任务已提交：${result2.taskId}`);
        return `已启动脚本「${script.name}」
任务 ID ${result2.taskId}
用 mas.task ${result2.taskId} 查看进度`;
      }
      const queue = findQueue(queues, query);
      if (!queue) {
        const names = [
          ...scriptEntries(scripts).map((item) => item.name).filter(Boolean),
          ...queueEntries(queues).map((item) => item.name).filter(Boolean)
        ];
        const hint = suggestNames(names, query);
        return [`没有找到 ID 或名称是「${query}」的脚本或队列`, hint].filter(Boolean).join("\n");
      }
      trace("mas.start", `匹配队列「${queue.name}」（${queue.uid}），循环 ${cycle}`);
      if (cycle && !queue.cycleEnabled) return `队列「${queue.name}」没有启用循环
请先去掉 -c，或在 AUTO-MAS 里打开循环`;
      const result = await client.startTask(queue.uid, cycle ? "CycleRun" : "AutoProxy");
      trace("mas.start", `队列任务已提交：${result.taskId}`);
      return `已启动队列「${queue.name}」${cycle ? "（循环）" : ""}
任务 ID ${result.taskId}`;
    });
  });
  alias(ctx.command("mas.startqueue [queue:string] [users:text]", "用指定用户启动队列"), "mas开队").usage(
    "第一个参数是队列 ID 或名称，后面跟一个或多个用户名 / 用户 ID。\n用户会按队列里每个脚本分别匹配；没有匹配到用户的脚本本次跳过。"
  ).example("mas.startqueue 剿灭 affk10").action(({ session }, queueQuery, userText) => {
    if (!session) return "";
    if (!checkAdmin(session, "mas.startqueue")) return "";
    const tokens = String(userText ?? "").split(/[,，、\s]+/).map((item) => item.trim()).filter(Boolean);
    trace("mas.startqueue", `队列「${queueQuery ?? ""}」，用户「${tokens.join("、")}」`);
    return run("mas.startqueue", async () => {
      if (!queueQuery) {
        const queues2 = await client.getQueues();
        const names = queueEntries(queues2).map((item) => item.name).filter(Boolean);
        return names.length ? `请带上队列 ID 或名称：${names.map((name2) => `「${name2}」`).join("、")}` : "AUTO-MAS 里还没有调度队列";
      }
      if (!tokens.length) return "请至少提供一个用户名或用户 ID\n可用 mas.users 「脚本名称」 查看";
      const [queues, scripts] = await Promise.all([client.getQueues(), client.getScripts()]);
      const queue = findQueue(queues, queueQuery);
      if (queue) trace("mas.startqueue", `匹配队列「${queue.name}」（${queue.uid}）`);
      if (!queue) {
        const hint = suggestNames(queueEntries(queues).map((item) => item.name), queueQuery);
        return [`没有找到 ID 或名称是「${queueQuery}」的队列`, hint].filter(Boolean).join("\n");
      }
      const scriptIds = queueScriptIds(await client.getQueueItems(queue.uid));
      trace("mas.startqueue", `队列项脚本 ${scriptIds.length} 个：${scriptIds.join("、")}`);
      if (!scriptIds.length) {
        return `队列「${queue.name}」里没有已绑定脚本的队列项
先在 AUTO-MAS 里给队列添加脚本`;
      }
      const resolution = await resolveQueueUsers(scriptIds, scripts, tokens);
      trace(
        "mas.startqueue",
        `匹配结果：${Object.entries(resolution.queueUserIds).map(([id, users2]) => `${id.slice(0, 8)}=${users2.length}`).join("，")}；跳过 ${resolution.skipped.length}，未匹配 ${resolution.unmatched.length}，歧义 ${resolution.ambiguous.length}`
      );
      if (resolution.ambiguous.length) {
        return [
          `这些用户名在脚本里匹配到多个用户，请写得更具体：${resolution.ambiguous.join("、")}`,
          "可用 mas用户 [脚本] 查看用户名与 ID"
        ].join("\n");
      }
      if (resolution.unmatched.length) {
        const names = /* @__PURE__ */ new Set();
        for (const scriptId of scriptIds) {
          for (const user of await loadUsers(scriptId)) names.add(user.name);
        }
        const hint = suggestNames([...names], resolution.unmatched[0]);
        return [
          `这些用户没有匹配到任何脚本：${resolution.unmatched.join("、")}`,
          [...names].length ? `当前脚本里的用户：${[...names].slice(0, 8).join("、")}` : "",
          hint
        ].filter(Boolean).join("\n");
      }
      const matchedCounts = Object.values(resolution.queueUserIds).filter((list) => list.length);
      const users = new Set(matchedCounts.flat());
      let result;
      try {
        result = await client.startQueueWithUsers(queue.uid, resolution.queueUserIds);
      } catch (error) {
        const message = getErrorMessage(error);
        if (message.includes("不属于脚本")) {
          return [
            `启动失败：${message}`,
            "提示：用户必须来自脚本配置内部，不能直接用 QQ 号",
            "先用 mas.users 「脚本名称」 查看用户名和用户 ID"
          ].join(String.fromCharCode(10));
        }
        throw error;
      }
      trace("mas.startqueue", `任务已提交：${result.taskId}，用户 ${users.size} 个，脚本 ${matchedCounts.length} 个`);
      const lines = [
        `已用 ${users.size} 个用户启动队列「${queue.name}」中的 ${matchedCounts.length} 个脚本`,
        `任务 ID ${result.taskId}`
      ];
      if (resolution.skipped.length) lines.push("", `跳过的脚本 ${resolution.skipped.join("、")}（这些脚本里没有匹配的用户）`);
      return lines.join("\n");
    });
  });
  alias(ctx.command("mas.stop [taskId:string]", "停止任务"), "mas停止").usage("不带参数时列出运行中的任务；带完整任务 ID 或运行中任务 ID 的前缀时停止该任务。").example("mas.stop").example("mas.stop 0f6f0c8e-2f4a-4a7f-9f2e-8f6a1c3d5b7e").action(({ session }, taskId) => {
    if (!session) return "";
    if (!checkAdmin(session, "mas.stop")) return "";
    return run("mas.stop", async () => {
      if (!taskId) {
        const snapshot = await client.getRuntimeSnapshot();
        trace("mas.stop", `列出运行中任务：${snapshot.tasks?.length ?? 0} 个`);
        return formatRunningTasks(snapshot);
      }
      let resolvedId = taskId;
      if (!/^[0-9a-f-]{36}$/i.test(taskId)) {
        const snapshot = await client.getRuntimeSnapshot();
        const resolved = resolveTaskId(snapshot, taskId);
        if (!resolved.id) {
          if (resolved.candidates.length) {
            return [`有多个任务匹配「${taskId}」`, ...resolved.candidates.map((id) => `· ${id}`), "请改用更长的 ID"].join(NL);
          }
          return `运行中的任务里没有匹配「${taskId}」的 ID${NL}用 mas停止 列出运行中的任务，或粘贴完整任务 ID`;
        }
        resolvedId = resolved.id;
      }
      trace("mas.stop", `停止任务 ${resolvedId}`);
      await client.stopTask(resolvedId);
      return `已请求停止任务 ${resolvedId}
用 mas.task ${resolvedId} 确认状态`;
    });
  });
  alias(ctx.command("mas.power [action:string]", "执行电源操作"), "mas电源").option("yes", "-y, --yes 确认执行").usage("设置所有任务结束后执行的电源操作（控制电脑关机、重启、休眠等），不会立即执行；必须加 -y 确认。NoAction 表示取消。").example("mas.power").example("mas.power 重启 -y").action(({ session, options }, action) => {
    if (!session) return "";
    if (!checkAdmin(session, "mas.power")) return "";
    if (!action) return formatPowerHelp();
    trace("mas.power", `操作「${action}」，确认 ${Boolean(options?.yes)}`);
    const signal = resolvePowerSignal(action);
    if (!signal) {
      return `无法识别电源操作「${action}」
支持：${POWER_SIGNALS.join(" / ")}，也可以用中文（关机、重启、休眠等）`;
    }
    if (!options?.yes) return `将设置电源操作 ${signal}，在所有任务结束后执行
确认请改为：mas.power ${action} -y`;
    return run("mas.power", async () => {
      trace("mas.power", `提交信号 ${signal}`);
      await client.setPower(signal);
      return `已设置电源操作 ${signal}
将在所有任务结束后执行；当前没有运行任务时不会触发
用 mas.power NoAction -y 可取消`;
    });
  });
  alias(ctx.command("mas.process [action:string]", "管理 AUTO-MAS 进程"), "mas进程").option("yes", "-y, --yes 确认执行").usage("查看、关闭、启动或重启 AUTO-MAS；同机关闭会退出窗口与后端，跨机只能关闭后端；启动和重启需要同机并配置启动路径。必须加 -y 才会执行。").example("mas.process").example("mas.process 重启 -y").action(({ session, options }, action) => {
    if (!session) return "";
    if (!checkAdmin(session, "mas.process")) return "";
    const text = String(action ?? "").trim();
    const command = resolveProcessAction(text);
    trace("mas.process", `操作「${text || "状态"}」，确认 ${Boolean(options?.yes)}`);
    if (!text || command === "status") {
      return run("mas.process", async () => {
        const health = await client.health().catch(() => void 0);
        const local = isLocalBaseUrl(config.baseUrl);
        return [
          `AUTO-MAS ${health?.ready ? `运行中 · ${health.version ?? "unknown"}` : "未运行"}`,
          "",
          `进程管理 ${config.processControl ? "已启用" : "未启用"}`,
          `启动路径 ${resolveMasExePath() ?? "未识别"}`,
          `地址 ${config.baseUrl}（${local ? "同机" : "跨机，仅支持关闭后端"}）`
        ].join("\n");
      });
    }
    if (!command) return `无法识别操作「${text}」
支持：状态、关闭、启动、重启`;
    if (command === "close") {
      if (!options?.yes) {
        const scope = isLocalBaseUrl(config.baseUrl) ? "并退出窗口" : "（仅后端）";
        return `将关闭 AUTO-MAS${scope}，正在运行的任务会被中断
确认请改为：mas.process 关闭 -y`;
      }
      return run("mas.process", async () => {
        const local = isLocalBaseUrl(config.baseUrl);
        const health = await client.health().catch(() => void 0);
        if (health?.ready) {
          await client.close().catch((error) => debugLog(config.debug, "process", `关闭请求失败：${getErrorMessage(error)}`));
          await waitForHealth(false, Math.min(config.processTimeout, 20));
        }
        if (!local) {
          return "已请求关闭远程 AUTO-MAS 的后端\n跨机部署无法关闭那台机器上的窗口，需要手动退出程序";
        }
        killMasProcesses();
        const gone = await waitForProcessExit(15);
        trace("mas.process", `关闭进程：${gone ? "完成" : "超时"}`);
        return gone ? "已关闭 AUTO-MAS（窗口与后端）" : "后端已关闭，但还有 AUTO-MAS 进程没有退出\n请到任务管理器检查";
      });
    }
    if (!config.processControl) return "进程管理未启用\n请先在配置的「进程管理」中开启";
    if (!isLocalBaseUrl(config.baseUrl)) return "当前连接的是跨机 AUTO-MAS\n插件只能在同机拉起进程，关闭可以正常使用";
    const exePath = resolveMasExePath();
    if (!exePath) return "自动识别 AUTO-MAS 启动路径失败\n请在配置的「进程管理」中填写启动文件路径";
    if (!options?.yes) return `将${commandLabel(command)} AUTO-MAS（会先退出当前进程）
确认请改为：mas.process ${text} -y`;
    return run("mas.process", async () => {
      const health = await client.health().catch(() => void 0);
      if (command === "start" && health?.ready) return `AUTO-MAS 已在运行（${health.version ?? "unknown"}），无需启动`;
      if (command === "restart" && health?.ready) {
        await client.close().catch((error) => debugLog(config.debug, "process", `关闭请求失败：${getErrorMessage(error)}`));
        await waitForHealth(false, Math.min(config.processTimeout, 20));
      }
      killMasProcesses();
      const gone = await waitForProcessExit(15);
      trace("mas.process", `清理旧进程：${gone ? "完成" : "超时"}`);
      if (!gone) return "旧进程没有完全退出，已取消启动，避免出现两个实例";
      if (!hasInteractiveDesktop() && launchViaTask(exePath)) {
        trace("mas.process", "会话无桌面，已改用计划任务启动");
      } else {
        spawnMas(exePath);
      }
      const ready = await waitForHealth(true, config.processTimeout);
      if (!ready) return "已启动进程，但在等待时间内没有就绪\n请查看 AUTO-MAS 的日志";
      const next = await client.health().catch(() => void 0);
      return `已${command === "restart" ? "重启" : "启动"} AUTO-MAS${next?.version ? `（${next.version}）` : ""}`;
    });
  });
  alias(ctx.command("mas.test", "发送测试通知"), "mas测试").usage("向通知配置里的所有目标发送一条测试消息，用来检查 Koishi 到聊天平台的链路。").example("mas.test").action(({ session }) => {
    if (!session) return "";
    if (!checkAdmin(session, "mas.test")) return "";
    return run("mas.test", async () => {
      trace("mas.test", `目标 ${config.notifyTargets.length} 个`);
      const result = await notify.sendTest();
      trace("mas.test", `结果 ${result.split("\n").length} 行`);
      return result;
    });
  });
  alias(ctx.command("mas.screenshot [title:text]", "截取游戏窗口"), "mas截图").usage("按配置的截图方式执行：自动、窗口或 ADB；-a 强制使用 ADB。ADB 路径或序列号留空时会自动识别。").option("adb", "-a, --adb 直接使用 ADB 截图").example("mas.screenshot").example("mas.screenshot -a").action(({ session, options }, title) => {
    if (!session) return "";
    if (!checkAdmin(session, "mas.screenshot")) return "";
    return run("mas.screenshot", async () => {
      const mode = options?.adb ? "adb" : config.screenshotMode;
      trace("mas.screenshot", `方式 ${mode}，窗口「${title?.trim() || config.gameWindow}」`);
      const captureWindow = /* @__PURE__ */ __name(async () => {
        const result = await client.screenshot(title?.trim() || config.gameWindow);
        trace("mas.screenshot", `窗口截图返回 ${result.image_base64?.length ?? 0} 字节 base64`);
        return screenshotImage(result, "AUTO-MAS 没有返回图片，请确认游戏窗口标题是否正确");
      }, "captureWindow");
      const captureAdb = /* @__PURE__ */ __name(async () => {
        const target = await resolveAdbTarget(client, config);
        trace("mas.screenshot", `ADB 目标：path=${target.adbPath ?? "(空)"}，serial=${target.serial ?? "(空)"}，备注 ${target.notes.length} 条`);
        if (!target.adbPath || !target.serial) {
          const hint = target.notes.length ? `
${target.notes.join("\n")}` : "";
          throw new Error(`没有找到可用的 ADB
先启动模拟器，或在「截图」分组填写 adb 路径与设备序列号${hint}`);
        }
        const result = await client.screenshotAdb(target.adbPath, target.serial);
        trace("mas.screenshot", `ADB 截图返回 ${result.image_base64?.length ?? 0} 字节 base64`);
        return screenshotImage(result, "ADB 没有返回图片，请确认设备序列号是否正确");
      }, "captureAdb");
      if (mode === "adb") return captureAdb();
      if (mode === "window") return captureWindow();
      try {
        return await captureWindow();
      } catch (windowError) {
        debugLog(config.debug, "截图", `窗口截图失败，改用 ADB: ${getErrorMessage(windowError)}`);
        try {
          return await captureAdb();
        } catch (adbError) {
          return `窗口截图失败：${getErrorMessage(windowError)}
ADB 截图失败：${getErrorMessage(adbError)}`;
        }
      }
    });
  });
  alias(ctx.command("mas.push [address:string]", "AUTO-MAS 推送设置"), "mas推送").option("enable", "-e, --enable 启用 AUTO-MAS 的 Koishi 推送").option("disable", "-d, --disable 关闭 AUTO-MAS 的 Koishi 推送").option("test", "-t, --test 让 AUTO-MAS 发一条测试通知").usage(
    "查看或修改 AUTO-MAS 的 Koishi 推送设置。\n启用时默认使用 ws://127.0.0.1:5140" + DEFAULT_LISTEN_PATH + "，也可在参数里写完整地址；令牌跟随插件配置。\nAUTO-MAS 只在启动时初始化推送通道，修改后需要重启一次。"
  ).example("mas.push").example("mas.push -e").example("mas.push ws://192.168.5.20:5140/AUTO_MAS -e").action(({ session, options }, address) => {
    if (!session) return "";
    if (!checkAdmin(session, "mas.push")) return "";
    return run("mas.push", async () => {
      trace("mas.push", `参数「${address ?? ""}」，enable=${Boolean(options?.enable)}，disable=${Boolean(options?.disable)}，test=${Boolean(options?.test)}`);
      if (options?.disable) {
        await client.updateNotifySetting({ IfKoishiSupport: false });
        return "已关闭 AUTO-MAS 的 Koishi 推送";
      }
      if (options?.enable) {
        const target = String(address ?? "").trim() || expectedPushAddress(config);
        await client.updateNotifySetting({
          IfKoishiSupport: true,
          KoishiServerAddress: target,
          KoishiToken: config.token
        });
        return [
          "已启用 AUTO-MAS 的 Koishi 推送",
          `地址 ${target}`,
          `令牌 ${config.token ? "与插件一致" : "未设置"}`,
          "设置已写入",
          "需要重启一次 AUTO-MAS 才会启动推送通道",
          "重启后可用 mas推送 -t 验证"
        ].join("\n");
      }
      if (options?.test) {
        try {
          await client.testNotify();
          return "已请求 AUTO-MAS 发送测试通知\n请查看聊天目标是否收到";
        } catch (error) {
          const message = getErrorMessage(error);
          if (/koishi/i.test(message)) {
            return [
              `测试通知发送失败：${message}`,
              "AUTO-MAS 的 Koishi 推送通道未启动",
              "修改推送设置后需要重启一次 AUTO-MAS",
              "重启后仍失败时，检查 KoishiServerAddress 是否为 ws://<Koishi 地址>:<端口>/AUTO_MAS，以及该端口是否可达。"
            ].join("\n");
          }
          throw error;
        }
      }
      const push = readPushSetting(await client.getSetting());
      const expected = expectedPushAddress(config);
      const lines = [
        `推送 ${push.enabled ? "已启用" : "未启用"}`,
        `地址 ${push.address || "未设置"}`,
        `令牌 ${push.tokenConfigured ? "已设置" : "未设置"}`,
        `建议 ${expected}`
      ];
      if (!push.enabled) lines.push("启用：mas推送 -e，写入后重启 AUTO-MAS");
      else if (push.address && push.address !== expected) lines.push("当前地址与建议值不同，如有需要可重新执行 mas推送 -e");
      else lines.push("修改设置后需重启 AUTO-MAS 才会生效");
      return lines.join("\n");
    });
  });
  alias(ctx.command("mas.whoami", "查看自己的平台标识"), "mas我是谁").usage("显示 平台:用户ID，用来填写管理员名单。").example("mas.whoami").action(({ session }) => {
    if (!session) return "";
    const identity = `${session.platform}:${session.userId}`;
    trace("mas.whoami", `${identity}，管理员 ${isAdmin(session)}`);
    return `你的标识：${identity}
管理员权限：${isAdmin(session) ? "可用" : "不可用（把上面的标识加入管理员配置即可）"}`;
  });
}
__name(registerCommands, "registerCommands");
function formatPowerHelp() {
  return [
    "电源操作控制电脑关机、重启、休眠、注销等，在所有任务结束后执行，不会立即生效；必须加 -y 确认",
    "支持的写法：",
    "- 关机 / shutdown",
    "- 强制关机 / shutdownforce",
    "- 重启 / reboot",
    "- 休眠 / hibernate",
    "- 睡眠 / sleep",
    "- 退出 / killself",
    "- 重启自身 / restartself",
    "- 注销 / logoff",
    "示例：mas.power 重启 -y"
  ].join("\n");
}
__name(formatPowerHelp, "formatPowerHelp");
function resolveProcessAction(input) {
  const text = input.trim().toLowerCase();
  if (!text) return "status";
  if (["状态", "查看", "status"].includes(text)) return "status";
  if (["关闭", "退出", "close", "stop"].includes(text)) return "close";
  if (["启动", "start", "launch"].includes(text)) return "start";
  if (["重启", "restart", "relaunch"].includes(text)) return "restart";
  return void 0;
}
__name(resolveProcessAction, "resolveProcessAction");
function commandLabel(command) {
  return command === "restart" ? "重启" : "启动";
}
__name(commandLabel, "commandLabel");
function resolvePowerSignal(input) {
  const text = String(input ?? "").trim();
  if (!text) return void 0;
  const direct = POWER_ALIASES[text.toLowerCase()] ?? POWER_ALIASES[text];
  if (direct) return direct;
  const upper = text.toUpperCase();
  return POWER_SIGNALS.includes(upper) ? upper : void 0;
}
__name(resolvePowerSignal, "resolvePowerSignal");

// src/config.ts
var import_koishi3 = require("koishi");
var categoryChoices = Object.entries(NOTIFICATION_CATEGORIES).map(
  ([value, label]) => import_koishi3.Schema.const(value).description(label)
);
var defaultCategories = Object.keys(NOTIFICATION_CATEGORIES).map((category) => ({ category, enabled: true }));
var Config = import_koishi3.Schema.intersect([
  import_koishi3.Schema.object({
    baseUrl: import_koishi3.Schema.string().default(DEFAULT_BASE_URL).description("AUTO-MAS 后端地址；跨机填对方可达地址"),
    timeout: import_koishi3.Schema.number().min(1e3).max(3e4).step(500).default(8e3).description("请求超时（毫秒）")
  }).description("连接"),
  import_koishi3.Schema.object({
    listenMode: import_koishi3.Schema.union([
      import_koishi3.Schema.const("auto").description("自动"),
      import_koishi3.Schema.const("server").description("复用 Koishi 服务"),
      import_koishi3.Schema.const("standalone").description("独立监听")
    ]).role("radio").default("auto").description("AUTO-MAS 推送连接的挂载方式"),
    listenPath: import_koishi3.Schema.string().default(DEFAULT_LISTEN_PATH).description("推送路径，需与 AUTO-MAS 的推送地址一致"),
    host: import_koishi3.Schema.string().default("127.0.0.1").description("独立监听地址；跨机访问填 0.0.0.0"),
    token: import_koishi3.Schema.string().role("secret").default("").description("与 AUTO-MAS 的 KoishiToken 一致；留空不校验"),
    port: import_koishi3.Schema.natural().min(1024).max(65535).default(DEFAULT_STANDALONE_PORT).description("独立监听端口")
  }).description("推送服务"),
  import_koishi3.Schema.object({
    processControl: import_koishi3.Schema.boolean().default(false).description("允许通过 mas.process 关闭、启动或重启 AUTO-MAS"),
    masExePath: import_koishi3.Schema.string().default("").description("AUTO-MAS 启动文件路径；留空自动识别"),
    processTimeout: import_koishi3.Schema.number().min(10).max(300).step(5).default(DEFAULT_PROCESS_TIMEOUT).description("等待启动或关闭的秒数")
  }).description("进程管理"),
  import_koishi3.Schema.object({
    notifyEnabled: import_koishi3.Schema.boolean().default(true).description("接收 AUTO-MAS 推送"),
    notifyImage: import_koishi3.Schema.boolean().default(true).description("把通知文本渲染为图片发送"),
    sendImages: import_koishi3.Schema.boolean().default(true).description("转发推送中的图片"),
    mergeForward: import_koishi3.Schema.boolean().default(true).description("文本通知使用合并转发"),
    imageWidth: import_koishi3.Schema.number().min(480).max(1200).step(20).role("slider").default(DEFAULT_IMAGE_WIDTH).description("图片宽度（像素）"),
    notifyEvents: import_koishi3.Schema.array(import_koishi3.Schema.object({
      category: import_koishi3.Schema.union(categoryChoices).description("类别"),
      enabled: import_koishi3.Schema.boolean().default(true).description("是否接收")
    })).role("table").default(defaultCategories).description("**接收类别**<br>拖动排序，关闭即不接收"),
    notifyTargets: import_koishi3.Schema.array(import_koishi3.Schema.object({
      platform: import_koishi3.Schema.string().default("onebot").description("平台名"),
      channelType: import_koishi3.Schema.union([
        import_koishi3.Schema.const("guild").description("群聊"),
        import_koishi3.Schema.const("private").description("私聊")
      ]).default("guild").description("会话类型"),
      channelId: import_koishi3.Schema.string().default("").description("群号或用户 ID"),
      events: import_koishi3.Schema.array(import_koishi3.Schema.union(categoryChoices)).role("checkbox").default([]).description("类别"),
      keywords: import_koishi3.Schema.string().default("").description("关键词")
    })).role("table").default([]).description("**推送目标**<br>类别与关键词留空表示不过滤，关键词用逗号分隔")
  }).description("通知"),
  import_koishi3.Schema.object({
    admins: import_koishi3.Schema.array(import_koishi3.Schema.string()).role("table").default([]).description("管理员标识，格式 `平台:用户ID`；留空时控制指令不可用")
  }).description("权限"),
  import_koishi3.Schema.object({
    enableChineseAlias: import_koishi3.Schema.boolean().default(true).description("启用中文指令别名")
  }).description("指令"),
  import_koishi3.Schema.object({
    screenshotMode: import_koishi3.Schema.union([
      import_koishi3.Schema.const("auto").description("自动：窗口优先，失败时回退 ADB"),
      import_koishi3.Schema.const("window").description("窗口：只按窗口标题截图"),
      import_koishi3.Schema.const("adb").description("ADB：直接通过 adb 截图")
    ]).role("radio").default("auto").description("截图方式"),
    gameWindow: import_koishi3.Schema.string().default(DEFAULT_GAME_WINDOW).description("窗口标题关键字"),
    adbPath: import_koishi3.Schema.string().default("").description("adb 路径；留空自动识别"),
    adbSerial: import_koishi3.Schema.string().default("").description("设备序列号；留空自动识别")
  }).description("截图"),
  import_koishi3.Schema.object({
    debug: import_koishi3.Schema.boolean().default(false).description("输出调试日志")
  }).description("调试").collapse()
]);
function normalizeConfig(raw) {
  return {
    baseUrl: normalizeBaseUrl(raw.baseUrl),
    timeout: clampNumber(raw.timeout, 1e3, 3e4, 8e3),
    listenMode: raw.listenMode === "server" || raw.listenMode === "standalone" ? raw.listenMode : "auto",
    listenPath: normalizeListenPath(raw.listenPath),
    token: String(raw.token ?? "").trim(),
    host: String(raw.host ?? "").trim() || "127.0.0.1",
    port: clampNumber(raw.port, 1024, 65535, DEFAULT_STANDALONE_PORT),
    processControl: raw.processControl === true,
    masExePath: String(raw.masExePath ?? "").trim(),
    processTimeout: clampNumber(raw.processTimeout, 10, 300, DEFAULT_PROCESS_TIMEOUT),
    notifyEnabled: raw.notifyEnabled !== false,
    notifyTargets: normalizeTargets(raw.notifyTargets),
    notifyEvents: normalizeCategorySettings(raw.notifyEvents),
    notifyImage: raw.notifyImage !== false,
    mergeForward: raw.mergeForward !== false,
    imageWidth: clampNumber(raw.imageWidth, 480, 1200, DEFAULT_IMAGE_WIDTH),
    sendImages: raw.sendImages !== false,
    admins: normalizeAdmins(raw.admins),
    enableChineseAlias: raw.enableChineseAlias !== false,
    screenshotMode: raw.screenshotMode === "window" || raw.screenshotMode === "adb" ? raw.screenshotMode : "auto",
    gameWindow: String(raw.gameWindow ?? "").trim() || DEFAULT_GAME_WINDOW,
    adbPath: String(raw.adbPath ?? "").trim(),
    adbSerial: String(raw.adbSerial ?? "").trim(),
    debug: raw.debug === true
  };
}
__name(normalizeConfig, "normalizeConfig");
function normalizeTargets(input) {
  if (!Array.isArray(input)) return [];
  const targets = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const record = item;
    const platform = String(record.platform ?? "").trim();
    const channelId = String(record.channelId ?? "").trim();
    if (!platform || !channelId) continue;
    const channelType = record.channelType === "private" ? "private" : "guild";
    const key = `${platform}:${channelType}:${channelId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({
      platform,
      channelType,
      channelId,
      events: normalizeEventList(record.events),
      keywords: String(record.keywords ?? "").trim()
    });
  }
  return targets;
}
__name(normalizeTargets, "normalizeTargets");
function normalizeAdmins(input) {
  if (!Array.isArray(input)) return [];
  const admins = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of input) {
    const identity = parseIdentity(String(item ?? ""));
    if (!identity) continue;
    const key = `${identity.platform}:${identity.userId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    admins.push(key);
  }
  return admins;
}
__name(normalizeAdmins, "normalizeAdmins");
function normalizeCategorySettings(input) {
  const values = [];
  const seen = /* @__PURE__ */ new Set();
  const items = Array.isArray(input) ? input : [];
  for (const item of items) {
    const record = item && typeof item === "object" ? item : void 0;
    const key = resolveCategory(String(record?.category ?? item ?? ""));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    values.push({ category: key, enabled: record ? record.enabled !== false : true });
  }
  if (!values.length) return defaultCategories.map((item) => ({ ...item }));
  return values;
}
__name(normalizeCategorySettings, "normalizeCategorySettings");
function resolveCategory(input) {
  const text = input.trim();
  if (!text) return void 0;
  const lower = text.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(NOTIFICATION_CATEGORIES, lower)) return lower;
  for (const [code, label] of Object.entries(NOTIFICATION_CATEGORIES)) {
    if (text === label) return code;
  }
  return void 0;
}
__name(resolveCategory, "resolveCategory");
function normalizeEventList(input) {
  const parts = Array.isArray(input) ? input : String(input ?? "").split(/[,，、\s]+/);
  const values = [];
  for (const part of parts) {
    const key = resolveCategory(typeof part === "string" ? part : String(part));
    if (key && !values.includes(key)) values.push(key);
  }
  return values;
}
__name(normalizeEventList, "normalizeEventList");

// src/notify.ts
var import_koishi4 = require("koishi");

// src/image.ts
var import_canvas = require("@napi-rs/canvas");
var FONT_STACK = '"Microsoft YaHei", "Segoe UI Emoji", "Noto Color Emoji", "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif';
var PAGE_BACKGROUND = "#ffffff";
var TEXT_COLOR = "#1f2937";
var HEADING_COLOR = "#111827";
var MUTED_COLOR = "#6b7280";
var RULE_COLOR = "#e5e7eb";
var BLOCK_TAGS = /* @__PURE__ */ new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "li", "tr", "blockquote", "section", "article"]);
var HEADING_TAGS = /* @__PURE__ */ new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
async function renderNotificationImage(html, options = {}) {
  const blocks = parseHtml(html);
  if (!blocks.some((block) => block.kind !== "rule")) return void 0;
  const width = clamp(Math.round(options.width ?? 720), 480, 1200);
  const padding = Math.round(width * 0.055);
  const contentWidth = width - padding * 2;
  const measure = (0, import_canvas.createCanvas)(8, 8).getContext("2d");
  const layout = await layoutBlocks(blocks, contentWidth, measure);
  if (!layout.length) return void 0;
  const footerHeight = 48;
  const maxBodyHeight = 4096 - footerHeight - padding * 2;
  let contentHeight = 0;
  for (const item of layout) contentHeight += itemHeight(item) + item.marginBottom;
  const bodyHeight = Math.min(contentHeight, maxBodyHeight);
  const height = Math.round(bodyHeight + footerHeight + padding * 2);
  const canvas = (0, import_canvas.createCanvas)(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = PAGE_BACKGROUND;
  ctx.fillRect(0, 0, width, height);
  let y = padding;
  let truncated = false;
  for (const item of layout) {
    const itemHeightValue = itemHeight(item);
    if (y + itemHeightValue > padding + bodyHeight) {
      truncated = true;
      break;
    }
    drawItem(ctx, item, padding, y);
    y += itemHeightValue + item.marginBottom;
  }
  if (truncated) {
    ctx.fillStyle = MUTED_COLOR;
    ctx.font = `18px ${FONT_STACK}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("……内容过长，已截断", padding, padding + bodyHeight - 6);
  }
  const stamp = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { hour12: false });
  ctx.fillStyle = "#9ca3af";
  ctx.font = `16px ${FONT_STACK}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`AUTO-MAS · ${stamp}`, padding, height - padding + 6);
  return canvas.toBuffer("image/png");
}
__name(renderNotificationImage, "renderNotificationImage");
async function layoutBlocks(blocks, contentWidth, measure) {
  const layout = [];
  for (const block of blocks) {
    if (block.kind === "rule") {
      layout.push({ kind: "rule", marginBottom: 22 });
      continue;
    }
    if (block.kind === "image") {
      const image = await decodeDataImage(block.src);
      if (!image) continue;
      const ratio = image.height / image.width;
      let drawWidth = contentWidth;
      let drawHeight = Math.round(drawWidth * ratio);
      if (drawHeight > 640) {
        drawHeight = 640;
        drawWidth = Math.round(drawHeight / ratio);
      }
      layout.push({ kind: "image", image, width: drawWidth, height: drawHeight, marginBottom: 16 });
      continue;
    }
    const style = textStyle(block);
    const lines = wrapRuns(block.runs, contentWidth, style.size, style.indent, measure);
    if (!lines.length) continue;
    layout.push({
      kind: "text",
      lines,
      size: style.size,
      lineHeight: Math.round(style.size * style.lineHeightScale),
      extraTop: style.extraTop,
      marginBottom: style.marginBottom,
      color: style.color,
      indent: style.indent,
      bullet: block.block === "listItem"
    });
  }
  return layout;
}
__name(layoutBlocks, "layoutBlocks");
function itemHeight(item) {
  if (item.kind === "rule") return 1;
  if (item.kind === "image") return item.height;
  return item.extraTop + item.lines.length * item.lineHeight;
}
__name(itemHeight, "itemHeight");
function textStyle(block) {
  if (block.block === "heading") {
    const size = block.level <= 1 ? 32 : block.level === 2 ? 28 : 25;
    return { size, color: HEADING_COLOR, indent: 0, lineHeightScale: 1.45, marginBottom: 14, extraTop: 6 };
  }
  if (block.block === "listItem") {
    return { size: 23, color: TEXT_COLOR, indent: 18, lineHeightScale: 1.65, marginBottom: 4, extraTop: 0 };
  }
  return { size: 23, color: TEXT_COLOR, indent: 0, lineHeightScale: 1.65, marginBottom: 12, extraTop: 0 };
}
__name(textStyle, "textStyle");
function wrapRuns(runs, contentWidth, size, indent, measure) {
  const units = [];
  for (const run of runs) {
    for (const unit of splitUnits(run.text)) units.push({ text: unit, bold: run.bold, italic: run.italic, code: run.code });
  }
  const lines = [];
  let unitsInLine = [];
  let lineWidth = indent;
  let pendingSpace = false;
  const flush = /* @__PURE__ */ __name(() => {
    while (unitsInLine.length && unitsInLine[unitsInLine.length - 1].text.trim() === "") unitsInLine.pop();
    if (unitsInLine.length) {
      const width = unitsInLine.reduce((sum, unit) => sum + measureWidth(measure, unit.text, size, unit.bold, unit.italic), 0);
      lines.push({ units: unitsInLine, width });
    }
    unitsInLine = [];
    lineWidth = indent;
    pendingSpace = false;
  }, "flush");
  for (const unit of units) {
    if (/^\s+$/.test(unit.text)) {
      if (unitsInLine.length) pendingSpace = true;
      continue;
    }
    const space = pendingSpace ? " " : "";
    const text = space + unit.text;
    const width = measureWidth(measure, text, size, unit.bold, unit.italic);
    if (unitsInLine.length && lineWidth + width > contentWidth) {
      flush();
      const retry = unit.text;
      const retryWidth = measureWidth(measure, retry, size, unit.bold, unit.italic);
      unitsInLine.push({ ...unit, text: retry });
      lineWidth += retryWidth;
      pendingSpace = false;
      continue;
    }
    unitsInLine.push({ ...unit, text });
    lineWidth += width;
    pendingSpace = false;
  }
  flush();
  return lines;
}
__name(wrapRuns, "wrapRuns");
function splitUnits(text) {
  const units = [];
  const pattern = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]|\s+|[^\s\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]+/g;
  const matched = text.match(pattern) ?? [];
  for (const part of matched) {
    if (/^[^\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]{32,}$/.test(part)) {
      for (let i = 0; i < part.length; i += 32) units.push(part.slice(i, i + 32));
      continue;
    }
    units.push(part);
  }
  return units;
}
__name(splitUnits, "splitUnits");
function measureWidth(measure, text, size, bold, italic) {
  measure.font = fontOf(size, bold, italic);
  return measure.measureText(text).width;
}
__name(measureWidth, "measureWidth");
function fontOf(size, bold, italic) {
  return `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}px ${FONT_STACK}`;
}
__name(fontOf, "fontOf");
function drawItem(ctx, item, x, y) {
  if (item.kind === "rule") {
    ctx.strokeStyle = RULE_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 0.5);
    ctx.lineTo(x + ctx.canvas.width - x * 2, y + 0.5);
    ctx.stroke();
    return;
  }
  if (item.kind === "image") {
    ctx.drawImage(item.image, x, y, item.width, item.height);
    return;
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let lineY = y + item.extraTop;
  let first = true;
  for (const line of item.lines) {
    lineY += item.lineHeight;
    if (first && item.bullet) {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x + 6, lineY - item.size * 0.32, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    first = false;
    let cursor = x + item.indent;
    for (const unit of line.units) {
      ctx.font = fontOf(item.size, unit.bold, unit.italic);
      ctx.fillStyle = unit.code ? "#b91c1c" : item.color;
      ctx.fillText(unit.text, cursor, lineY);
      cursor += ctx.measureText(unit.text).width;
    }
  }
}
__name(drawItem, "drawItem");
async function decodeDataImage(src) {
  const match = /^data:image\/[\w+.-]+;base64,(.+)$/i.exec(src.trim());
  if (!match) return void 0;
  try {
    const buffer = Buffer.from(match[1].replace(/\s+/g, ""), "base64");
    if (!buffer.length) return void 0;
    return await (0, import_canvas.loadImage)(buffer);
  } catch {
    return void 0;
  }
}
__name(decodeDataImage, "decodeDataImage");
function parseHtml(html) {
  const source = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<br\s*\/?>/gi, "</p><p>");
  const blocks = [];
  let runs = [];
  let kind = "paragraph";
  let level = 0;
  let boldDepth = 0;
  let italicDepth = 0;
  const flush = /* @__PURE__ */ __name(() => {
    const cleaned = trimRuns(runs);
    runs = [];
    if (!cleaned.length) return;
    blocks.push({ kind: "text", block: kind, level, runs: cleaned });
  }, "flush");
  const tokenPattern = /<[^>]+>|[^<]+/g;
  let match;
  while (match = tokenPattern.exec(source)) {
    const token = match[0];
    if (!token.startsWith("<")) {
      const text = decodeEntities(token);
      if (text) runs.push({ text, bold: boldDepth > 0, italic: italicDepth > 0, code: false });
      continue;
    }
    const tagMatch = /^<\/?\s*([a-zA-Z0-9]+)/.exec(token);
    if (!tagMatch) continue;
    const name2 = tagMatch[1].toLowerCase();
    const closing = token.startsWith("</");
    if (name2 === "img") {
      const src = /src\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(token);
      const value = src?.[2] ?? src?.[3] ?? src?.[4];
      if (value) {
        flush();
        blocks.push({ kind: "image", src: value });
      }
      continue;
    }
    if (name2 === "hr") {
      flush();
      blocks.push({ kind: "rule" });
      continue;
    }
    if (name2 === "b" || name2 === "strong") {
      boldDepth = Math.max(0, boldDepth + (closing ? -1 : 1));
      continue;
    }
    if (name2 === "i" || name2 === "em") {
      italicDepth = Math.max(0, italicDepth + (closing ? -1 : 1));
      continue;
    }
    if (name2 === "code" || name2 === "kbd") continue;
    if (BLOCK_TAGS.has(name2)) {
      if (closing) {
        flush();
        kind = "paragraph";
        level = 0;
        continue;
      }
      flush();
      if (HEADING_TAGS.has(name2)) {
        kind = "heading";
        level = Number(name2[1]);
      } else if (name2 === "li") {
        kind = "listItem";
        level = 0;
      } else {
        kind = "paragraph";
        level = 0;
      }
    }
  }
  flush();
  return blocks;
}
__name(parseHtml, "parseHtml");
function trimRuns(runs) {
  const result = [];
  for (const run of runs) {
    const text = run.text.replace(/\s+/g, " ");
    if (!text) continue;
    const previous = result[result.length - 1];
    if (previous && previous.bold === run.bold && previous.italic === run.italic && previous.code === run.code) {
      previous.text += text;
      continue;
    }
    result.push({ ...run, text });
  }
  while (result.length && result[0].text.startsWith(" ")) result[0].text = result[0].text.replace(/^ +/, "");
  while (result.length && result[result.length - 1].text.endsWith(" ")) {
    result[result.length - 1].text = result[result.length - 1].text.replace(/ +$/, "");
  }
  return result.filter((run) => run.text.length > 0);
}
__name(trimRuns, "trimRuns");
function decodeEntities(text) {
  return text.replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16))).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&amp;/gi, "&");
}
__name(decodeEntities, "decodeEntities");
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
__name(clamp, "clamp");

// src/notify.ts
async function renderPayload(payload, options) {
  const type = typeof payload.msgtype === "string" ? payload.msgtype.toLowerCase() : "text";
  const message = typeof payload.message === "string" ? payload.message : "";
  if (!message.trim()) return void 0;
  if (type === "picture") {
    if (!options.sendImages) return void 0;
    const image = decodeBase64Image(message);
    if (!image) {
      debugLog(options.debug, "通知", "收到无法识别的图片推送");
      return void 0;
    }
    return { text: "AUTO-MAS 图片通知", image: image.buffer };
  }
  const text = type === "html" ? htmlToText(message) : message;
  if (!text.trim()) return void 0;
  if (type === "html" && options.notifyImage) {
    try {
      const html = text.split(new RegExp("\r?\n")).map((line) => line.trim()).filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
      const image = await renderNotificationImage(html, { width: options.imageWidth });
      if (image) return { text, image };
      debugLog(true, "notify", "文本渲染图片为空，回退文本");
    } catch (error) {
      debugLog(options.debug, "通知", `文本渲染图片失败，回退文本: ${getErrorMessage(error)}`);
    }
  }
  return { text };
}
__name(renderPayload, "renderPayload");
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(escapeHtml, "escapeHtml");
function decodeBase64Image(value) {
  const trimmed = value.trim();
  const dataUrl = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(trimmed);
  const base64 = (dataUrl ? dataUrl[2] : trimmed).replace(/\s+/g, "");
  if (!base64) return void 0;
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) return void 0;
  const mime = detectMime(buffer) ?? (dataUrl ? dataUrl[1] : "image/png");
  return { buffer, mime };
}
__name(decodeBase64Image, "decodeBase64Image");
function detectMime(buffer) {
  if (buffer.length >= 8 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return "image/jpeg";
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return void 0;
}
__name(detectMime, "detectMime");
function classifyNotification(text) {
  const categories = [];
  const add = /* @__PURE__ */ __name((key) => {
    if (!categories.includes(key)) categories.push(key);
  }, "add");
  if (/测试|test/i.test(text)) add("test");
  if (/六星|喜报/i.test(text)) add("sixStar");
  if (/签到/i.test(text)) add("sign");
  if (/材料|收获/i.test(text)) add("material");
  if (/活动|卡池|公告|理智/i.test(text)) add("activity");
  if (/异常|失败|错误|未送达|error/i.test(text)) add("error");
  if (/统计报告|统计|报告/i.test(text)) add("statistic");
  if (/自动代理|任务|完成|成功/i.test(text)) add("task");
  if (!categories.length) add("other");
  return categories;
}
__name(classifyNotification, "classifyNotification");
function splitMessage(text, limit = MAX_MESSAGE_LENGTH) {
  if (text.length <= limit) return [text];
  const chunks = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current && current.length + line.length + 1 > limit) {
      chunks.push(current);
      current = "";
    }
    if (line.length > limit) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let i = 0; i < line.length; i += limit) chunks.push(line.slice(i, i + limit));
      continue;
    }
    current = current ? `${current}
${line}` : line;
  }
  if (current) chunks.push(current);
  return chunks;
}
__name(splitMessage, "splitMessage");
var Notifier = class {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
  }
  static {
    __name(this, "Notifier");
  }
  warned = false;
  async handle(payload) {
    if (!this.config.notifyEnabled) {
      debugLog(this.config.debug, "notify", "通知开关关闭，已忽略推送");
      return;
    }
    const kind = typeof payload.msgtype === "string" ? payload.msgtype : "text";
    const size = typeof payload.message === "string" ? payload.message.length : 0;
    debugLog(this.config.debug, "notify", `收到推送：msgtype=${kind}，长度=${size}`);
    const rendered = await renderPayload(payload, {
      sendImages: this.config.sendImages,
      notifyImage: this.config.notifyImage,
      imageWidth: this.config.imageWidth,
      debug: this.config.debug
    });
    if (!rendered) return;
    const categories = classifyNotification(rendered.text);
    debugLog(this.config.debug, "notify", `类别：${categories.join(",")}`);
    if (!this.acceptGlobally(categories)) {
      debugLog(this.config.debug, "notify", `类别 ${categories.join(",")} 被全局配置过滤`);
      return;
    }
    const targets = this.config.notifyTargets.filter((target) => {
      const accepted = this.acceptTarget(target, categories, rendered.text);
      return accepted;
    });
    if (!targets.length) {
      if (!this.warned) {
        logger.warn("收到 AUTO-MAS 推送，但没有匹配的推送目标，请检查通知配置。");
        this.warned = true;
      }
      return;
    }
    await Promise.all(targets.map((target) => this.deliver(target, rendered)));
  }
  /** 发送一条测试消息到所有目标，忽略类别过滤 */
  async sendTest() {
    if (!this.config.notifyTargets.length) {
      return "还没有配置推送目标，请先在通知配置里添加平台、会话类型和会话 ID。";
    }
    const message = `AUTO-MAS 测试通知
时间：${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { hour12: false })}
收到这条消息说明 Koishi 到聊天平台的链路正常。`;
    const lines = [];
    for (const target of this.config.notifyTargets) {
      const bots = this.activeBots(target.platform);
      if (!bots.length) {
        lines.push(`- ${describeTarget(target)}：平台机器人未连接`);
        continue;
      }
      let sent = false;
      let lastError = "";
      for (const bot of bots) {
        try {
          await this.sendTo(bot, target, message);
          sent = true;
          break;
        } catch (error) {
          lastError = getErrorMessage(error);
        }
      }
      lines.push(`- ${describeTarget(target)}：${sent ? "已发送" : `失败（${describeError(lastError)}）`}`);
    }
    return ["测试通知已处理：", ...lines].join("\n");
  }
  acceptGlobally(categories) {
    const enabled = this.config.notifyEvents.filter((item) => item.enabled).map((item) => item.category);
    if (!enabled.length) return false;
    return categories.some((category) => enabled.includes(category));
  }
  acceptTarget(target, categories, text) {
    const events = target.events ?? [];
    if (events.length && !categories.some((category) => events.includes(category))) {
      debugLog(this.config.debug, "notify", `${describeTarget(target)} 未订阅类别 ${categories.join(",")}`);
      return false;
    }
    const keywords = (target.keywords ?? "").split(/[,，]/).map((keyword) => keyword.trim()).filter(Boolean);
    if (!keywords.length) return true;
    const haystack = text.toLowerCase();
    const hit = keywords.find((keyword) => haystack.includes(keyword.toLowerCase()));
    if (!hit) {
      debugLog(this.config.debug, "notify", `${describeTarget(target)} 未命中关键词 ${keywords.join(",")}`);
      return false;
    }
    return true;
  }
  async deliver(target, rendered) {
    const bots = this.activeBots(target.platform);
    if (!bots.length) {
      logger.warn(`平台 ${target.platform} 的机器人未连接，通知未发送；请等平台重连后再试。`);
      return;
    }
    const chunks = rendered.image ? [] : splitMessage(rendered.text);
    const mode = rendered.image ? "图片" : this.config.mergeForward ? `合并转发 ${chunks.length} 段` : `${chunks.length} 条文本`;
    let lastError = "";
    for (const bot of bots) {
      try {
        if (rendered.image) {
          await this.sendTo(bot, target, import_koishi4.h.image(rendered.image, "image/png"));
        } else if (this.config.mergeForward) {
          await this.sendTo(bot, target, buildForwardMessage(bot, chunks));
        } else {
          for (const chunk of chunks) {
            await this.sendTo(bot, target, chunk);
          }
        }
        logger.info(`[通知] 已发送到 ${describeTarget(target)}（${mode}）。`);
        return;
      } catch (error) {
        lastError = getErrorMessage(error);
        debugLog(this.config.debug, "notify", `发送到 ${describeTarget(target)} 失败：${lastError}`);
      }
    }
    logger.warn(`发送通知到 ${describeTarget(target)} 失败: ${describeError(lastError)}`);
  }
  async sendTo(bot, target, content) {
    if (target.channelType === "private") {
      await bot.sendPrivateMessage(target.channelId, content);
      return;
    }
    await bot.sendMessage(target.channelId, content);
  }
  activeBots(platform) {
    return this.ctx.bots.filter((bot) => bot.platform === platform && bot.isActive);
  }
};
function describeError(message) {
  if (/connection has closed|websocket.*closed|ECONNRESET/i.test(message)) {
    return "平台机器人连接已断开，请检查 OneBot/NapCat 与 QQ 是否在线";
  }
  return message || "未知错误";
}
__name(describeError, "describeError");
function describeTarget(target) {
  const type = target.channelType === "private" ? "私聊" : "群聊";
  return `${target.platform}/${type} ${target.channelId}`;
}
__name(describeTarget, "describeTarget");
function buildForwardMessage(bot, chunks) {
  return (0, import_koishi4.h)(
    "message",
    { forward: true },
    ...chunks.map((text) => (0, import_koishi4.h)("message", { userId: bot.selfId, nickname: "AUTO-MAS" }, text))
  );
}
__name(buildForwardMessage, "buildForwardMessage");

// src/push.ts
var import_node_http = require("node:http");
var import_ws = require("ws");
var AUTH_TIMEOUT = 1e4;
var PushServer = class {
  constructor(ctx, config, onNotify) {
    this.ctx = ctx;
    this.config = config;
    this.onNotify = onNotify;
  }
  static {
    __name(this, "PushServer");
  }
  layer;
  wss;
  http;
  sockets = /* @__PURE__ */ new Set();
  stopped = false;
  start() {
    if (this.config.listenMode === "standalone") {
      this.listenStandalone();
      return;
    }
    const server = this.ctx.server;
    if (server?.ws) {
      this.layer = server.ws(this.config.listenPath, (socket, request) => this.accept(socket, request));
      logger.info(`[推送] 已挂载到 Koishi HTTP 服务，路径 ${this.config.listenPath}。`);
      if (!this.config.token) {
        logger.warn("推送令牌为空，任何能访问该端口的程序都可以伪造 AUTO-MAS 通知。");
      }
      return;
    }
    if (this.config.listenMode === "server") {
      logger.error("推送服务方式为 server，但没有可用的 Koishi HTTP 服务，推送未启动。");
      return;
    }
    logger.warn("[推送] 没有可用的 Koishi HTTP 服务，改为独立监听。");
    this.listenStandalone();
  }
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    for (const socket of this.sockets) socket.close(1001, "plugin-dispose");
    this.sockets.clear();
    this.layer?.close();
    this.layer = void 0;
    this.wss?.close();
    this.wss = void 0;
    this.http?.close();
    this.http = void 0;
  }
  listenStandalone() {
    const http = (0, import_node_http.createServer)((request, response) => {
      response.writeHead(426, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("该端口只接受 WebSocket 连接");
    });
    http.on("error", (error) => {
      logger.error(`推送服务监听 ${this.config.host}:${this.config.port} 失败: ${getErrorMessage(error)}`);
      logger.error("请修改独立监听端口，或把推送服务方式改为 server。");
    });
    http.listen(this.config.port, this.config.host, () => {
      logger.info(`[推送] 独立监听 ws://${this.config.host}:${this.config.port}${this.config.listenPath}。`);
    });
    const wss = new import_ws.WebSocketServer({ server: http, path: this.config.listenPath });
    wss.on("connection", (socket, request) => this.accept(socket, request));
    wss.on("error", (error) => logger.warn(`推送服务错误: ${getErrorMessage(error)}`));
    this.http = http;
    this.wss = wss;
    if (!this.config.token) {
      logger.warn("推送令牌为空，独立监听下任何能访问该端口的程序都可以伪造 AUTO-MAS 通知。");
    }
  }
  accept(socket, request) {
    if (this.stopped) {
      socket.close(1001, "plugin-dispose");
      return;
    }
    const remote = request?.socket.remoteAddress ?? "未知地址";
    debugLog(this.config.debug, "push", `新连接：${remote}`);
    let authed = this.config.token === "";
    let timer;
    if (!authed) {
      timer = setTimeout(() => {
        logger.warn(`[推送] ${remote} 在超时前没有完成认证，已断开连接。`);
        socket.close(4001, "auth-timeout");
      }, AUTH_TIMEOUT);
      timer.unref?.();
    } else {
      this.sockets.add(socket);
      logger.info(`[推送] AUTO-MAS 通知通道已连接（${remote}，未启用令牌）。`);
    }
    socket.on("message", (raw) => {
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        logger.warn("[推送] 收到无法解析的消息，已忽略（可能是非 AUTO-MAS 客户端）。");
        return;
      }
      if (message.type === "auth") {
        const token = typeof message.data?.token === "string" ? String(message.data.token) : "";
        if (!authed && token !== this.config.token) {
          logger.warn(`[推送] ${remote} 的令牌不匹配，已断开连接；请检查插件 token 与 AUTO-MAS 的 KoishiToken 是否一致。`);
          socket.close(4001, "invalid-token");
          return;
        }
        const firstAuth = !authed;
        authed = true;
        if (timer) clearTimeout(timer);
        timer = void 0;
        if (firstAuth) {
          this.sockets.add(socket);
          logger.info(`[推送] AUTO-MAS 通知通道已连接（${remote}，已认证）。`);
        }
        return;
      }
      if (message.type !== "notify") {
        debugLog(this.config.debug, "push", `忽略未知消息类型：${String(message.type)}`);
        return;
      }
      if (!authed) {
        socket.close(4001, "auth-required");
        return;
      }
      const payload = message.data;
      if (!payload || typeof payload !== "object") {
        logger.warn("[推送] 收到格式无效的通知，已忽略。");
        return;
      }
      const record = payload;
      const kind = typeof record.msgtype === "string" ? record.msgtype : "text";
      const size = typeof record.message === "string" ? record.message.length : 0;
      debugLog(this.config.debug, "push", `收到通知：msgtype=${kind}，长度=${size}`);
      this.onNotify(payload);
    });
    socket.on("close", (code, reason) => {
      if (timer) clearTimeout(timer);
      timer = void 0;
      const wasAuthed = this.sockets.delete(socket);
      if (wasAuthed) {
        logger.info(`[推送] AUTO-MAS 通知通道已断开（code=${code}${reason?.length ? `，${reason.toString()}` : ""}）。`);
      } else {
        debugLog(this.config.debug, "push", `未认证连接已关闭（code=${code}）。`);
      }
    });
    socket.on("error", (error) => {
      debugLog(this.config.debug, "push", `连接错误：${getErrorMessage(error)}`);
    });
  }
};

// src/index.ts
var name = PLUGIN_NAME;
var inject = ["server"];
var usage = USAGE_MARKDOWN;
function apply(ctx, rawConfig) {
  const config = normalizeConfig(rawConfig);
  raiseDebugLevel(config.debug);
  if (config.debug) logger.info("[调试] 已开启，本插件日志级别提到 debug。");
  const client = new AutoMasClient(config);
  const notifier = new Notifier(ctx, config);
  const push = new PushServer(ctx, config, (payload) => {
    void notifier.handle(payload);
  });
  ctx.on("ready", () => {
    const mode = config.listenMode === "standalone" ? `独立监听 ${config.host}:${config.port}` : `挂载 ${config.listenPath}`;
    logger.info(`[启动] AUTO-MAS ${config.baseUrl}，推送${mode}，通知目标 ${config.notifyTargets.length} 个。`);
    try {
      push.start();
    } catch (error) {
      logger.error(`推送服务启动失败: ${getErrorMessage(error)}`);
    }
    void checkPushSetting(client, config);
  });
  ctx.on("dispose", () => {
    push.stop();
  });
  registerCommands({ ctx, config, client, notify: notifier });
}
__name(apply, "apply");
async function checkPushSetting(client, config) {
  try {
    const push = readPushSetting(await client.getSetting());
    const expected = expectedPushAddress(config);
    if (!push.enabled) {
      logger.warn("AUTO-MAS 的 Koishi 推送未启用，插件收不到任务通知；在 AUTO-MAS 设置中启用，或执行 mas推送 -e。");
      return;
    }
    debugLog(config.debug, "push", `AUTO-MAS 推送设置：enabled=${push.enabled}，address=${push.address ?? "(空)"}`);
    if (push.address && push.address !== expected) {
      logger.warn(`AUTO-MAS 推送地址为 ${push.address}，与插件期望的 ${expected} 不一致；可执行 mas推送 -e 修正。`);
    }
  } catch (error) {
    debugLog(config.debug, "push", `检查 AUTO-MAS 推送设置失败: ${getErrorMessage(error)}`);
  }
}
__name(checkPushSetting, "checkPushSetting");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  inject,
  name,
  normalizeCategorySettings,
  normalizeConfig,
  normalizeEventList,
  resolveCategory,
  usage
});
