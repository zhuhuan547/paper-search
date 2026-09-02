/**
 * 任务管理服务
 *
 * 管理 tasks/{task_id}/ 目录中的任务文件：
 *   meta.json      — 任务元数据（状态、时间戳、结果摘要）
 *   config.yaml    — 该任务专属搜索配置
 *   output/        — 搜索结果输出目录
 *
 * 使用文件系统作为持久化层（无需数据库）
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { generateTaskId } = require('../utils/idGenerator');
const { getDefaultConfig } = require('../utils/configTemplate');
const { parseQuery } = require('./parserService');

// ── 路径常量 ─────────────────────────────────────────

// 项目根目录 = backend/../
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const TASKS_DIR = path.join(PROJECT_ROOT, 'tasks');

// 确保 tasks 目录存在
function ensureTasksDir() {
  if (!fs.existsSync(TASKS_DIR)) {
    fs.mkdirSync(TASKS_DIR, { recursive: true });
  }
}

// ── 配置合并 ─────────────────────────────────────────

/**
 * 深度合并两个对象
 * override 中的值覆盖 base 中的值（嵌套对象递归合并）
 */
function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      override[key] &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      base[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

// ── 解析预览 ─────────────────────────────────────────

/**
 * 仅解析自然语言，返回结构化配置预览（不创建任务）
 * 供前端实时展示「我理解你要找什么」，高级选项以解析值为基准
 * @param {string} query - 用户的自然语言查询
 * @returns {{ title: string, parsed: object, merged: object }}
 */
function previewConfig(query) {
  const { title, parsed } = parseQuery(query);
  const defaults = getDefaultConfig();
  const merged = deepMerge(deepMerge(defaults, parsed), {});
  return { title, parsed, merged };
}

// ── 任务 CRUD ────────────────────────────────────────

/**
 * 创建一个新任务
 * @param {string} query - 用户的自然语言查询
 * @param {object} configOverride - 前端高级选项覆盖（可选）
 * @returns {object} 创建的任务对象
 */
function createTask(query, configOverride = {}) {
  ensureTasksDir();

  // 1. 解析自然语言
  const { title, parsed } = parseQuery(query);

  // 2. 合并配置：默认值 → 自然语言解析结果 → 前端高级选项
  const defaults = getDefaultConfig();
  const merged = deepMerge(deepMerge(defaults, parsed), configOverride);

  // 3. 生成任务 ID 和目录
  const taskId = generateTaskId();
  const taskDir = path.join(TASKS_DIR, taskId);
  const outputDir = path.join(taskDir, 'output');
  fs.mkdirSync(taskDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  // 4. 设置输出路径
  merged.output.path = outputDir;

  // 5. 写入 meta.json
  const now = new Date().toISOString();
  const meta = {
    id: taskId,
    title,
    status: 'pending',
    priority: 1,
    config: merged,
    original_query: query,
    config_override: configOverride,
    created_at: now,
    started_at: null,
    completed_at: null,
    result_summary: null,
    error: null,
  };
  writeMeta(taskId, meta);

  // 6. 写入 config.yaml
  writeConfig(taskId, merged);

  return meta;
}

/**
 * 获取所有任务（按创建时间倒序）
 * @param {string} statusFilter - 可选的状态筛选
 * @returns {object[]} 任务列表（不含 config 详情，轻量）
 */
function listTasks(statusFilter = null) {
  ensureTasksDir();

  const tasks = [];
  const entries = fs.readdirSync(TASKS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const meta = readMeta(entry.name);
    if (!meta) continue;
    if (statusFilter && meta.status !== statusFilter) continue;
    // 返回轻量版（不含完整 config，列表页不需要）
    tasks.push({
      id: meta.id,
      title: meta.title,
      status: meta.status,
      priority: meta.priority,
      created_at: meta.created_at,
      completed_at: meta.completed_at,
      result_summary: meta.result_summary,
      error: meta.error,
    });
  }

  tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return tasks;
}

/**
 * 获取单个任务详情
 * @param {string} taskId
 * @returns {object|null} 完整任务对象，含论文数据（如果已完成）
 */
function getTask(taskId) {
  const meta = readMeta(taskId);
  if (!meta) return null;

  const result = {
    task: {
      id: meta.id,
      title: meta.title,
      status: meta.status,
      priority: meta.priority,
      created_at: meta.created_at,
      started_at: meta.started_at,
      completed_at: meta.completed_at,
      result_summary: meta.result_summary,
      error: meta.error,
      original_query: meta.original_query,
      config: meta.config,
    },
    papers: [],
    output_files: null,
    progress: readProgress(taskId),
    state: readState(taskId),
  };

  // 如果已完成，读取论文数据
  if (meta.status === 'completed') {
    const paperAnalysisPath = path.join(TASKS_DIR, taskId, 'output', 'paper_analysis.json');
    const resultsMdPath = path.join(TASKS_DIR, taskId, 'output', 'results.md');

    // 1. 优先从 paper_analysis.json 解析
    if (fs.existsSync(paperAnalysisPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(paperAnalysisPath, 'utf-8'));
        result.papers = Array.isArray(raw) ? raw : (raw.papers || []);
      } catch {
        result.papers = [];
      }
    }

    // 2. 回退到 results.md 解析（paper-search 直接输出）
    if (result.papers.length === 0 && fs.existsSync(resultsMdPath)) {
      try {
        result.papers = parsePapersFromMarkdown(fs.readFileSync(resultsMdPath, 'utf-8'));
      } catch {
        result.papers = [];
      }
    }

    // 输出文件 URL
    const outputDir = path.join(TASKS_DIR, taskId, 'output');
    result.output_files = {
      markdown: fs.existsSync(path.join(outputDir, 'results.md'))
        ? `/api/tasks/${taskId}/results.md` : null,
      csv: fs.existsSync(path.join(outputDir, 'results.csv'))
        ? `/api/tasks/${taskId}/results.csv` : null,
      bibtex: fs.existsSync(path.join(outputDir, 'references.bib'))
        ? `/api/tasks/${taskId}/references.bib` : null,
    };
  }

  return result;
}

/**
 * 删除任务及其目录
 * @param {string} taskId
 * @returns {boolean} 是否成功
 */
function deleteTask(taskId) {
  const taskDir = path.join(TASKS_DIR, taskId);
  if (!fs.existsSync(taskDir)) return false;
  fs.rmSync(taskDir, { recursive: true, force: true });
  return true;
}

/**
 * 获取下一个待执行的任务（priority 升序，created_at 升序）
 * @returns {object|null} meta 对象，无 pending 任务时返回 null
 */
function getNextPendingTask() {
  ensureTasksDir();

  let best = null;
  const entries = fs.readdirSync(TASKS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const meta = readMeta(entry.name);
    if (!meta || meta.status !== 'pending') continue;

    if (!best) {
      best = meta;
      continue;
    }

    // priority 小的优先；同 priority 按 created_at 早的优先
    if (meta.priority < best.priority) {
      best = meta;
    } else if (meta.priority === best.priority && meta.created_at < best.created_at) {
      best = meta;
    }
  }

  return best;
}

/**
 * 检查是否有正在运行中的任务
 */
function hasRunningTask() {
  ensureTasksDir();
  const entries = fs.readdirSync(TASKS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const meta = readMeta(entry.name);
    if (meta && meta.status === 'running') return true;
  }
  return false;
}

// ── 状态更新 ─────────────────────────────────────────

function markRunning(taskId) {
  updateMeta(taskId, {
    status: 'running',
    started_at: new Date().toISOString(),
    error: null,
  });
}

function markCompleted(taskId, resultSummary) {
  updateMeta(taskId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    result_summary: resultSummary,
    error: null,
    stop_requested: false,
  });
}

