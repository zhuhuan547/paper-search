---
name: paper-search
description: 多源学术论文搜索 — 持续搜索直到凑满 N 篇全部满足所有筛选条件的论文，经初筛→代码验证→LLM深度分析，输出结构化结果。
---

# 学术论文多源搜索工具

按 `config.yaml` 中设定的筛选条件，**持续搜索直到找到 N 篇全部满足所有条件的论文**，不保留"部分匹配"论文。

## 核心原则

> `search.max_papers` 的含义是：**最终输出 N 篇全部通过所有筛选的论文**，不是"搜索 N 篇然后标记哪些通过"。
> 每篇论文必须同时满足：年份 + 期刊等级 + 关键词 + 模块匹配 + 数据集匹配 + 代码开源要求，才计入最终结果。
> 如果当前搜索结果中通过数不足 N，则自动翻页/切换数据源继续搜索，直到凑满 N 篇或所有数据源穷尽。

---

## 架构总览

```
config.yaml  →  Step1 读取配置
                 Step2 浏览器就绪
                 ┌──────────────────────────────────────────┐
                 │  搜索循环（直到凑满 max_papers 或穷尽）    │
                 │  Step3 搜索一页 → Step4 初筛 → Step5 验码 │
                 │  不足则翻页 / 切换数据源 / 扩展搜索词      │
                 └──────────────────────────────────────────┘
                 Step6 LLM 深度分析（仅分析全部通过的论文）
                 Step7 结构化输出（只有通过的论文）
```

---

## Step 1 — 读取配置

1. 读取项目根目录下的 `config.yaml`
2. 解析所有筛选字段（同原版）
3. 关键字段语义：
   - `search.max_papers`：**最终必须输出 N 篇全部满足条件的论文**
   - `search.max_search_pages`：每个搜索源最多翻页数（默认 5，防止无限搜索）
   - 所有 filter 条件（年份、期刊、模块、数据集、代码）都是 **AND** 关系

---

## Step 2 — 浏览器就绪

使用 Playwright MCP 工具直接操作浏览器。遇到弹窗按 `Escape` 关闭。

---

## Step 3+4+5 — 搜索-筛选-验证循环

这是整个工具的核心：**搜索 → 初筛 → 代码验证 → 不够就继续搜**。

### 循环逻辑（伪代码）

```
qualified = []
page = 1
source_index = 0
sources = config.search.sources  # ["semantic_scholar", "dblp", "arxiv"]

while len(qualified) < config.search.max_papers and source_index < len(sources):
    source = sources[source_index]
    while len(qualified) < config.search.max_papers and page <= config.search.max_search_pages:
        results = search(source, keywords, year_range, page)
        if results is empty:
            break  # 该源无更多结果，切换下一个源
        
        for paper in results:
            if paper already in qualified (去重):
                continue
            if not screening_filter(paper):
                continue   # 不满足 → 丢弃，不保留
            if not code_verification(paper):
                continue   # 代码不满足 → 丢弃，不保留
            qualified.append(paper)  # ✅ 全部通过
            if len(qualified) >= max_papers:
                break
        
        page += 1
    
    source_index += 1  # 切换下一个数据源
    page = 1

return qualified  # 可能 < max_papers（穷尽所有源后仍不足）
```

### 3.1 搜索（每个数据源）

**Semantic Scholar**：
- URL：`https://www.semanticscholar.org/search?q=<关键词>&sort=total-citations&year[]=<年份>&page=<页码>`
- 提取：标题、作者、日期、期刊、引用数、TLDR、arXiv链接、DOI
- 如果返回 500/429，等待 5 秒重试 1 次，仍失败则切换数据源

**DBLP**（Semantic Scholar 穷尽后）：
- URL：`https://dblp.org/search?q=<关键词>`
- 筛选年份，提取元数据

**arXiv**（前两个源穷尽后）：
- URL：`https://arxiv.org/search/?query=<关键词>&searchtype=all`
- 按日期排序，筛选年份，提取完整摘要

### 3.2 初筛（每篇论文立即执行，不通过的直接丢弃）

检查以下条件（**AND 关系**）：

