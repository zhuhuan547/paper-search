---
name: paper-search
description: 多智能体学术论文搜索协调者 — 直接拉取(OpenAlex+预筛) + curl 判代码(verify_code) + 可选 LLM 匹配，持续搜索直到凑满 N 篇全部满足条件的论文，状态可断点恢复、可暂停。
---

# 学术论文多源搜索工具（多智能体协调者）

按 `config.yaml` 的筛选条件，**确定性 API 优先**：拉取(OpenAlex)、关键词预筛、代码判断(GitHub) 都用代码/API 做，**只有「模块/数据集语义匹配」才用 LLM**。持续搜索直到找到 N 篇全部满足条件的论文。

## 核心原则

> `search.max_papers` = 最终输出 N 篇全部通过所有筛选的论文。
> 每篇必须满足：年份 + 期刊 + 关键词 + 代码开源 + 模块/数据集匹配。
> **能确定性的不碰 LLM**：检索(OpenAlex)、预筛、代码判断(GitHub) 都是确定性操作，秒级；只有模块/数据集语义匹配才派 LLM agent。

## 角色

| 角色 | 谁 | 职责 | 用 LLM? |
|------|----|------|--------|
| 协调者 | 你（当前会话） | 拉取 + curl 判代码 + 合并 + 暂停检查 + 输出 | 否（本尊） |
| 检验智能体 | `paper-search-verify` Workflow | 仅模块/数据集语义匹配（可选，low effort） | 是 |

## 执行流程

### Step 1 — 判定冷/热启动

读 `tasks/{taskId}/meta.json`(config) + `node state.js <taskId> get`：无则 init（冷启动），有则热启动（继承 qualified/rejected/cursor/inbox）。

### Step 2 — 主循环（直到凑满 `max_papers` 或穷尽）

```
while len(qualified) < max_papers:
    # ── 暂停检查（每个动作前必查，别跳过）──
    if stop_requested: 写 state.json → 标 stopped → return

    # ── 拉取候选（直接 OpenAlex + ① 预筛，秒级，不碰 LLM）──
    if inbox 为空:
        node fetch_candidates.js <taskId> "英文关键词1" "英文关键词2" "英文关键词3"
        # 关键词从 original_query 意图推导成英文（config 里可能有垃圾中文关键词）
        # fetch 里已做①预筛：标题+摘要不含 segment 的直接丢弃
        # 若输出含 EXHAUSTED 且 inbox 仍空 → 穷尽 → break

    # ── ③ 代码验证（curl GitHub Search，秒级，不碰 LLM）──
    node verify_code.js <taskId>
    # 读 inbox 前 8 篇，curl GitHub 搜方法名判代码，直接写回 state.json：
    #   pass → qualified；fail → rejected；限流/网络错 → browser_queue

    # ── ② [可选] 模块/数据集语义匹配（仅当 config 有 modules/datasets 时才用 LLM）──
    if config 有 modules.include/exclude 或 datasets.include/exclude 非空:
        对 qualified 里新通过的候选，Workflow(name="paper-search-verify", args={task_id, rules, candidates}, low effort)
        做语义匹配（通过才算真 pass，否则丢）
    # 注意：modules/datasets 全空则完全跳过 LLM，纯 curl 秒级出结果

    # ── 浏览器串行兜底（browser_queue 里的 defer 项）──
    while browser_queue:
        r = browser_queue.pop()
        协调者本尊 Playwright MCP 打开仓库页补验 → 合并 → 写 state.json

    # ── 暂停检查 ──
    if stop_requested: 写 state.json → 标 stopped → return

# 凑满或穷尽

### Step 3 — 输出

1. 把 `qualified` 写成 `paper_analysis.json`（每条补 `passed:true`，缺的字段给默认值）。
2. `python export_results.py --cache tasks/{taskId}/output/paper_analysis.json --output-dir tasks/{taskId}/output` 导出 md/csv/bib。
3. `meta.json` 标 `completed`；`state.json` 标 `phase=completed`。

## 暂停机制（关键）

- 用户点「暂停」→ 后端写 `meta.json` 的 `stop_requested=true`。
- **协调者必须在每个动作前查 `stop_requested`**（fetch 前、verify_code 前、写结果前），查到就：写 state.json → 标 `stopped` → return。
- **verify_code.js 是秒级 curl**，所以暂停在「下一个动作边界」就生效，基本秒停。
- **只有 modules/datasets 的 LLM verify 是长任务**（2-3 分钟）：协调者把 `active_workflow_id` 存进 state.json，下次 CronCreate 检测到 stop_requested 就 `TaskStop` 杀掉。

## 关键约束

- **单写者**：只有协调者写 `state.json`，统一 `node state.js`（get/set/init/clear）。`fetch_candidates.js`/`verify_code.js` 内部也会写 state.json（它们是被协调者串行调用的，不并发）。
- **确定性操作不碰 LLM**：检索、预筛、GitHub 代码判断都用 curl/脚本，秒级；只有模块/数据集语义匹配才派 LLM agent。
- **GitHub 限流**：未认证搜索 10 次/分，verify_code.js 一次只处理 ≤8 篇、间隔 1.5s。
- **fetch 用 `fetch_candidates.js` 直接 OpenAlex**，不要丢给 agent（会 thrash）。

## 错误处理

| 场景 | 处理 |
|------|------|
| 穷尽所有源仍不足 max_papers | 输出已找到的 N 篇，明确告知 |
| OpenAlex 失败 | 换关键词/换源或标 failed |
| GitHub 搜索限流 | verify_code.js 标 defer_browser → 协调者浏览器兜底 |
| 检验超时/异常 | 该篇按 fail 处理 |

## 实战经验（执行中沉淀，随执行更新）

> 每次实际执行与上文描述有差异时，把差异更新回本 skill（见 memory [[keep-skill-in-sync]]）。

- **确定性的事别用 LLM**：关键词预筛（含不含 segment）、代码判断（GitHub 有没有同名仓库）都是确定性操作，用 curl/脚本秒级；用 full LLM agent 去判一篇要 30~60 秒还烧 3 万 token。这是「跑得慢」的主因。
- **本机环境网络实测（2026-08）**：arXiv 直连不可达（http=000），OpenAlex/Crossref 直连 200；arXiv 走本地代理 `127.0.0.1:7890` 可用。搜索优先 OpenAlex。
- **`fetch` 别丢给 agent**：general-purpose agent 遇不可达源会 thrash（实测 8 分钟）。直接 curl OpenAlex。
- **`verify_code.js` 的局限**：只判「GitHub 有没有同名仓库」，不做 min_code_files 空壳检查、不判「仓库是否真属这篇论文」。需要更细判定（尤其有模块/数据集要求）时走 paper-search-verify Workflow。
- **代码平台白名单严格执行**：`platforms=[github,gitlab]` 时，HuggingFace、anonymous.4open.science 不算通过。
- **`meta.json`/`state.json` 用 Node 写 UTF-8 无 BOM**；`year_range` 可能出现 `[5,2026]` 按 original_query 意图解释。
- **结果生成用固定 `export_results.py`**：先写标准 `paper_analysis.json`，再 `python export_results.py --cache ... --output-dir ...`。

## 使用方式

```
/paper-search
```

自动读取 config，拉取(OpenAlex+预筛) → curl 判代码 → 凑满 N 篇全部满足条件（含模块/数据集匹配）的论文。
