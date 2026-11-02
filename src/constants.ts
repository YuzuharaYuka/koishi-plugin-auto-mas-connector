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
AUTO-MAS 的任务通知默认在整批任务结束后统一投递。
`
