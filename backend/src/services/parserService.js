/**
 * 自然语言 → 结构化搜索配置 解析器
 *
 * 支持中英文输入，从自然语言描述中提取：
 *   研究主题、关键词、年份范围、会议/期刊要求、代码要求、
 *   技术模块、数据集、目标论文数
 */

const CURRENT_YEAR = new Date().getFullYear();

// ── 已知顶级会议缩写 ──────────────────────────────────
const KNOWN_VENUES = [
  // AI/ML
  'CVPR', 'ICCV', 'ECCV', 'NeurIPS', 'ICML', 'ICLR',
  'AAAI', 'IJCAI', 'AAMAS', 'UAI', 'AISTATS',
  // NLP
  'ACL', 'EMNLP', 'NAACL', 'COLING', 'EACL', 'TACL',
  // IR/Web/DB
  'SIGIR', 'WWW', 'WSDM', 'CIKM', 'KDD', 'SIGMOD', 'VLDB', 'ICDE',
  // Systems
  'OSDI', 'SOSP', 'ASPLOS', 'ISCA', 'MICRO', 'HPCA',
  'PLDI', 'POPL', 'ICSE', 'FSE', 'ASE',
  // Security
  'CCS', 'S&P', 'USENIX Security', 'NDSS',
  // HCI/Networks
  'CHI', 'UIST', 'CSCW', 'MobiCom', 'SIGCOMM', 'NSDI',
];

// ── 中文→英文技术术语映射 ─────────────────────────────
const TECH_TERM_MAP = {
  // 联邦学习
  '联邦学习': 'federated learning',
  '差分隐私': 'differential privacy',
  '同态加密': 'homomorphic encryption',
  '安全多方计算': 'secure multi-party computation',
  '拜占庭鲁棒': 'Byzantine robustness',
  '拜占庭容错': 'Byzantine fault tolerance',
  '投毒攻击': 'poisoning attack',
  '投毒检测': 'poisoning detection',
  '联邦平均': 'federated averaging',
  '安全聚合': 'secure aggregation',
  '梯度裁剪': 'gradient clipping',
  '模型反转': 'model inversion',
  '成员推断': 'membership inference',
  // LLM/推理
  '大语言模型': 'large language model',
  '推理优化': 'inference optimization',
  'KV缓存': 'KV cache',
  '模型量化': 'model quantization',
  '投机解码': 'speculative decoding',
  '投机采样': 'speculative sampling',
  '蒸馏': 'knowledge distillation',
  '剪枝': 'pruning',
  // 生成模型
  '扩散模型': 'diffusion model',
  '生成对抗网络': 'GAN',
  '变分自编码器': 'variational autoencoder',
  // CV
  '目标检测': 'object detection',
  '图像分割': 'image segmentation',
  '语义分割': 'semantic segmentation',
  '实例分割': 'instance segmentation',
  '图像分类': 'image classification',
  '自监督学习': 'self-supervised learning',
  '对比学习': 'contrastive learning',
  '表示学习': 'representation learning',
  '迁移学习': 'transfer learning',
  '少样本学习': 'few-shot learning',
  '零样本学习': 'zero-shot learning',
  // 医学
  '医学影像': 'medical imaging',
  '胸片': 'chest X-ray',
  'CT': 'CT imaging',
  '报告生成': 'report generation',
  '图像超分辨率': 'image super-resolution',
  // 其他
  '注意力机制': 'attention mechanism',
  'Transformer': 'Transformer',
  '图神经网络': 'graph neural network',
  '强化学习': 'reinforcement learning',
  '元学习': 'meta-learning',
};

// ── 已知数据集 ────────────────────────────────────────
const KNOWN_DATASETS = [
  'ImageNet', 'CIFAR-10', 'CIFAR-100', 'MNIST', 'Fashion-MNIST',
  'COCO', 'Pascal VOC', 'ADE20K', 'Cityscapes',
  'MIMIC-CXR', 'IU-Xray', 'CheXpert', 'ChestX-ray14',
  'FEMNIST', 'Shakespeare', 'Sent140', 'CelebA',
  'SQuAD', 'GLUE', 'SuperGLUE', 'WMT', 'IMDB',
  'PubMed', 'OpenReview', 'ArXiv',
];

