/**
 * 默认搜索配置（用户未提及时的 fallback）
 * 新任务在用户提供的条件基础上，未提及的字段取此默认值
 */
function getDefaultConfig() {
  return {
    search: {
      keywords: [],
      year_range: [2021, 2026],
      max_papers: 10,
      max_search_pages: 5,
      sources: ['semantic_scholar', 'dblp', 'arxiv'],
      expand_synonyms: true,
    },
    venue: {
      min_ccf_level: null,
      include_patterns: [],
      exclude_patterns: [],
      allow_arxiv_only: true,
    },
    modules: {
      include: [],
      exclude: [],
      match_mode: 'semantic',
    },
    datasets: {
      include: [],
      exclude: [],
    },
    code: {
      require_open_source: false,
      min_stars: 0,
      platforms: ['github', 'gitlab'],
      min_code_files: 1,
    },
    output: {
      formats: ['markdown', 'csv', 'bibtex'],
      path: null, // 由 taskService 在创建任务时设置
      include_reasoning: true,
    },
    cache: {
      enabled: true,
      path: './cache',
      ttl_hours: 168,
    },
  };
}

module.exports = { getDefaultConfig };
