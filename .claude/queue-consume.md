# 队列消费者（当前会话）

由当前 Claude Code 会话充当 `tasks/` 队列的后台消费者，替代后端 spawn headless `claude -p`。
后端已以 `EXTERNAL_CONSUMER=1` 运行，只提供 API，不再自动执行任务。

## 每次触发的流程

### 0. 先处理暂停请求（重要）

扫描所有 `status == "running"` 的任务，若某任务 `meta.json` 的 `stop_requested == true`：

1. 读其 `state.json` 的 `active_workflow_id`，非空则 **`TaskStop(active_workflow_id)`** 杀掉后台 Workflow。
2. `state.json` 保持最近 checkpoint（**不要清空**，供断点续跑）。
3. `meta.json` 标 `status="stopped"`、`stop_requested=false`、`error="用户手动停止"`（UTF-8 无 BOM）。
4. `node append_progress.js <taskId> "⏹ 用户已请求停止，已保存断点"`。
5. 结束本次触发。

### 1. 扫描队列

读取 `tasks/*/meta.json`，找出 `status == "pending"` 的任务，选 `priority` 最小、其次 `created_at` 最早的一个。
无 → 输出「队列空闲」，结束本次触发。

### 2. 标记 running + 判定冷/热启动

- 更新 `meta.json`：`status="running"`、`started_at=当前时间`、`error=null`、`stop_requested=false`（UTF-8 无 BOM）。
- `node state.js <taskId> get`：
  - 无状态文件 → 冷启动：`node state.js <taskId> init`，清进度 + 写第一条「🚀 开始搜索」。
  - 有 → 热启动（断点续跑）：不清进度，追加「🔄 从断点恢复」。

### 3. 执行搜索（协调者循环，详见 `.claude/skills/paper-search/SKILL.md`）

- **拉取候选**：`node fetch_candidates.js <taskId> "英文关键词1" "英文关键词2" ...`（直接 OpenAlex + ①预筛，**不走 agent**）。
- **代码验证（③）**：`node verify_code.js <taskId>`（curl GitHub Search 判代码，秒级，不碰 LLM；pass→qualified，fail→rejected，限流→browser_queue）。
- **模块/数据集匹配（②，可选）**：仅当 config 有 modules/datasets 非空时，才 `Workflow(name="paper-search-verify", args={...}, effort=low)` 做语义匹配。
- **暂停检查**：**每个动作前**读 `meta.json` 的 `stop_requested`，为 true 则写 `state.json` + 标 `stopped` + 结束（别跳过）。
- **浏览器串行兜底**：`browser_queue` 里的 defer 项由协调者本尊用 Playwright MCP 串行补验。
- **checkpoint**：每个决策后写 `state.json`（`fetch_candidates.js`/`verify_code.js` 内部已写），记录 qualified/rejected/inbox/cursor。

### 4. 写结果

把 `qualified` 写成标准 `paper_analysis.json`（每条补 `passed:true` + `abstract`），再 `python export_results.py --cache tasks/{taskId}/output/paper_analysis.json --output-dir tasks/{taskId}/output` 导出 `results.md` / `results.csv` / `references.bib`。

### 5. 标记 completed

更新 `meta.json`：`status="completed"`、`completed_at=当前时间`、`result_summary={papers_found:N}`（UTF-8 无 BOM）。

### 6. 异常处理

任一步失败 → `meta.json` 标 `status="failed"` + `error`，结束本次触发（不卡死）。

## 关键约束

- **一次只消费一个任务**：消费完（成功/失败/停止）再结束本次触发。
- **meta.json / state.json 编码**：始终 UTF-8 无 BOM。
- **state.json 单写者**：只有协调者写，统一 `node state.js` 的 init/get/set/clear。
- **fetch 用 `fetch_candidates.js` 直接 OpenAlex**，不要丢给 agent（会 thrash）。
- **结果文件要真实**：`results.md` 必须包含实际搜到的论文，不能是空壳。