function markFailed(taskId, errorMessage) {
  updateMeta(taskId, {
    status: 'failed',
    completed_at: new Date().toISOString(),
    error: errorMessage,
    stop_requested: false,
  });
}

function markStopped(taskId) {
  updateMeta(taskId, {
    status: 'stopped',
    completed_at: new Date().toISOString(),
    error: '用户手动停止',
    stop_requested: false,
  });
}

/**
 * 请求停止任务：写入 stop_requested 标记，由外部消费者在步骤间检测并中止。
 * 外部消费者模式下后端不 spawn 进程，无法直接 kill，只能通过该标记协作停止。
 */
function requestStop(taskId) {
  return updateMeta(taskId, { stop_requested: true });
}

/**
 * 检查任务是否被请求停止（供外部消费者在步骤间调用）
 */
function isStopRequested(taskId) {
  const meta = readMeta(taskId);
  return !!(meta && meta.stop_requested);
}

/**
 * 将任务重置为 pending（用于手动重试）
 */
function resetToPending(taskId, opts = {}) {
  updateMeta(taskId, {
    status: 'pending',
    started_at: null,
    completed_at: null,
    error: null,
    result_summary: null,
    stop_requested: false,
  });
  // resume=true 时保留 state.json 与进度日志，供断点续跑；否则全新开始。
  if (!opts.resume) {
    clearProgress(taskId);
    clearState(taskId);
  }
}

// ── 底层文件操作 ─────────────────────────────────────

function metaPath(taskId) {
  return path.join(TASKS_DIR, taskId, 'meta.json');
}

function configPath(taskId) {
  return path.join(TASKS_DIR, taskId, 'config.yaml');
}

