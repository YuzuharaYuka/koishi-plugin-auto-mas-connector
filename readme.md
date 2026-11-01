# koishi-plugin-auto-mas-connector

通过 koishi 连接、查询和控制 [AUTO-MAS](https://doc.auto-mas.top/)，并接收其推送通知。

## 功能

- 查询状态、任务、队列、脚本、用户、历史
- 启动脚本或队列、停止任务、电源操作
- 接收推送，按类别转发到群聊或私聊
- HTML 推送转图片，文本推送合并转发
- 窗口截图，找不到窗口时回退 ADB

## 配置

| 配置项 | 说明 |
| :--- | :--- |
| `baseUrl` | AUTO-MAS 后端地址，默认 `http://127.0.0.1:36163` |
| `admins` | 管理员标识，格式 `平台:用户ID`，可通过 `mas.whoami` 获取 |
| `listenMode` | 推送服务方式：自动、复用 Koishi 服务、独立监听 |
| `notifyTargets` | 推送目标：平台、会话类型、会话 ID、接收类别，类别留空为全部 |
| `notifyEvents` | 全局接收类别，关闭后不再接收该类通知 |
| `mergeForward` | 文本通知使用合并转发，图片通知直接发送 |
| `screenshotMode` | 截图方式：自动（窗口优先，失败回退 ADB）、窗口、ADB |
| `adbPath` / `adbSerial` | adb 路径与设备序列号，`adb` 方式或自动回退时使用 |

## 接入 AUTO-MAS

在 AUTO-MAS 通知设置中启用 Koishi 推送：

```yaml
IfKoishiSupport: true
KoishiServerAddress: ws://<Koishi 地址>:<端口>/AUTO_MAS
KoishiToken: <推送令牌>
```

| 部署方式 | listenMode | KoishiServerAddress |
| :--- | :--- | :--- |
| 同机 | 自动 | `ws://127.0.0.1:5140/AUTO_MAS` |
| 跨机 / 容器 | 独立监听 | `ws://<Koishi 地址>:5150/AUTO_MAS` |

`KoishiToken` 留空表示不校验，公网部署应设置。

## 指令

| 指令 | 别名 | 说明 |
| :--- | :--- | :--- |
| `mas` | — | 查看帮助 |
| `mas.status` | `mas状态` | 后端状态与运行中任务 |
| `mas.task [任务ID]` | `mas任务` | 运行中任务；带 ID 查询结果 |
| `mas.queue` | `mas队列` | 调度队列 |
| `mas.scripts` | `mas脚本` | 脚本配置 |
| `mas.users [脚本]` | `mas用户` | 脚本用户与用户 ID |
| `mas.history [天数]` | `mas历史` | 执行历史，默认 1 天 |
| `mas.start [ID或名称]` | `mas启动` | 启动脚本或队列；`-c` 循环执行队列 |
| `mas.startqueue [队列] [用户...]` | `mas开队` | 按用户名或 ID 启动队列 |
| `mas.stop [任务ID]` | `mas停止` | 停止任务；不带参数列出运行中任务 |
| `mas.power [操作] -y` | `mas电源` | 关机、重启、休眠等，必须加 `-y` |
| `mas.screenshot [窗口]` | `mas截图` | 按配置的截图方式；`-a` 强制 ADB |
| `mas.test` | `mas测试` | 发送测试通知 |
| `mas.whoami` | `mas我是谁` | 查看自己的平台标识 |

查询类指令所有人可用，控制类指令仅管理员可用。AUTO-MAS 通知在整批任务结束后统一投递，收到的是汇总结果。
