#!/usr/bin/env python3
"""
学术论文搜索结果导出工具
从 cache/paper_analysis.json 读取数据，生成 Markdown / CSV / BibTeX 格式输出
"""

import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Windows 控制台默认 GBK，无法输出 emoji/中文，重设为 UTF-8（仅影响 print，不影响文件写入）
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, 'reconfigure'):
        _stream.reconfigure(encoding='utf-8')

# ---- 配置 ----
CACHE_FILE = "cache/paper_analysis.json"
OUTPUT_DIR = "output"
OUTPUT_MD = "results.md"
OUTPUT_CSV = "results.csv"
OUTPUT_BIB = "references.bib"


def load_papers(cache_path: str) -> list[dict]:
    """加载缓存的论文分析结果"""
    with open(cache_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # 兼容两种格式：直接列表 或 {"papers": [...]}
    if isinstance(data, list):
        return data
    return data.get("papers", [])


def format_authors(authors, max_show: int = 3) -> str:
    """格式化作者列表（兼容 list 和 string）"""
    if not authors:
        return "Unknown"
    if isinstance(authors, str):
        authors = [a.strip() for a in authors.split(",") if a.strip()]
    if len(authors) <= max_show:
        return ", ".join(authors)
    return ", ".join(authors[:max_show]) + f" et al."


def format_venue(p: dict) -> str:
    """格式化会议/期刊信息"""
    if p.get("venue") and p.get("venue_full"):
        return f"{p['venue']} ({p['venue_full']})"
    return p.get("venue") or p.get("venue_full") or "Unknown"


def _get_authors_list(p: dict) -> list:
    """统一获取作者列表（兼容字符串和列表格式）"""
    authors = p.get("authors", [])
    if isinstance(authors, str):
        authors = [a.strip() for a in authors.split(",") if a.strip()]
    return authors if authors else ["Unknown"]

def make_bibtex_key(p: dict) -> str:
    """生成 BibTeX 引用键：第一作者姓氏 + 年份 + 标题首词"""
    authors = _get_authors_list(p)
    first_author = authors[0]
    last_name = first_author.split()[-1] if first_author else "Unknown"
    title_words = p.get("title", "paper").split()
    first_word = title_words[0].rstrip(".,:;!?").lower()
    year = p.get("year", "0000")
    return f"{last_name}{year}{first_word}"


def export_markdown(papers: list[dict], output_path: str, include_reasoning: bool = True) -> None:
    """导出 Markdown 格式"""
    lines = []
    lines.append("# 学术论文搜索结果")
    # 只导出全部通过的论文（调用方保证传入的数据已过滤）
    lines.append(f"\n> 生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  |  全部满足条件：{len(papers)} 篇\n")

    # ---- 汇总表 ----
    lines.append("## 📊 汇总\n")
    lines.append("| # | 论文 | 会议/期刊 | 年份 | 引用 | arXiv | 代码 | 匹配 |")
    lines.append("|---|------|----------|------|------|-------|------|------|")
    for i, p in enumerate(papers, 1):
        title_short = p.get("title", "Unknown")[:60]
        if len(p.get("title", "")) > 60:
            title_short += "..."
        venue = p.get("venue", "—")
        year = p.get("year", "—")
        citations = p.get("citations", 0)
        arxiv = f"[✅](https://arxiv.org/abs/{p['arxiv_id']})" if p.get("arxiv_id") else "❌"
        code = f"[✅]({p.get('repo_url', '')}) ⭐{p.get('stars', 0)}" if p.get("has_code") else "❌"
        lines.append(f"| {i} | {title_short} | {venue} | {year} | {citations} | {arxiv} | {code} | ✅ |")

    lines.append("")

    # ---- 详细卡片 ----
    lines.append("## 📄 论文详情\n")
    for i, p in enumerate(papers, 1):
        title = p.get("title", "Unknown")
        authors_str = format_authors(p.get("authors", []))
        venue_str = format_venue(p)
        year = p.get("year", "—")
        citations = p.get("citations", 0)
        arxiv_id = p.get("arxiv_id")
        doi = p.get("doi")
        abstract = p.get("abstract", "No abstract available.")
        repo_url = p.get("repo_url", "")
        stars = p.get("stars", 0)
        has_code = p.get("has_code", False)
        tech_modules = p.get("tech_modules", [])
        datasets_used = p.get("datasets_used", [])
        method_summary = p.get("method_summary", "")
        passed = p.get("passed", False)
        fail_reason = p.get("fail_reason", "")
        score = p.get("score", 0)

        lines.append(f"### Paper {i} — {title[:80]}")
        lines.append("")
        lines.append("| 元数据 | 详情 |")
        lines.append("|--------|------|")
        lines.append(f"| **标题** | {title} |")
        lines.append(f"| **作者** | {authors_str} |")
        lines.append(f"| **年份** | {year} |")
        lines.append(f"| **会议/期刊** | {venue_str} |")
        lines.append(f"| **引用数** | {citations} |")
        if arxiv_id:
            lines.append(f"| **arXiv** | [{arxiv_id}](https://arxiv.org/abs/{arxiv_id}) |")
        else:
            lines.append("| **arXiv** | ❌ 未收录 |")
        if doi:
            lines.append(f"| **DOI** | [{doi}](https://doi.org/{doi}) |")
        if has_code:
            lines.append(f"| **代码** | [{repo_url}]({repo_url}) ⭐{stars} |")
        else:
            lines.append("| **代码** | ❌ 未开源 |")
        lines.append(f"| **综合评分** | {score:.1f} |")

        if method_summary:
            lines.append(f"\n**核心方法**: {method_summary}")

        if tech_modules:
            tags = " ".join(f"`{m}`" for m in tech_modules)
            lines.append(f"\n**技术模块**: {tags}")

        if datasets_used:
            ds = ", ".join(datasets_used)
            lines.append(f"\n**数据集**: {ds}")

        if include_reasoning:
            lines.append(f"\n**✅ 全部条件满足**: 年份、期刊、关键词、代码开源、模块/数据集匹配均通过。")

        lines.append(f"\n**摘要**: {abstract[:500]}{'...' if len(abstract) > 500 else ''}")
        lines.append("\n---\n")

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ Markdown → {output_path}")


def export_csv(papers: list[dict], output_path: str) -> None:
    """导出 CSV 格式"""
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    fieldnames = [
        "rank", "title", "authors", "year", "venue", "venue_full",
        "citations", "arxiv_id", "doi", "has_code", "repo_url", "stars",
        "tech_modules", "datasets_used", "method_summary",
        "passed", "fail_reason", "score"
    ]
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for i, p in enumerate(papers, 1):
            row = {**p, "rank": i}
            # 将列表字段转为分号分隔字符串
            for list_field in ["tech_modules", "datasets_used"]:
                val = row.get(list_field, [])
                if isinstance(val, list):
                    row[list_field] = ";".join(val)
            row["authors"] = ";".join(_get_authors_list(p))
            writer.writerow(row)
    print(f"✅ CSV → {output_path}")


def export_bibtex(papers: list[dict], output_path: str) -> None:
    """导出 BibTeX 格式"""
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    entries = []
    for p in papers:
        key = make_bibtex_key(p)
        title = p.get("title", "Unknown")
        authors = " and ".join(_get_authors_list(p))
        year = p.get("year", "0000")
        venue = p.get("venue_full") or p.get("venue", "Unknown")
        doi = p.get("doi", "")
        arxiv_id = p.get("arxiv_id", "")

        # 判断类型
        is_conf = any(w in venue.lower() for w in ["conference", "proc", "symposium", "aaai", "cvpr", "iccv", "eccv", "neurips", "icml", "acl", "emnlp", "naacl", "coling", "ijcai", "www", "sigir"])
        entry_type = "inproceedings" if is_conf else "article"

        entry = f"""@{entry_type}{{{key},
  title     = {{{title}}},
  author    = {{{authors}}},
  year      = {{{year}}},
  booktitle = {{{venue}}},"""

        if doi:
            entry += f"\n  doi       = {{{doi}}},"
        if arxiv_id:
            entry += f"\n  note      = {{arXiv: {arxiv_id}}},"

        # 如果只有 arXiv，加入 eprint
        if arxiv_id and not is_conf:
            entry += f"\n  eprint    = {{{arxiv_id}}},"

        entry += "\n}\n"
        entries.append(entry)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(entries))
    print(f"✅ BibTeX → {output_path}")


