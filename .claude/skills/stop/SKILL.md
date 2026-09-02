---
name: stop
description: 一键停止系统 —— 杀掉后端(node src/index.js)、前端(node vite)、cloudflared 隧道进程，并停掉队列消费者轮询
---

# 停止系统（一键）

按以下步骤停止所有组件。

## 1. 杀掉后端和前端进程

用 taskkill 强制结束后端与前端（含子树）：

```bash
taskkill //F //T //FI "IMAGENAME eq node.exe" 2>NUL
```

但为避免误杀其他 node 进程（如 Claude 自身依赖），更精准的做法是逐个定位再杀：

```bash
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.CommandLine -like '*src/index.js*' -or \$_.CommandLine -like '*vite*' } | ForEach-Object { taskkill /F /T /PID \$_.ProcessId }"
```

> ⚠️ 在 Git Bash 里运行必须把 `$_` 写成 `\$_`，否则 bash 会把它当自己的变量展开（`$_.CommandLine` → 空值），PowerShell 直接报 `ParserError`。

## 2. 杀掉 cloudflared 隧道进程

```bash
taskkill //F //IM cloudflared.exe 2>/dev/null || echo "无 cloudflared 进程"
```

## 3. 停掉队列消费者轮询

用 CronList 找到消费者定时任务，用 CronDelete 删除它。

## 4. 验证

确认 3001/5173 端口已释放：

```bash
netstat -ano | grep -E ":3001|:5173" | grep LISTENING || echo "端口已释放"
```

## 注意

- `taskkill` 只杀后端(node src/index.js)和前端(node vite)，不要用 `/IM node.exe` 一刀切（会误伤 Claude Code 本身的 node 进程）。
- 队列消费者是 session-only 的 CronCreate，会话退出本就会消失，但主动删除更干净。
