# search_paper — 学术论文多源搜索工具

7 步流水线：配置读取 → 浏览器就绪 → 多源搜索 → 初筛 → 代码验证 → LLM 深度分析 → 结构化输出。

## 架构

- **后端** (`backend/`)：Express API（端口 `3001`），管理任务队列 `tasks/`
- **前端** (`frontend/`)：Vite + React（端口 `5173`），`/api` 代理到 `3001`
- **队列消费者**：当前 Claude Code 会话（不是后端 spawn 的 headless 进程）

## 启动方式（一键）

在 Claude Code 会话中运行 **`/start`**，一条命令启动所有组件：

1. 后端（`EXTERNAL_CONSUMER=1`，端口 3001）
2. 前端（Vite，端口 5173）
3. 队列消费者（当前会话的 CronCreate 每分钟轮询）

也可以脱离 Claude 手动起前后端：`bash start.sh`（消费者仍需在会话里 `/start`）。

手动分步启动等价于：

```bash
EXTERNAL_CONSUMER=1 npm --prefix backend start   # 后端
npm --prefix frontend run dev                    # 前端
```

访问 **http://localhost:5173** 创建搜索任务。

停止系统用 **`/stop`**（杀掉前后端进程 + 停消费者轮询）。

> ⚠️ 注意：`/start` 启动的前后端 node 进程**不会随 Claude 会话退出而自动结束**（会残留为孤儿进程占用 3001/5173）。退出会话前先跑 `/stop`，否则下次 `/start` 会端口冲突。

## 队列消费者机制（关键）

后端以 `EXTERNAL_CONSUMER=1` 运行时**不自动执行任务**（`queueConsumer.start()` 直接 return），改由**当前 Claude Code 会话**充当消费者：

1. **消费流程**定义在 `.claude/queue-consume.md`：扫 pending → 标记 running → 浏览器优先执行 paper-search → 写 `output/` → 标记 completed/failed。
2. **轮询**靠 CronCreate 定时任务（每分钟，session-only，7 天过期）。会话结束消费者即停止。
3. 每次触发扫描 `tasks/*/meta.json` 的 `pending` 任务，取最早一个消费。

## 关键约束 / 坑

- **Playwright MCP 是 `--extension` 模式**（`~/.claude.json` 里 `mcpServers.playwright-extension`，带 `PLAYWRIGHT_MCP_EXTENSION_TOKEN`）：控制的是**当前会话**浏览器的 Chrome 扩展，且一次只能连一个 MCP 客户端。后端 `claude -p` 子进程连不上扩展，只能 fallback 到 API——这正是"浏览器没被控制"的原因。
- **`meta.json` 必须 UTF-8 无 BOM 写入**：后端 `taskService` 用 `JSON.parse(fs.readFileSync(...,'utf-8'))` 读，带 BOM 会抛错 → 误报 `Task not found`。写时用 `json.dump(..., ensure_ascii=False)`（不要用 `utf-8-sig`）。
- **搜索方式**：浏览器优先（Playwright MCP），失败回退 arXiv API / Semantic Scholar API / GitHub 网页。
- 后端 `queueConsumer` 原设计会 `spawn('claude', ['-p','--dangerously-skip-permissions'])` 执行 `/paper-search`；该 headless 方式 stdout 零输出、连不上浏览器扩展，已被 `EXTERNAL_CONSUMER=1` 模式取代。

## 项目结构

```
search_paper/
├── config.yaml              # 用户配置（搜索条件、筛选规则、输出设置）—— 已被 .gitignore
├── config.default.yaml      # 默认配置
├── config.example.yaml      # 配置示例
├── export_results.py        # 结果导出脚本 (Markdown / CSV / BibTeX)
├── backend/                 # Express 后端（任务 API + 队列）
│   ├── src/index.js         #   入口（端口 3001）
│   └── src/services/        #   queueConsumer.js / taskService.js / parserService.js
├── frontend/                # Vite + React 前端
│   └── src/                 #   页面、组件、API client
├── tasks/                   # 任务队列目录（tasks/{task_id}/{config.yaml,meta.json,output/}）
├── output/                  # 单机搜索输出目录
└── .claude/
    ├── skills/                  # 自定义 skills（每个一个文件夹，入口 SKILL.md）
    │   ├── paper-search/SKILL.md   #   7 步搜索流水线
    │   ├── start/SKILL.md          #   一键启动
    │   └── stop/SKILL.md           #   一键停止
    └── queue-consume.md         # 队列消费者流程（当前会话）
```

## Skills

- **paper-search**: 完整的 7 步论文搜索流水线，从配置读取到结构化输出
- **start**: 一键启动后端 + 前端 + 会话内队列消费者轮询
- **stop**: 一键停止后端/前端进程 + 停掉消费者轮询