# ---- 主入口 ----
def main():
    import argparse

    parser = argparse.ArgumentParser(description="学术论文搜索结果导出工具")
    parser.add_argument("--cache", default=CACHE_FILE, help="缓存文件路径")
    parser.add_argument("--output-dir", default=OUTPUT_DIR, help="输出目录")
    parser.add_argument("--formats", nargs="+", default=["markdown", "csv", "bibtex"],
                        choices=["markdown", "csv", "bibtex"], help="导出格式")
    parser.add_argument("--no-reasoning", action="store_true", help="不输出匹配推理")
    args = parser.parse_args()

    if not os.path.exists(args.cache):
        print(f"❌ 缓存文件不存在: {args.cache}")
        print("   请先运行 paper-search 完成论文搜索和分析。")
        sys.exit(1)

    papers = load_papers(args.cache)
    if not papers:
        print("⚠️  缓存文件中没有论文数据。")
        sys.exit(0)

    print(f"📄 加载 {len(papers)} 篇论文")

    output_dir = args.output_dir
    include_reasoning = not args.no_reasoning

    if "markdown" in args.formats:
        export_markdown(papers, os.path.join(output_dir, OUTPUT_MD), include_reasoning)
    if "csv" in args.formats:
        export_csv(papers, os.path.join(output_dir, OUTPUT_CSV))
    if "bibtex" in args.formats:
        export_bibtex(papers, os.path.join(output_dir, OUTPUT_BIB))

    print("\n✅ 导出完成！")


if __name__ == "__main__":
    main()
