export const PLUGIN_NAME = 'auto-mas-connector'
export const LOGGER_NAME = 'auto-mas'
export const DEFAULT_BASE_URL = 'http://127.0.0.1:36163'
export const DEFAULT_LISTEN_PATH = '/AUTO_MAS'
export const DEFAULT_STANDALONE_PORT = 5150
export const DEFAULT_GAME_WINDOW = '明日方舟'
export const DEFAULT_IMAGE_WIDTH = 720
export const MAX_MESSAGE_LENGTH = 2000
/** Koishi 默认的 HTTP 端口，用于推断 AUTO-MAS 应填写的推送地址 */
export const DEFAULT_KOISHI_PORT = 5140

/** 通知类别：AUTO-MAS 的推送没有结构化分类，只能按正文关键词归类 */
export const NOTIFICATION_CATEGORIES: Record<string, string> = {
  statistic: '统计报告',
  task: '任务完成',
  error: '异常',
  sixStar: '六星',
  activity: '活动提醒',
  sign: '社区签到',
  material: '材料收获',
  test: '测试通知',
  other: '其他',
}

export const POWER_SIGNALS = [
  'NoAction',
  'Shutdown',
  'ShutdownForce',
  'Reboot',
  'Hibernate',
  'Sleep',
  'KillSelf',
  'RestartSelf',
  'Logoff',
] as const

export const POWER_ALIASES: Record<string, string> = {
  noaction: 'NoAction',
  不操作: 'NoAction',
  shutdown: 'Shutdown',
  关机: 'Shutdown',
  shutdownforce: 'ShutdownForce',
  强制关机: 'ShutdownForce',
  reboot: 'Reboot',
  重启: 'Reboot',
  hibernate: 'Hibernate',
  休眠: 'Hibernate',
  sleep: 'Sleep',
  睡眠: 'Sleep',
  killself: 'KillSelf',
  退出: 'KillSelf',
  restartself: 'RestartSelf',
  重启自身: 'RestartSelf',
  logoff: 'Logoff',
  注销: 'Logoff',
}

export const HELP_TEXT = `
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
· mas电源 [操作] -y — 关机、重启、休眠等
· mas截图 [窗口] [-a] — 按配置截图；-a 用 ADB

其他
· mas测试 — 给聊天目标发测试通知
· mas推送 [-e|-d|-t] — 查看或修改 AUTO-MAS 推送设置
· mas我是谁 — 查看自己的平台标识

名称支持模糊匹配，ID 支持前缀；查询类所有人可用。
首次使用：在 AUTO-MAS 通知设置中启用 Koishi 并重启，或用 mas推送 -e 写入后重启。
`

export const USAGE_MARKDOWN = `
通过 Koishi 连接、查询和控制 AUTO-MAS，并接收它推送的通知。

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
| \`mas.power [操作] -y\` | \`mas电源\` | 关机、重启、休眠等 |
| \`mas.screenshot [窗口]\` | \`mas截图\` | 按配置截图；\`-a\` 用 ADB |
| \`mas.push [地址]\` | \`mas推送\` | 查看或修改推送设置；\`-e\` 启用、\`-d\` 关闭、\`-t\` 测试 |
| \`mas.test\` | \`mas测试\` | 给聊天目标发测试通知 |
| \`mas.whoami\` | \`mas我是谁\` | 查看自己的平台标识 |

查询类指令所有人可用，控制类指令仅管理员。名称支持模糊匹配，ID 支持前缀。

**接入 AUTO-MAS**：在 AUTO-MAS 的通知设置中启用 Koishi，地址填 \`ws://<Koishi 地址>:<端口>/AUTO_MAS\`，保存后重启一次 AUTO-MAS；也可以用 \`mas推送 -e\` 写入。webhook 通道与 Koishi 通道不同，webhook 指向 \`/AUTO_MAS\` 不会被本插件接收。
`
