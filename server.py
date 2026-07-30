#!/usr/bin/env python3
"""
学术论文多源搜索 Web 服务
前端页面 → Flask API → Semantic Scholar / arXiv / GitHub → 结构化结果
"""

import json
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Optional

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

CACHE_DIR = Path("cache")
OUTPUT_DIR = Path("output")
CACHE_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# ============================================================
#  CCF 等级速查
# ============================================================
CCF_A = {"CVPR", "ICCV", "ECCV", "NeurIPS", "ICML", "AAAI", "IJCAI",
         "ACL", "EMNLP", "NAACL", "SIGIR", "WWW", "SIGMOD", "VLDB"}
CCF_B = {"MICCAI", "IPMI", "COLING", "EACL", "CoNLL", "CIKM", "WSDM",
         "ICDM", "EDBT", "ICDE", "PODS", "ICSE", "FSE", "ASE", "ISSTA"}
CCF_C = {"LREC", "AMIA", "BIBM", "EMBC", "ICPR", "ICASSP", "ICME", "ICMR", "MMM"}

def ccf_level(venue: str) -> Optional[str]:
    v = venue.upper()
    for a in CCF_A:
        if a in v:
            return "A"
    for b in CCF_B:
        if b in v:
            return "B"
    for c in CCF_C:
        if c in v:
            return "C"
    return None

def ccf_ok(venue: str, min_level: Optional[str]) -> bool:
    if not min_level:
        return True
    level = ccf_level(venue)
    if not level:
        return False
    order = {"A": 3, "B": 2, "C": 1}
    return order.get(level, 0) >= order.get(min_level, 0)


# ============================================================
#  API 封装
# ============================================================
def _fetch_json(url: str, retries: int = 2, delay: float = 3.0) -> Optional[dict]:
    """带重试的 JSON 请求"""
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PaperSearch/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if attempt < retries:
                time.sleep(delay)
            else:
                print(f"  [WARN] API fail: {url[:80]}... → {e}")
    return None


def search_semantic_scholar(keyword: str, year_range: tuple, page: int = 0, limit: int = 20) -> list[dict]:
    """Semantic Scholar API 搜索"""
    query = urllib.parse.quote(keyword)
    url = (
        f"https://api.semanticscholar.org/graph/v1/paper/search"
        f"?query={query}&year={year_range[0]}-{year_range[1]}"
        f"&limit={limit}&offset={page * limit}"
        f"&sort=citation_count:desc"
        f"&fields=title,authors,year,venue,publicationDate,citationCount,"
        f"abstract,externalIds,url,openAccessPdf"
    )
    data = _fetch_json(url)
    if not data or "data" not in data:
        return []
    papers = []
    for item in data["data"]:
        authors = [a.get("name", "") for a in item.get("authors", [])]
        ext = item.get("externalIds", {}) or {}
        papers.append({
            "id": item.get("paperId", ""),
            "title": item.get("title", ""),
            "authors": authors,
            "year": item.get("year"),
            "venue": (item.get("venue", "") or "").strip(),
            "venue_full": "",
            "citations": item.get("citationCount", 0),
            "abstract": item.get("abstract", "") or "",
            "arxiv_id": ext.get("ArXiv"),
            "doi": ext.get("DOI"),
            "url": item.get("url", ""),
            "pdf_url": (item.get("openAccessPdf", {}) or {}).get("url"),
            "source": "semantic_scholar",
        })
    return papers


