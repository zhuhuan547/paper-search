# search_paper — 学术论文多源搜索工具

7 步流水线：配置读取 → 浏览器就绪 → 多源搜索 → 初筛 → 代码验证 → LLM 深度分析 → 结构化输出。

## 快速开始

1. 编辑 `config.yaml` 设定筛选条件
2. 运行 `/paper-search`
3. 在 `output/` 目录查看结果

## 项目结构

```
search_paper/
├── config.yaml              # 用户配置文件（搜索条件、筛选规则、输出设置）
├── config.example.yaml      # 配置示例（胸片报告生成搜索场景）
├── export_results.py        # 结果导出脚本 (Markdown / CSV / BibTeX)
├── output/                  # 输出目录
│   ├── results.md
│   ├── results.csv
│   └── references.bib
├── cache/                   # 缓存目录（避免重复搜索和 LLM 调用）
│   ├── search_results.json
│   └── paper_analysis.json
└── .claude/
    └── skills/
        └── paper-search.md  # Skill 定义（7 步完整流程）
```

## Skills

- **paper-search**: 完整的 7 步论文搜索流水线，从配置读取到结构化输出
