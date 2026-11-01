export const PLUGIN_NAME = 'auto-mas-connector'
export const LOGGER_NAME = 'auto-mas'
export const DEFAULT_BASE_URL = 'http://127.0.0.1:36163'
export const DEFAULT_LISTEN_PATH = '/AUTO_MAS'
export const DEFAULT_STANDALONE_PORT = 5150
export const DEFAULT_GAME_WINDOW = '明日方舟'
export const DEFAULT_IMAGE_WIDTH = 720
export const MAX_MESSAGE_LENGTH = 2000

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
通过聊天平台查询和控制 AUTO-MAS，并接收它推送的通知。

| 指令 | 别名 | 说明 |
| :--- | :--- | :--- |
| \`mas\` | — | 查看帮助 |
| \`mas.status\` | \`mas状态\` | 后端状态与运行中的任务 |
| \`mas.task [任务ID]\` | \`mas任务\` | 运行中任务；带 ID 查询结果 |
| \`mas.queue\` | \`mas队列\` | 调度队列列表 |
| \`mas.scripts\` | \`mas脚本\` | 脚本配置列表 |
| \`mas.users [脚本]\` | \`mas用户\` | 脚本用户与用户 ID |
| \`mas.history [天数]\` | \`mas历史\` | 执行历史，默认 1 天 |
| \`mas.start [ID或名称]\` | \`mas启动\` | 启动脚本或队列；\`-c\` 循环执行队列 |
| \`mas.startqueue [队列] [用户...]\` | \`mas开队\` | 按用户名或 ID 启动队列 |
| \`mas.stop [任务ID]\` | \`mas停止\` | 停止任务；不带参数列出运行中任务 |
| \`mas.power [操作] -y\` | \`mas电源\` | 关机、重启、休眠等；必须加 \`-y\` |
| \`mas.screenshot [窗口] -a\` | \`mas截图\` | 按配置的截图方式；\`-a\` 强制 ADB |
| \`mas.test\` | \`mas测试\` | 发送测试通知 |
| \`mas.whoami\` | \`mas我是谁\` | 查看自己的平台标识 |

查询类指令所有人可用，控制与电源操作仅管理员可用。

AUTO-MAS 的通知默认在整批任务结束后统一投递。
`