function readMeta(taskId) {
  const p = metaPath(taskId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function writeMeta(taskId, meta) {
  fs.writeFileSync(metaPath(taskId), JSON.stringify(meta, null, 2), 'utf-8');
}

/**
 * 读取任务的实时进度日志（tasks/{taskId}/progress.log）
 * 由外部消费者（Claude 会话）在搜索过程中逐步追加，每行一条进度
 * @returns {string[]} 进度行数组（最新在末尾）
 */
function readProgress(taskId) {
  const p = progressPath(taskId);
  if (!fs.existsSync(p)) return [];
  try {
    const content = fs.readFileSync(p, 'utf-8').replace(/^﻿/, '');
    return content.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim().length > 0);
  } catch {
    return [];
  }
}

/**
 * 清空任务进度日志（重置/重新执行时调用）
 */
function clearProgress(taskId) {
  try {
    fs.writeFileSync(progressPath(taskId), '', 'utf-8');
  } catch { /* ignore */ }
}

/**
 * 读取任务状态文件（tasks/{taskId}/state.json），供断点恢复。
 * 由协调者（当前 Claude Code 会话）在搜索过程中写入；缺失/损坏返回 null。
 * 剥 BOM 后再 parse，避免 Python utf-8-sig 等写入带 BOM 导致的解析失败。
 */
function readState(taskId) {
  const p = statePath(taskId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8').replace(/^﻿/, ''));
  } catch {
    return null;
  }
}

/**
 * 原子写入状态文件（临时文件 + rename，UTF-8 无 BOM）。
 * 单写者约定：只有协调者（或本函数调用方）会写 state.json，避免并发覆盖。
 */
function writeState(taskId, state) {
  const p = statePath(taskId);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmp, p);
}

/**
 * 删除状态文件（重新执行/放弃断点时调用）。
 */
function clearState(taskId) {
  const p = statePath(taskId);
  if (fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch { /* ignore */ }
  }
}

function progressPath(taskId) {
  return path.join(TASKS_DIR, taskId, 'progress.log');
}

function statePath(taskId) {
  return path.join(TASKS_DIR, taskId, 'state.json');
}

function updateMeta(taskId, partial) {
  const meta = readMeta(taskId);
  if (!meta) throw new Error(`Task not found: ${taskId}`);
  Object.assign(meta, partial);
  writeMeta(taskId, meta);
  return meta;
}