| 条件 | 规则 | 不通过则 |
|------|------|---------|
| 年份 | `year_range[0] <= year <= year_range[1]` | 丢弃 |
| 期刊等级 | 如果 `venue.min_ccf_level` 不为 null，期刊必须达到该等级 | 丢弃 |
| 期刊白名单 | 如果 `venue.include_patterns` 非空，期刊必须匹配至少一条 | 丢弃 |
| 期刊黑名单 | 如果 `venue.exclude_patterns` 非空，期刊不能匹配任何一条 | 丢弃 |
| arXiv only | 如果 `venue.allow_arxiv_only` 为 false，纯预印本丢弃 | 丢弃 |
| 关键词 | 标题+摘要必须包含 `search.keywords` 中至少一组的部分匹配 | 丢弃 |

### 3.3 代码验证（初筛通过后立即执行）

查找代码仓库：
1. Semantic Scholar 论文页查找 Code/GitHub 链接
2. arXiv 页查找 Related Material
3. GitHub 搜索：`https://github.com/search?q=<精简标题>&type=repositories`

打开仓库页面，检查：

| 条件 | 规则 | 不通过则 |
|------|------|---------|
| 有仓库 | 至少找到一个 GitHub/GitLab 链接 | 丢弃 |
| 非空壳 | 至少 `min_code_files` 个非 README 的代码文件 | 丢弃 |
| Star 数 | `stars >= code.min_stars` | 丢弃 |
| 平台 | 仓库在 `code.platforms` 白名单中 | 丢弃 |

**如果 `code.require_open_source` 为 false，跳过代码验证。**

### 3.4 去重

以 arXiv ID > DOI > 标准化标题为键，跨数据源和跨页码去重。

---

## Step 6 — LLM 深度分析

**仅对 Step 3-5 循环中全部通过的论文执行。**

如果 `modules.include` 或 `modules.exclude` 或 `datasets.include` 或 `datasets.exclude` 全为空，可跳过 LLM 分析（无需匹配）。

否则，对每篇论文调用 Agent 并行分析：

```json
{
  "paper_id": "...",
  "method_summary": "一句话",
  "tech_modules": ["tag1", "tag2"],
  "datasets_used": ["ds1", "ds2"],
  "novelty_level": "high | medium | low",
  "approach_type": "...",
  "module_match": {"verdict": "pass | fail", "reason": "..."},
  "dataset_match": {"verdict": "pass | fail", "reason": "..."}
}
```

**匹配逻辑**：
- `modules.include` 非空时，论文的 `tech_modules` 必须至少语义匹配其中一项
- `modules.exclude` 中任何一项被匹配到 → fail
- `datasets.include` 非空时，`datasets_used` 必须至少包含其中一项
- `datasets.exclude` 中任何一项被匹配到 → fail

**LLM 阶段判定 fail 的论文也丢弃**，最终结果只包含全部通过的论文。

---

## Step 7 — 结果输出

### 7.1 综合打分

```
score = citations * 0.3 + (novelty_high:1  medium:0.5  low:0) * 0.3 + (has_code:1) * 0.2 + (module_match_pass:1) * 0.2
```

按 score 降序排列。

### 7.2 Markdown 输出

开头显示搜索统计：

```markdown
# 学术论文搜索结果
> 搜索条件：关键词=..., 年份=..., max_papers=10
> 搜索了 X 页 Y 个数据源，初筛通过 A 篇，代码验证通过 B 篇，最终全部通过 C 篇
```

每篇论文输出完整卡片（标题、作者、摘要、方法、模块、数据集、代码链接）。

### 7.3 CSV / BibTeX

同原版格式，**只包含全部通过的论文**。

---

## 错误处理

| 场景 | 处理 |
|------|------|
| 穷尽所有源仍不足 max_papers | 输出已找到的 N 篇（N < max_papers），明确告知用户"只找到 N 篇全部满足的论文" |
| Semantic Scholar 500/429 | 等待 5s 重试 1 次 → 切换下一数据源 |
| GitHub 搜索无结果 | 论文丢弃（如果 require_open_source=true） |
| LLM 超时 | 降级为 keyword 模式 |

---

## 使用方式

```
/paper-search
```

自动读取 `config.yaml`，执行搜索-筛选-验证循环，直到凑满 `max_papers` 篇全部满足条件的论文。