// ── 年份范围解析 ──────────────────────────────────────

/**
 * 从文本中提取年份范围
 * 支持: "近N年" "N年以后" "N年至今" "N1-N2年" "N1到N2"
 * 返回 [startYear, endYear] 或 null
 */
function extractYearRange(text) {
  // "近N年"
  const recentMatch = text.match(/近\s*(\d+)\s*年/);
  if (recentMatch) {
    const n = parseInt(recentMatch[1]);
    return [CURRENT_YEAR - n + 1, CURRENT_YEAR];
  }

  // "最近N年"
  const latestMatch = text.match(/最近\s*(\d+)\s*年/);
  if (latestMatch) {
    const n = parseInt(latestMatch[1]);
    return [CURRENT_YEAR - n + 1, CURRENT_YEAR];
  }

  // "N年以后" "N年至今" "N年到现在"
  const sinceMatch = text.match(/(\d{4})\s*年?\s*(?:以后|至今|到现在|以来)/);
  if (sinceMatch) {
    return [parseInt(sinceMatch[1]), CURRENT_YEAR];
  }

  // "N1-N2年" "N1到N2年" "N1—N2年" "N1~N2年" "N1～N2年" (兼容全角～)
  const rangeMatch = text.match(/(\d{4})\s*[年]?\s*[-到—~～]\s*(\d{4})\s*年?/);
  if (rangeMatch) {
    return [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
  }

  // "N1、N2年" "N1和N2年"
  const listMatch = text.match(/(\d{4})\s*[、,和&]\s*(\d{4})/);
  if (listMatch) {
    const y1 = parseInt(listMatch[1]), y2 = parseInt(listMatch[2]);
    return [Math.min(y1, y2), Math.max(y1, y2)];
  }

  // 单独的 "N年"（解释为只看这一年）
  const singleMatch = text.match(/(\d{4})\s*年\s*(?:的|论文|发表)/);
  if (singleMatch) {
    const year = parseInt(singleMatch[1]);
    return [year, year];
  }

  // 匹配 2021-2026 这种纯数字范围（无中文，兼容全角～）
  const pureRange = text.match(/(\d{4})\s*[-—~～]\s*(\d{4})/);
  if (pureRange) {
    return [parseInt(pureRange[1]), parseInt(pureRange[2])];
  }

  return null;
}

// ── CCF 等级解析 ──────────────────────────────────────

function extractCCFLevel(text) {
  // "顶会" "顶级会议" "CCF-A" "A类" → A
  if (/顶[级会刊]|CCF\s*[-—~]?\s*A|A\s*类|A\s*级/.test(text)) return 'A';
  // "CCF-B" "B类" → B
  if (/CCF\s*[-—~]?\s*B|B\s*类|B\s*级|好[会的刊]/.test(text)) return 'B';
  // "CCF-C" "C类" → C
  if (/CCF\s*[-—~]?\s*C|C\s*类|C\s*级/.test(text)) return 'C';
  return null;
}

// ── 会议白名单提取 ─────────────────────────────────────

function extractVenuePatterns(text) {
  const upper = text.toUpperCase();

  // 仅匹配作为"词"出现的会议缩写（前后为边界/空格/标点），避免 "CHI" 匹配到 "machine"
  const found = KNOWN_VENUES.filter((v) => {
    const idx = upper.indexOf(v.toUpperCase());
    if (idx === -1) return false;
    // 检查前后是否为词边界
    const before = idx > 0 ? upper[idx - 1] : ' ';
    const after = idx + v.length < upper.length ? upper[idx + v.length] : ' ';
    return /[\s,、/，。！？]/.test(before) && /[\s,、/，。！？]/.test(after);
  });

  // 如果用户说了"只要XXX"、"仅限XXX"、"只要XXX和YYY"
  const exclusiveMatch = text.match(/(?:只要|仅限|只看|限定|只找)\s*([A-Za-z\s,、/]+?)(?:的|论文|，|。|$)/);
  if (exclusiveMatch) {
    const segment = exclusiveMatch[1].toUpperCase();
    const exclusiveVenues = KNOWN_VENUES.filter((v) => segment.includes(v.toUpperCase()));
    if (exclusiveVenues.length > 0) return exclusiveVenues;
    // 也尝试按 / , 、 分割提取
    const splitVenues = segment.split(/[/,、\s]+/).filter(Boolean);
    if (splitVenues.length > 0 && splitVenues[0].length >= 2) return splitVenues;
  }

  // 如果用户说了"XX优先"，提取但不设为 exclusive
  const preferMatch = text.match(/([A-Za-z\s,、/]+?)\s*(?:优先|为主)/);
  if (preferMatch) {
    const segment = preferMatch[1].toUpperCase();
    const preferVenues = KNOWN_VENUES.filter((v) => segment.includes(v.toUpperCase()));
    if (preferVenues.length > 0) return preferVenues;
  }

  return found.length > 0 ? found : [];
}

// ── 代码要求解析 ──────────────────────────────────────

function extractCodeRequirements(text) {
  const result = {
    require_open_source: false,
    min_stars: 0,
  };

  // 要求开源
  if (/必须.*代码|要.*开源|代码.*开源|开源.*代码|有.*[Gg]it[Hh]ub|开源.*优先|代码.*必须/.test(text)) {
    result.require_open_source = true;
  }
  if (/不用.*代码|不需要.*代码|没代码.*行|无需.*代码|不要求.*代码/.test(text)) {
    result.require_open_source = false;
  }

  // star 数（支持 >=, >, = 等运算符）
  const starMatch = text.match(/[Ss]tar\s*(?:>=?|≥)\s*(\d+)/);
  if (starMatch) {
    result.min_stars = parseInt(starMatch[1]);
  }
  const starChinese = text.match(/(\d+)\s*(?:星|个?\s*[Ss]tar)/);
  if (starChinese) {
    result.min_stars = parseInt(starChinese[1]);
  }
  // "至少N个star"
  const atLeastStar = text.match(/至少\s*(\d+)\s*(?:个?\s*)?[Ss星]tar/);
  if (atLeastStar) {
    result.min_stars = parseInt(atLeastStar[1]);
  }

  return result;
}

// ── 目标数量解析 ──────────────────────────────────────

function extractMaxPapers(text) {
  // "找N篇" "来N篇" "N篇左右" "top N" "N papers"
  const match = text.match(/(?:找|来|要|搜|爬|下载?)\s*(\d+)\s*篇/);
  if (match) return parseInt(match[1]);

  const topMatch = text.match(/[Tt]op\s*(\d+)/);
  if (topMatch) return parseInt(topMatch[1]);

  const numMatch = text.match(/(\d+)\s*篇\s*(?:论文|文章)/);
  if (numMatch) return parseInt(numMatch[1]);

  // "越多越好" "尽量多"
  if (/越多越好|尽量多|尽可能多|多多益善/.test(text)) return 20;

  return null;
}

// ── 技术模块提取 ──────────────────────────────────────

function extractModules(text) {
  const include = [];
  const exclude = [];

  // 遍历已知术语映射
  for (const [chinese, english] of Object.entries(TECH_TERM_MAP)) {
    // 排除模式: "不要XX" "排除XX" "别找XX"
    const excludeRegex = new RegExp(`(?:不要|排除|去掉|别[找要]|无需|免了?)\\s*${chinese}`);
    if (excludeRegex.test(text)) {
      exclude.push(english);
      continue;
    }

    // 包含模式: 术语前/后有明确的"需要/使用/侧重/在...中的应用"等引导词
    const includeRegex = new RegExp(
      `(?:要用|包含|需要|侧重|关注|做|涉及|用到|加入|引入|采用|使用|基于|结合|用到了|加了|在.{0,15}中的应用)\\s*${chinese}` +
      `|${chinese}\\s*(?:方向|方法|技术|模块|策略|手段|方案|模型|的应用|在.{0,15}中的应用)` +
      `|${chinese}.{0,5}在.{0,15}中的应用`
    );
    if (includeRegex.test(text)) {
      include.push(english);
      continue;
    }

    // 检查否定条件: 如果文本中出现了 "重点是"/"着重"/"聚焦" 等词，并且术语在附近出现
    const focusRegex = new RegExp(
      `(?:重点|着重|聚焦|专门|专注|集中)\\s*(?:是|在|于|做|研究)?\\s*(?:.{0,20}?${chinese}|${chinese}.{0,20}?)`
    );
    if (focusRegex.test(text)) {
      include.push(english);
    }
  }

  // 也提取英文术语（由 include/need/require/focus on/with 引导）
  const englishTerms = text.match(/(?:include|need|require|focus on|with)\s+([A-Za-z\s-]+?)(?:[,，.]|$)/gi);
  if (englishTerms) {
    for (const t of englishTerms) {
      const term = t.replace(/(?:include|need|require|focus on|with)\s+/i, '').trim().toLowerCase();
      if (term && term.length > 2 && !include.includes(term)) {
        include.push(term);
      }
    }
  }

  // 检测中英文混合的技术术语（如 "KV cache压缩" "LoRA微调"）
  // 寻找出现在中文上下文中的英文缩写/术语
  const mixedTerms = text.match(/(?:重点|关注|侧重|聚焦|要用|用到|使用|采用|做|涉及|方向)\s*([A-Za-z][A-Za-z\s-]{1,30}[A-Za-z])\s*(?:方向|方法|技术|模块|策略|压缩|优化|微调|训练|生成)/g);
  if (mixedTerms) {
    for (const m of mixedTerms) {
      const term = m.replace(/[^\x00-\x7F\s-]/g, '').trim().toLowerCase();
      if (term && term.length > 2 && !include.includes(term)) {
        include.push(term);
      }
    }
  }

  return { include: [...new Set(include)], exclude: [...new Set(exclude)] };
}

// ── 数据集提取 ────────────────────────────────────────

function extractDatasets(text) {
  const include = [];

  // 检查已知数据集名
  for (const ds of KNOWN_DATASETS) {
    if (text.includes(ds)) {
      include.push(ds);
    }
  }

  // "XX数据" "XX数据集" 模式
  const dsMatch = text.match(/(?:用|在|基于|采用|使用)\s*([A-Za-z0-9\-]+)\s*(?:数据|数据集|数据库)/g);
  if (dsMatch) {
    for (const m of dsMatch) {
      const name = m.replace(/(?:用|在|基于|采用|使用)\s*/, '').replace(/\s*(?:数据|数据集|数据库)/, '');
      if (name && !include.includes(name)) {
        include.push(name);
      }
    }
  }

  return { include: [...new Set(include)], exclude: [] };
}

// ── 关键词生成 ────────────────────────────────────────

/**
 * 从用户描述中生成 3-6 组英文搜索关键词
 */
function generateKeywords(text, modules, title) {
  const keywords = [];

  // 清理文本：去掉搜索指令词、筛选条件
  let cleaned = text
    .replace(/^帮我|^帮我找|^帮我搜|^帮我搜索|^帮找|^请帮我找/g, '')
    .replace(/找一下|搜索一下|检索一下/g, '')
    .replace(/的论文$|的论文[。！]?$|论文$/g, '')
    .replace(/近?\d+年(?:以内|以来|至今|以后)?/g, '')
    .replace(/顶[会级刊]|CCF[-—~]?[ABC]|[ABC]类会议/g, '')
    .replace(/必须|要[有求]|代码|开源|GitHub|[Ss]tar\s*[>≥]?\s*\d+|至少\d+星/g, '')
    .replace(/\d+篇|找\d+篇|来\d+篇/g, '')
    .replace(/，|。|！|？|、/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 将中文术语翻译为英文
  let translated = cleaned;
  for (const [ch, en] of Object.entries(TECH_TERM_MAP)) {
    translated = translated.replace(new RegExp(ch, 'g'), en);
  }

  // 如果翻译后还有有效内容，加入关键词
  if (translated.length > 3 && /[a-zA-Z]/.test(translated)) {
    keywords.push(translated.toLowerCase());
  }

  // 原始清理后的中文文本也加入（学术搜索引擎能处理混合语言）
  if (cleaned.length > 3 && cleaned !== translated) {
    keywords.push(cleaned.toLowerCase());
  }

  // 模块 + 主题组合关键词
  if (modules.length > 0 && translated.length > 3) {
    for (const mod of modules.slice(0, 4)) {
      // 取翻译文本的核心部分（前 60 字符）加模块
      const core = translated.split(' ').slice(0, 10).join(' ');
      if (core.length > 5) {
        keywords.push(`${core} ${mod.toLowerCase()}`);
      }
    }
  }

  // 去重、过滤过短、限制 6 组
  const unique = [...new Set(keywords)]
    .filter((k) => k.length >= 5)
    .slice(0, 6);

  // 如果依然空（翻译失败），回退到原始文本
  if (unique.length === 0) {
    const fallback = cleaned.replace(/[^a-zA-Z一-鿿\s-]/g, '').trim();
    if (fallback.length >= 3) {
      unique.push(fallback.toLowerCase());
    } else {
      unique.push('machine learning');
    }
  }

  return unique;
}

// ── 标题生成 ──────────────────────────────────────────

function generateTitle(text) {
  // 取逗号/句号前的第一段作为核心主题
  let cleaned = text.split(/[，,。！？、\n]/)[0].trim();

  // 去掉前缀
  cleaned = cleaned
    .replace(/^帮我找|^帮我搜|^帮我搜索|^请帮我找|^请帮我搜索|^请帮我|^帮我|^帮找|^帮搜|^搜索|^找|^请/g, '')
    .trim();

  // 去掉后缀
  cleaned = cleaned
    .replace(/的论文$|的论文[。！]?$|论文$/g, '')
    .replace(/方向$|领域$|方面$/g, '')
    .trim();

  return cleaned.length > 20 ? cleaned.slice(0, 20) : (cleaned || '论文搜索');
}

// ── 主解析函数 ────────────────────────────────────────

/**
 * 解析用户的自然语言搜索需求
 * @param {string} query - 用户的自然语言描述
 * @returns {{ title: string, parsed: object }}
 */
function parseQuery(query) {
  const text = query || '';

  const yearRange = extractYearRange(text);
  const ccfLevel = extractCCFLevel(text);
  const venuePatterns = extractVenuePatterns(text);
  const codeReq = extractCodeRequirements(text);
  const maxPapers = extractMaxPapers(text);
  const modules = extractModules(text);
  const datasets = extractDatasets(text);
  const title = generateTitle(text);
  const keywords = generateKeywords(text, modules.include, title);

  // 检测否定表述
  const allowArxivOnly = !/不要.*arxiv|不要.*预印本|必须.*发表|不能.*arxiv/i.test(text);

  const parsed = {};

  // search
  parsed.search = {};
  if (keywords.length > 0) parsed.search.keywords = keywords;
  if (yearRange) parsed.search.year_range = yearRange;
  if (maxPapers) parsed.search.max_papers = maxPapers;

  // venue
  if (ccfLevel || venuePatterns.length > 0 || !allowArxivOnly) {
    parsed.venue = {};
    if (ccfLevel) parsed.venue.min_ccf_level = ccfLevel;
    if (venuePatterns.length > 0) parsed.venue.include_patterns = venuePatterns;
    if (!allowArxivOnly) parsed.venue.allow_arxiv_only = false;
  }

  // modules
  if (modules.include.length > 0 || modules.exclude.length > 0) {
    parsed.modules = {};
    if (modules.include.length > 0) parsed.modules.include = modules.include;
    if (modules.exclude.length > 0) parsed.modules.exclude = modules.exclude;
  }

  // datasets
  if (datasets.include.length > 0 || datasets.exclude.length > 0) {
    parsed.datasets = {};
    if (datasets.include.length > 0) parsed.datasets.include = datasets.include;
    if (datasets.exclude.length > 0) parsed.datasets.exclude = datasets.exclude;
  }

  // code
  if (codeReq.require_open_source || codeReq.min_stars > 0) {
    parsed.code = {};
    if (codeReq.require_open_source) parsed.code.require_open_source = true;
    if (codeReq.min_stars > 0) parsed.code.min_stars = codeReq.min_stars;
  }

  return { title, parsed };
}

module.exports = { parseQuery, CURRENT_YEAR };