function readConfig(taskId) {
  const p = configPath(taskId);
  if (!fs.existsSync(p)) return null;
  try {
    return yaml.load(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function writeConfig(taskId, config) {
  fs.writeFileSync(configPath(taskId), yaml.dump(config, { noRefs: true }), 'utf-8');
}

/**
 * 将任务 config 写入项目根目录 config.yaml（供 paper-search 使用）
 * 同时备份旧 config
 */
function activateConfig(taskId) {
  const rootConfig = path.join(PROJECT_ROOT, 'config.yaml');
  const backupPath = path.join(PROJECT_ROOT, 'config.backup.yaml');

  // 备份当前 config
  if (fs.existsSync(rootConfig)) {
    fs.copyFileSync(rootConfig, backupPath);
  }

  // 写入任务 config
  const taskConfig = readConfig(taskId);
  if (!taskConfig) throw new Error(`Config not found for task: ${taskId}`);
  taskConfig.output.path = path.join(TASKS_DIR, taskId, 'output');
  writeConfig(taskId, taskConfig);
  fs.writeFileSync(rootConfig, yaml.dump(taskConfig, { noRefs: true }), 'utf-8');

  return backupPath;
}

/**
 * 恢复备份的 config.yaml
 */
function restoreConfig(backupPath) {
  const rootConfig = path.join(PROJECT_ROOT, 'config.yaml');
  if (backupPath && fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, rootConfig);
    fs.unlinkSync(backupPath);
  }
}

/**
 * 从 results.md 解析论文数据
 * paper-search 直接输出 Markdown，没有 paper_analysis.json 时回退到此解析器
 */
function parsePapersFromMarkdown(mdContent) {
  const papers = [];

  // 按 ### #N 分割每篇论文
  const blocks = mdContent.split(/^### #\d+ —/gm);
  // 重新提取标题（split 会丢失分隔符）
  const headerRegex = /^### (#\d+) — (.+)$/gm;
  const headers = [];
  let m;
  while ((m = headerRegex.exec(mdContent)) !== null) {
    headers.push({ rank: m[1], title: m[2].trim() });
  }

  // blocks[0] 是论文列表之前的内容（搜索摘要等），跳过
  for (let i = 1; i < blocks.length && i <= headers.length; i++) {
    const block = blocks[i];
    const header = headers[i - 1];
    const paper = { title: header.title, rank: header.rank };

    // 解析属性表格行
    const tableRow = (label) => {
      const regex = new RegExp(`\\|\\s*\\*\\*${label}\\*\\*\\s*\\|(.+?)\\|`, 'm');
      const match = block.match(regex);
      return match ? match[1].trim() : null;
    };

    const authors = tableRow('作者');
    if (authors) paper.authors = authors;

    // 发表时间: 可能包含年份和会议
    const pubTime = tableRow('发表时间');
    if (pubTime) {
      const yearMatch = pubTime.match(/(\d{4})/);
      if (yearMatch) paper.year = parseInt(yearMatch[1]);
      const venueMatch = pubTime.match(/\((.+?)\)/);
      if (venueMatch) paper.venue = venueMatch[1];
      else paper.venue = pubTime;
    }

    // arXiv
    const arxiv = tableRow('arXiv');
    if (arxiv) {
      paper.arxiv_id = arxiv.replace(/\[(.+?)\].*/, '$1');
      const linkMatch = arxiv.match(/$$([^$$]+)$$/);
      if (linkMatch) paper.arxiv_url = linkMatch[1];
    }

    // 引用数
    const citations = tableRow('引用数');
    if (citations) {
      const citeMatch = citations.match(/(\d+)/);
      if (citeMatch) paper.citations = parseInt(citeMatch[1]);
    }

    // 仓库
    const repo = tableRow('仓库');
    if (repo) {
      const linkMatch = repo.match(/$$([^$$]+)$$$$([^$$]+)$$/);
      if (linkMatch) {
        paper.repo_url = linkMatch[1];
        paper.repo_name = linkMatch[2];
      }
      const starsMatch = repo.match(/[⭐🌟]\s*(\d+)/);
      if (starsMatch) paper.stars = parseInt(starsMatch[1]);
      paper.has_code = true;
    } else {
      paper.has_code = false;
    }

    // 综合评分: star count → score
    const score = tableRow('综合评分');
    if (score) {
      const starCount = (score.match(/[⭐🌟]/g) || []).length;
      paper.score = starCount;
    }

    // 摘要
    const abstractMatch = block.match(/\*\*摘要\*\*[：:]\s*(.+?)(?:\n\n|\n\*\*|$)/s);
    if (abstractMatch) paper.abstract = abstractMatch[1].trim();

    // 技术模块
    const modulesMatch = block.match(/\*\*技术模块\*\*[：:]\s*(.+?)(?:\n|$)/);
    if (modulesMatch) paper.tech_modules = modulesMatch[1].trim();

    papers.push(paper);
  }

  return papers;
}

/**
 * 从结果输出中提取摘要信息
 */
function extractResultSummary(taskId) {
  const outputDir = path.join(TASKS_DIR, taskId, 'output');
  const paperAnalysisPath = path.join(outputDir, 'paper_analysis.json');
  const resultsMdPath = path.join(outputDir, 'results.md');
  const resultsCsvPath = path.join(outputDir, 'results.csv');

  let papersFound = 0;

  // 1. 优先从 paper_analysis.json 解析
  if (fs.existsSync(paperAnalysisPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(paperAnalysisPath, 'utf-8'));
      const papers = Array.isArray(raw) ? raw : (raw.papers || []);
      papersFound = papers.length;
    } catch { /* ignore */ }
  }

  // 2. 回退到 results.md 统计（paper-search 直接生成的结果）
  if (papersFound === 0 && fs.existsSync(resultsMdPath)) {
    try {
      const mdContent = fs.readFileSync(resultsMdPath, 'utf-8');
      // 论文标题格式: ### #N — Title
      const paperMatches = mdContent.match(/^### #\d+ —/gm);
      papersFound = paperMatches ? paperMatches.length : 0;
    } catch { /* ignore */ }
  }

  // 3. 回退到 results.csv 统计
  if (papersFound === 0 && fs.existsSync(resultsCsvPath)) {
    try {
      const csvContent = fs.readFileSync(resultsCsvPath, 'utf-8');
      // CSV 标题行 + 数据行, 减 1 得到论文数
      const lines = csvContent.trim().split('\n').filter((l) => l.trim());
      papersFound = Math.max(0, lines.length - 1);
    } catch { /* ignore */ }
  }

  return {
    papers_found: papersFound,
    output_files: {
      markdown: fs.existsSync(resultsMdPath) ? 'results.md' : null,
      csv: fs.existsSync(resultsCsvPath) ? 'results.csv' : null,
      bibtex: fs.existsSync(path.join(outputDir, 'references.bib')) ? 'references.bib' : null,
    },
  };
}

module.exports = {
  createTask,
  listTasks,
  getTask,
  deleteTask,
  getNextPendingTask,
  hasRunningTask,
  markRunning,
  markCompleted,
  markFailed,
  markStopped,
  requestStop,
  isStopRequested,
  resetToPending,
  activateConfig,
  restoreConfig,
  extractResultSummary,
  previewConfig,
  readProgress,
  clearProgress,
  readState,
  writeState,
  clearState,
  TASKS_DIR,
  PROJECT_ROOT,
};
