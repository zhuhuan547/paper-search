---
name: start
description: 一键启动系统 —— 启动后端(EXTERNAL_CONSUMER=1)、前端、cloudflared 隧道，并设置当前会话的队列消费者轮询
---

# 启动系统（一键）

按以下步骤启动所有组件。**先释放被占用的端口，再启动。**

## 0. 释放端口（3001 / 5173）

先检查是否有进程占用这两个端口：

```bash
netstat -ano | grep -E ":3001|:5173" | grep LISTENING
```

若有输出（说明端口被上一会话的孤儿进程占用），用 taskkill 精准结束对应的 node 进程（避免用 `/IM node.exe` 一刀切误伤 Claude 自身的 node 进程）：

```bash
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*src/index.js*' -or $_.CommandLine -like '*vite*' } | ForEach-Object { taskkill /F /T /PID $_.ProcessId }"
```

确认端口已释放：

```bash
netstat -ano | grep -E ":3001|:5173" | grep LISTENING || echo "端口已释放"
```

若本来就没有进程占用，跳过本步。

## 1. 启动后端（EXTERNAL_CONSUMER=1）

后台运行：

```bash
EXTERNAL_CONSUMER=1 npm --prefix backend start
```

用 `run_in_background: true`。启动后确认 `curl -s http://127.0.0.1:3001/api/health` 返回 `"status":"ok"` 且 `consumer.isRunning` 为 `false`（外部消费者模式）。

## 2. 启动前端

后台运行：

```bash
npm --prefix frontend run dev
```

用 `run_in_background: true`。确认 `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` 返回 200。

## 3. 启动 cloudflared 隧道（公网域名）

后台运行隧道，把 `papersearch.shop` 指向本机前端：

```bash
cloudflared tunnel run papersearch
```

用 `run_in_background: true`。启动后确认 `curl -s -o /dev/null -w "%{http_code}" https://papersearch.shop/` 返回 200（前端需已就绪，且 `frontend/vite.config.js` 的 `allowedHosts` 含 `.papersearch.shop`）。

若 `tasklist | grep -i cloudflared` 已有进程，说明隧道已在跑，跳过本步。

## 4. 设置队列消费者轮询

用 CronCreate 创建每分钟触发的定时任务（session-only）：

- cron：`* * * * *`
- prompt：`【队列消费者触发】读取 .claude/queue-consume.md 并按其流程消费 tasks/ 队列：先检查 running 任务是否 stop_requested（暂停请求），是则 kill 后台 Workflow 并标 stopped；否则扫描 pending 任务，若有选最早一个，读 tasks/{id}/config.yaml，用 UTF-8 无 BOM 更新 meta.json 为 running，按 .claude/skills/paper-search/SKILL.md 执行协调者循环（fetch_candidates.js 直接拉取 + paper-search-verify 并行检验 + state.json 断点恢复 + 每阶段检查暂停），写 results.md/csv/bib 到 tasks/{id}/output/，最后用 UTF-8 无 BOM 更新 meta.json 为 completed 或 failed。若队列空闲则一句话报告即可。`

若已存在该定时任务，跳过创建。

## 5. 报告

输出各组件状态（后端 API、前端地址、域名 https://papersearch.shop、消费者轮询是否就绪），并提醒：消费者轮询是 session-only，会话结束即停止。

## 关键约束

- 后端必须带 `EXTERNAL_CONSUMER=1`，否则会自动 spawn headless claude 与当前会话抢队列。
- `meta.json` 用 UTF-8 无 BOM 写入。
- 多智能体并行（Workflow 派发 worker/verifier），浏览器仅协调者串行兜底。
