# koishi-plugin-auto-mas-connector

通过 Koishi 查询和控制 [AUTO-MAS](https://doc.auto-mas.top/)，接收其推送通知。

## 功能

- 查询状态、任务、队列、脚本、用户、历史
- 启动脚本或队列、停止任务、电源操作
- 接收推送并按类别转发到群聊或私聊
- HTML 推送转图片，文本推送合并转发
- 窗口截图，失败时可回退 ADB
- 关闭、启动或重启 AUTO-MAS（同机关闭窗口与后端，跨机只能关闭后端）

## 配置

| 配置项 | 说明 |
| :--- | :--- |
| `baseUrl` | AUTO-MAS 后端地址，默认 `http://127.0.0.1:36163` |
| `admins` | 管理员标识，格式 `平台:用户ID`，用 `mas.whoami` 获取 |
| `listenMode` | 推送服务方式：自动、复用 Koishi 服务、独立监听 |
| `listenPath` | 推送路径，需与 AUTO-MAS 的推送地址一致，默认 `/AUTO_MAS` |
| `token` | 与 AUTO-MAS 的 `KoishiToken` 一致；留空不校验 |
| `notifyTargets` | 推送目标：平台、会话类型、会话 ID、接收类别 |
| `notifyEvents` | 全局接收类别，关闭后不接收该类通知 |
| `mergeForward` | 文本通知使用合并转发，图片直接发送 |
| `screenshotMode` | 截图方式：自动、窗口、ADB |
| `adbPath` / `adbSerial` | adb 路径与序列号，留空自动识别 |
| `processControl` | 允许通过指令控制 AUTO-MAS 进程，默认关闭 |
| `masExePath` | AUTO-MAS 启动文件路径，留空自动识别 |
| `processTimeout` | 等待进程启动或关闭的秒数，默认 60 |

## 接入 AUTO-MAS

1. 在 AUTO-MAS 的通知设置中启用 Koishi，填写地址与令牌：

```yaml
IfKoishiSupport: true
KoishiServerAddress: ws://<Koishi 地址>:<端口>/AUTO_MAS
KoishiToken: <与插件 token 一致>
```

2. 保存后重启 AUTO-MAS。推送通道只在启动时初始化，运行中修改不会生效。
3. 用 `mas推送` 查看当前设置，`mas推送 -t` 发送测试通知；也可以让 `mas推送 -e` 自动写入。

| 部署方式 | listenMode | KoishiServerAddress |
| :--- | :--- | :--- |
| 同机 | 自动 | `ws://127.0.0.1:5140/AUTO_MAS` |
| 跨机 / 容器 | 独立监听 | `ws://<Koishi 地址>:5150/AUTO_MAS` |

webhook 与 Koishi 是两种通道：指向 `/AUTO_MAS` 的 HTTP POST 属于 webhook，不会被本插件接收。

## 常见问题

- `测试通知发送失败: 部分通知发送失败: 全局 Koishi`：Koishi 推送通道未启动。重启 AUTO-MAS；仍失败时检查地址、端口与 `token`。
- 收不到通知：检查 `notifyTargets` 是否包含目标、`notifyEvents` 是否关闭了对应类别。
- 通知集中到达：AUTO-MAS 在整批任务结束后统一投递。

## 指令

| 指令 | 别名 | 说明 |
| :--- | :--- | :--- |
| `mas.status` | `mas状态` | 后端状态、运行任务与推送状态 |
| `mas.task [任务ID]` | `mas任务` | 任务列表；带 ID 查结果 |
| `mas.queue` | `mas队列` | 调度队列；`-v` 显示完整 ID |
| `mas.scripts` | `mas脚本` | 脚本配置；`-v` 显示完整 ID |
| `mas.users [脚本]` | `mas用户` | 脚本用户；`-v` 显示完整 ID |
| `mas.history [天数]` | `mas历史` | 执行历史，默认 1 天 |
| `mas.start [名称]` | `mas启动` | 启动脚本或队列；`-c` 循环执行队列 |
| `mas.startqueue [队列] [用户...]` | `mas开队` | 指定用户启动队列 |
| `mas.stop [任务ID]` | `mas停止` | 停止任务 |
| `mas.power [操作] -y` | `mas电源` | 任务结束后关机、重启、休眠等 |
| `mas.process [操作] -y` | `mas进程` | 查看、关闭、启动或重启 AUTO-MAS；同机关闭整个程序 |
| `mas.screenshot [窗口]` | `mas截图` | 按配置截图；`-a` 用 ADB |
| `mas.push [地址]` | `mas推送` | 查看或修改推送设置；`-e` 启用、`-d` 关闭、`-t` 测试 |
| `mas.test` | `mas测试` | 给聊天目标发测试通知 |
| `mas.whoami` | `mas我是谁` | 查看自己的平台标识 |

查询类指令所有人可用，控制类指令仅管理员。