def search_arxiv(keyword: str, year_range: tuple, max_results: int = 20) -> list[dict]:
    """arXiv API 搜索"""
    query = urllib.parse.quote(keyword)
    url = (
        f"https://export.arxiv.org/api/query?"
        f"search_query=all:{query}&start=0&max_results={max_results}"
        f"&sortBy=submittedDate&sortOrder=descending"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "PaperSearch/1.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            xml = resp.read().decode()
    except Exception as e:
        print(f"  [WARN] arXiv API fail: {e}")
        return []

    papers = []
    entries = xml.split("<entry>")[1:]
    for entry in entries:
        try:
            title = re.search(r"<title>(.*?)</title>", entry, re.DOTALL)
            title = title.group(1).strip() if title else ""
            arxiv_id_raw = re.search(r"<id>.*?/([^/]+?)</id>", entry)
            arxiv_id = arxiv_id_raw.group(1) if arxiv_id_raw else ""
            # 清理版本号
            arxiv_id = re.sub(r"v\d+$", "", arxiv_id)
            abstract = re.search(r"<summary>(.*?)</summary>", entry, re.DOTALL)
            abstract = abstract.group(1).strip() if abstract else ""
            published = re.search(r"<published>(\d{4})", entry)
            year = int(published.group(1)) if published else None

            if year and (year < year_range[0] or year > year_range[1]):
                continue

            authors = re.findall(r"<name>(.*?)</name>", entry)

            papers.append({
                "id": f"arxiv-{arxiv_id}",
                "title": title,
                "authors": authors,
                "year": year,
                "venue": "arXiv",
                "venue_full": "arXiv preprint",
                "citations": 0,
                "abstract": abstract,
                "arxiv_id": arxiv_id,
                "doi": None,
                "url": f"https://arxiv.org/abs/{arxiv_id}",
                "pdf_url": f"https://arxiv.org/pdf/{arxiv_id}.pdf",
                "source": "arxiv",
            })
        except Exception:
            continue
    return papers


def search_github(paper_title: str, authors: list[str]) -> Optional[dict]:
    """GitHub API 搜索代码仓库"""
    # 用标题的前几个词搜索
    words = paper_title.split()[:8]
    short_query = " ".join(w for w in words if len(w) > 2)
    query = urllib.parse.quote(f"{short_query} paper")
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page=3"
    data = _fetch_json(url)
    if not data or "items" not in data or not data["items"]:
        return None

    best = None
    for item in data["items"]:
        name = (item.get("full_name", "") or "").lower()
        desc = (item.get("description", "") or "").lower()
        title_lower = paper_title.lower()
        # 简单匹配：仓库名或描述中包含标题关键词
        title_words = [w.lower() for w in paper_title.split() if len(w) > 4]
        match_score = sum(1 for w in title_words if w in name or w in desc)
        if match_score >= 2 or any(w in name for w in title_words[:2]):
            return {
                "repo_url": item.get("html_url", ""),
                "stars": item.get("stargazers_count", 0),
                "updated": item.get("updated_at", ""),
                "language": item.get("language", ""),
                "has_code": True,
                "is_empty": item.get("size", 0) < 10,
            }

    return None


# ============================================================
#  筛选逻辑
# ============================================================
def paper_passes_screening(paper: dict, config: dict) -> tuple[bool, str]:
    """检查论文是否通过初筛，返回 (通过, 原因)"""
    year = paper.get("year")
    yr = config["search"]["year_range"]
    if year is None or year < yr[0] or year > yr[1]:
        return False, f"年份不符：{year}"

    venue = paper.get("venue", "")
    venue_cfg = config.get("venue", {})

    if venue_cfg.get("exclude_patterns"):
        for pat in venue_cfg["exclude_patterns"]:
            if re.search(pat, venue, re.IGNORECASE):
                return False, f"期刊黑名单：匹配 {pat}"

    if not venue_cfg.get("allow_arxiv_only", True) and venue.lower() == "arxiv":
        return False, "不允许纯预印本"

    min_ccf = venue_cfg.get("min_ccf_level")
    if min_ccf and not ccf_ok(venue, min_ccf):
        return False, f"CCF 等级不足：需要 ≥{min_ccf}"

    # 关键词粗筛
    title_abs = (paper.get("title", "") + " " + paper.get("abstract", "")).lower()
    keywords = config["search"]["keywords"]
    if keywords:
        matched = False
        for kw in keywords:
            kw_lower = kw.lower()
            # 至少匹配一个完整关键词或其主要部分
            parts = [p for p in kw_lower.split() if len(p) > 3]
            if any(p in title_abs for p in parts) or kw_lower in title_abs:
                matched = True
                break
        if not matched:
            return False, "关键词不匹配"

    return True, ""


def paper_passes_code(paper: dict, config: dict) -> tuple[bool, str, Optional[dict]]:
    """检查代码要求，返回 (通过, 原因, repo_info)"""
    code_cfg = config.get("code", {})
    if not code_cfg.get("require_open_source", True):
        return True, "", None

    repo = search_github(paper.get("title", ""), paper.get("authors", []))
    if not repo:
        return False, "未找到开源代码仓库", None

    if repo.get("is_empty"):
        return False, "仓库为空壳（仅 README）", repo

    if repo.get("stars", 0) < code_cfg.get("min_stars", 0):
        return False, f"Star 数不足：{repo['stars']} < {code_cfg['min_stars']}", repo

    return True, "", repo


# ============================================================
#  主搜索流水线
# ============================================================
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/search", methods=["POST"])
def api_search():
    config = request.get_json()
    if not config:
        return jsonify({"error": "请求体为空"}), 400

    keywords = config.get("search", {}).get("keywords", [])
    if not keywords:
        return jsonify({"error": "请至少输入一个关键词"}), 400

    max_papers = config["search"].get("max_papers", 10)
    max_pages = config["search"].get("max_search_pages", 5)
    year_range = tuple(config["search"].get("year_range", [2024, 2025]))
    sources = config["search"].get("sources", ["semantic_scholar", "arxiv"])

    qualified = []
    seen_ids = set()

    for source in sources:
        if len(qualified) >= max_papers:
            break

        for kw in keywords:
            if len(qualified) >= max_papers:
                break

            for page in range(max_pages):
                if len(qualified) >= max_papers:
                    break

                # Step 3 — 搜索
                if source == "semantic_scholar":
                    batch = search_semantic_scholar(kw, year_range, page, limit=20)
                elif source == "arxiv":
                    batch = search_arxiv(kw, year_range, max_results=30)
                    if page > 0:
                        break  # arXiv API 不支持翻页
                else:
                    break

                if not batch:
                    break

                for paper in batch:
                    if len(qualified) >= max_papers:
                        break

                    # 去重
                    dedup_key = paper.get("arxiv_id") or paper.get("doi") or paper.get("title", "").lower().strip()
                    if dedup_key in seen_ids:
                        continue
                    seen_ids.add(dedup_key)

                    # Step 4 — 初筛
                    ok, reason = paper_passes_screening(paper, config)
                    if not ok:
                        continue

                    # Step 5 — 代码验证
                    ok, reason, repo = paper_passes_code(paper, config)
                    if not ok:
                        continue

                    # 组装结果
                    if repo:
                        paper["repo_url"] = repo["repo_url"]
                        paper["stars"] = repo["stars"]
                        paper["has_code"] = True
                    else:
                        paper["has_code"] = False
                        paper["stars"] = 0
                        paper["repo_url"] = None

                    paper["passed"] = True
                    qualified.append(paper)

                # Semantic Scholar 翻页检查
                if source == "semantic_scholar" and len(batch) < 20:
                    break

    # Step 6 — LLM 分析（如果配置了模块/数据集筛选）
    modules_cfg = config.get("modules", {})
    datasets_cfg = config.get("datasets", {})
    need_llm = bool(
        modules_cfg.get("include") or modules_cfg.get("exclude") or
        datasets_cfg.get("include") or datasets_cfg.get("exclude")
    )

    if need_llm and qualified:
        qualified = _llm_analysis(qualified, modules_cfg, datasets_cfg)

    # 打分 & 排序
    for p in qualified:
        novelty_map = {"high": 1.0, "medium": 0.5, "low": 0.0}
        novelty_score = novelty_map.get(p.get("novelty_level", "medium"), 0.5)
        p["score"] = round(
            p.get("citations", 0) * 0.3 +
            novelty_score * 0.3 +
            (1.0 if p.get("has_code") else 0.0) * 0.2 +
            (1.0 if p.get("passed") else 0.0) * 0.2,
            1
        )

    qualified.sort(key=lambda p: p.get("score", 0), reverse=True)
    for i, p in enumerate(qualified):
        p["rank"] = i + 1

    # 缓存
    cache_data = {
        "timestamp": datetime.now().isoformat(),
        "query": config["search"],
        "count": len(qualified),
        "papers": qualified,
    }
    with open(CACHE_DIR / "paper_analysis.json", "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)

    return jsonify({
        "success": True,
        "count": len(qualified),
        "target": max_papers,
        "message": f"找到 {len(qualified)} 篇全部满足条件的论文" + (f"（目标 {max_papers} 篇）" if len(qualified) < max_papers else ""),
        "papers": qualified,
    })


def _llm_analysis(papers: list[dict], modules_cfg: dict, datasets_cfg: dict) -> list[dict]:
    """LLM 深度分析（如果不可用则降级为关键词匹配）"""
    # 尝试使用 Anthropic SDK，如果不可用则降级
    try:
        import anthropic
        client = anthropic.Anthropic()
    except Exception:
        return _keyword_match(papers, modules_cfg, datasets_cfg)

    include_mods = modules_cfg.get("include", []) or []
    exclude_mods = modules_cfg.get("exclude", []) or []
    include_ds = datasets_cfg.get("include", []) or []
    exclude_ds = datasets_cfg.get("exclude", []) or []

    match_mode = modules_cfg.get("match_mode", "keyword")
    if match_mode == "keyword":
        return _keyword_match(papers, modules_cfg, datasets_cfg)

    passed = []
    for paper in papers:
        prompt = f"""Analyze this paper and return ONLY valid JSON (no markdown):

Title: {paper.get('title')}
Abstract: {paper.get('abstract', '')[:500]}

Required tech modules (must match at least one): {include_mods if include_mods else 'none'}
Forbidden tech modules (must NOT match any): {exclude_mods if exclude_mods else 'none'}
Required datasets (must use at least one): {include_ds if include_ds else 'none'}
Forbidden datasets (must NOT use any): {exclude_ds if exclude_ds else 'none'}

Return: {{"tech_modules": [...], "datasets_used": [...], "method_summary": "...", "novelty_level": "high|medium|low", "module_match": {{"verdict": "pass|fail"}}, "dataset_match": {{"verdict": "pass|fail"}}}}"""

        try:
            resp = client.messages.create(
                model="claude-sonnet-5",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            text = resp.content[0].text
            # 提取 JSON
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                analysis = json.loads(match.group())
                paper.update(analysis)
            else:
                paper["tech_modules"] = []
                paper["datasets_used"] = []
                paper["method_summary"] = ""
                paper["novelty_level"] = "medium"
        except Exception:
            paper["tech_modules"] = []
            paper["datasets_used"] = []
            paper["method_summary"] = ""
            paper["novelty_level"] = "medium"

        # 模块匹配判定
        techs = [t.lower() for t in paper.get("tech_modules", [])]
        paper["module_match"] = {"verdict": "pass", "reason": ""}
        if include_mods:
            if not any(any(m.lower() in t for t in techs) for m in include_mods):
                paper["module_match"] = {"verdict": "fail", "reason": f"缺少必需模块：{include_mods}"}
        if exclude_mods:
            if any(any(m.lower() in t for t in techs) for m in exclude_mods):
                paper["module_match"] = {"verdict": "fail", "reason": f"包含排除模块"}

        # 数据集匹配判定
        ds_list = [d.lower() for d in paper.get("datasets_used", [])]
        paper["dataset_match"] = {"verdict": "pass", "reason": ""}
        if include_ds:
            if not any(any(m.lower() in d for d in ds_list) for m in include_ds):
                paper["dataset_match"] = {"verdict": "fail", "reason": f"缺少必需数据集：{include_ds}"}
        if exclude_ds:
            if any(any(m.lower() in d for d in ds_list) for m in exclude_ds):
                paper["dataset_match"] = {"verdict": "fail", "reason": "使用了排除数据集"}

        if paper["module_match"]["verdict"] == "pass" and paper["dataset_match"]["verdict"] == "pass":
            passed.append(paper)

    return passed


def _keyword_match(papers: list[dict], modules_cfg: dict, datasets_cfg: dict) -> list[dict]:
    """关键词降级匹配"""
    include_mods = [m.lower() for m in modules_cfg.get("include", []) or []]
    exclude_mods = [m.lower() for m in modules_cfg.get("exclude", []) or []]
    include_ds = [d.lower() for d in datasets_cfg.get("include", []) or []]
    exclude_ds = [d.lower() for d in datasets_cfg.get("exclude", []) or []]

    passed = []
    for paper in papers:
        text = (paper.get("title", "") + " " + paper.get("abstract", "")).lower()

        # 简单的关键词推断
        techs = _infer_tech_modules(text)
        paper["tech_modules"] = techs
        paper["datasets_used"] = _infer_datasets(text)
        paper["method_summary"] = ""
        paper["novelty_level"] = "medium"

        ok = True
        if include_mods and not any(m in " ".join(techs) for m in include_mods):
            ok = False
        if exclude_mods and any(m in " ".join(techs) for m in exclude_mods):
            ok = False
        ds_text = " ".join(paper.get("datasets_used", []))
        if include_ds and not any(d in ds_text for d in include_ds):
            ok = False
        if exclude_ds and any(d in ds_text for d in exclude_ds):
            ok = False

        if ok:
            passed.append(paper)
    return passed


def _infer_tech_modules(text: str) -> list[str]:
    """从文本推断技术模块"""
    modules = []
    patterns = {
        "contrastive learning": r"contrastive\s*learning",
        "transformer": r"transformer",
        "vision-language model": r"vision.language\s*model|vlm",
        "retrieval-augmented": r"retrieval.augmented|rag",
        "federated learning": r"federated\s*learning",
        "curriculum learning": r"curriculum\s*learning",
        "cross-modal alignment": r"cross.modal\s*alignment",
        "longitudinal modeling": r"longitudinal|temporal",
        "knowledge graph": r"knowledge\s*graph",
        "self-supervised learning": r"self.supervised",
        "multi-view learning": r"multi.view",
        "attention mechanism": r"attention\s*mechanism",
        "graph neural network": r"graph\s*neural|gnn",
        "reinforcement learning": r"reinforcement\s*learning",
        "diffusion model": r"diffusion\s*model",
        "LLM fine-tuning": r"llm|large\s*language\s*model|fine.tun",
        "encoder-decoder": r"encoder.decoder|seq2seq",
        "abnormality detection": r"abnormality\s*detect",
        "report generation": r"report\s*generation",
    }
    for name, pattern in patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            modules.append(name)
    return modules


def _infer_datasets(text: str) -> list[str]:
    """从文本推断数据集"""
    datasets = []
    ds_patterns = {
        "MIMIC-CXR": r"mimic.cxr",
        "IU-Xray": r"iu.xray|iu\s*x.ray",
        "CheXpert": r"chexpert",
        "ChestX-ray14": r"chestx.ray14|nih\s*chest",
        "PadChest": r"padchest",
        "VinDr-CXR": r"vindr",
        "MIMIC-ABN": r"mimic.abn",
        "MIMIC-CXR-JPG": r"mimic.cxr.jpg",
    }
    for name, pattern in ds_patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            datasets.append(name)
    return datasets


# ============================================================
#  导出 API
# ============================================================
@app.route("/api/export", methods=["POST"])
def api_export():
    data = request.get_json()
    papers = data.get("papers", [])
    fmt = data.get("format", "markdown")

    OUTPUT_DIR.mkdir(exist_ok=True)

    if fmt == "csv":
        import csv
        import io
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=[
            "rank", "title", "authors", "year", "venue", "citations",
            "arxiv_id", "doi", "has_code", "repo_url", "stars",
            "tech_modules", "datasets_used"
        ])
        writer.writeheader()
        for p in papers:
            row = {k: p.get(k, "") for k in writer.fieldnames if k != "authors"}
            row["rank"] = p.get("rank", 0)
            row["authors"] = ";".join(p.get("authors", [])) if isinstance(p.get("authors"), list) else p.get("authors", "")
            row["tech_modules"] = ";".join(p.get("tech_modules", [])) if isinstance(p.get("tech_modules"), list) else ""
            row["datasets_used"] = ";".join(p.get("datasets_used", [])) if isinstance(p.get("datasets_used"), list) else ""
            writer.writerow(row)
        return jsonify({"content": buf.getvalue()})

    if fmt == "bibtex":
        entries = []
        for p in papers:
            authors = p.get("authors", ["Unknown"])
            if isinstance(authors, str):
                authors = [a.strip() for a in authors.split(",")]
            key = (authors[0].split()[-1] if authors else "Unknown") + str(p.get("year", "0000")) + p.get("title", "paper").split()[0].lower().rstrip(".,;:!?")
            venue = p.get("venue_full") or p.get("venue", "Unknown")
            title = p.get('title', 'Unknown')
            author_str = ' and '.join(authors)
            year_val = p.get('year', '0000')
            entry = (
                "@article{" + key + ",\n"
                "  title     = {" + title + "},\n"
                "  author    = {" + author_str + "},\n"
                "  year      = {" + str(year_val) + "},\n"
                "  journal   = {" + venue + "},\n"
                "}"
            )
            if p.get('doi'):
                entry = entry[:-2] + ",\n  doi       = {" + p['doi'] + "},\n}"
            if p.get('arxiv_id'):
                entry = entry[:-2] + ",\n  note      = {arXiv: " + p['arxiv_id'] + "},\n}"
            entries.append(entry)
        return jsonify({"content": "\n\n".join(entries)})

    return jsonify({"error": "不支持的格式"}), 400


@app.route("/api/cache", methods=["GET"])
def api_cache():
    """加载缓存的搜索结果"""
    cache_file = CACHE_DIR / "paper_analysis.json"
    if not cache_file.exists():
        return jsonify({"error": "缓存文件不存在，请先执行一次搜索"}), 404
    with open(cache_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    papers = data.get("papers", [])
    return jsonify({
        "success": True,
        "count": len(papers),
        "target": data.get("query", {}).get("max_papers", len(papers)),
        "message": f"从缓存加载 {len(papers)} 篇论文",
        "papers": papers,
    })


if __name__ == "__main__":
    print("🚀 学术论文搜索服务启动：http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
