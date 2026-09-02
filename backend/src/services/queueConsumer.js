/**
 * 队列消费者 — 后台自动消费 queue.json / tasks/ 中的待执行任务
 *
 * 启动后每 5 秒检查一次：
 *   1. 是否有正在运行的任务 → 有则跳过
 *   2. 取优先级最高的 pending 任务
 *   3. 激活其 config → 调 paper-search → 标记完成/失败
 *
 * paper-search 通过 spawn Claude Code CLI 子进程执行
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const taskService = require('./taskService');

// ── 配置 ────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;  // 轮询间隔: 5 秒
const SEARCH_TIMEOUT_MS = 30 * 60 * 1000; // 单次搜索超时: 30 分钟
const MAX_RETRIES = 1;            // 最大自动重试次数

// ── 状态 ────────────────────────────────────────────

let intervalId = null;
let isRunning = false;   // 消费者是否激活
let currentTaskId = null; // 当前正在执行的任务 ID（用于外部查询进度）
let currentChildProcess = null; // 当前 spawn 子进程引用（用于停止任务）

// ── 公开 API ────────────────────────────────────────

/**
 * 启动队列消费者
 */
function start() {
  if (isRunning) return;
  // 外部消费者模式：由当前 Claude Code 会话接管队列消费，后端仅提供 API，不自动 spawn 任务
  if (process.env.EXTERNAL_CONSUMER === '1') {
    console.log('[queue-consumer] 外部消费者模式：由 Claude Code 会话接管队列，后端不自动执行任务');
    return;
  }
  isRunning = true;
  console.log('[queue-consumer] 队列消费者已启动，轮询间隔:', POLL_INTERVAL_MS / 1000, 's');
  // 立即执行一次
  tick();
  intervalId = setInterval(tick, POLL_INTERVAL_MS);
}

/**
 * 停止队列消费者
 */
function stop() {
  if (!isRunning) return;
  isRunning = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  console.log('[queue-consumer] 队列消费者已停止');
}

/**
 * 获取当前执行状态（供外部查询，如前端展示进度）
 */
function getStatus() {
  return {
    isRunning,
    currentTaskId,
    nextPollIn: POLL_INTERVAL_MS,
  };
}

/**
 * 立即停止当前正在执行的任务
 * 杀掉子进程，executeTask 会检测到并标记 stopped 状态
 */
function stopCurrentTask() {
  if (!currentChildProcess || !currentTaskId) return false;

  console.log(`[queue-consumer] ⏹ 用户请求停止任务: ${currentTaskId}`);

  // 先保存引用
  const child = currentChildProcess;

  // 杀掉子进程（及它的子进程树）
  try {
    if (process.platform === 'win32') {
      // Windows: 需要 /t 参数杀掉整个进程树
      spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t']);
    } else {
      child.kill('SIGTERM');
    }
  } catch (err) {
    console.error('[queue-consumer] 停止进程失败:', err.message);
  }

  return true;
}

// ── 内部逻辑 ────────────────────────────────────────

async function tick() {
  // 1. 如果有任务正在执行，跳过
  if (taskService.hasRunningTask()) return;

  // 2. 取出下一个 pending 任务
  const task = taskService.getNextPendingTask();
  if (!task) return; // 队列空闲

  currentTaskId = task.id;

  try {
    await executeTask(task);
  } catch (err) {
    console.error(`[queue-consumer] 任务 ${task.id} 执行失败:`, err.message);
  } finally {
    currentTaskId = null;
  }
}

/**
 * 执行单个任务:
 *   标记 running → 激活 config → spawn paper-search → 检查结果 → 标记完成
 */
async function executeTask(task) {
  console.log(`[queue-consumer] 开始执行任务: ${task.id} — "${task.title}"`);

  // 1. 标记 running
  taskService.markRunning(task.id);

  // 2. 激活该任务的 config.yaml（覆盖根目录 config.yaml）
  let backupPath = null;
  try {
    backupPath = taskService.activateConfig(task.id);
  } catch (err) {
    taskService.markFailed(task.id, `无法写入 config.yaml: ${err.message}`);
    return;
  }

  // 3. 执行 paper-search
  let success = false;
  let errorMsg = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`[queue-consumer] 重试任务 ${task.id} (第 ${attempt} 次)`);
    }

    try {
      await runPaperSearch();
      success = true;
      break;
    } catch (err) {
      errorMsg = err.message;
      console.error(`[queue-consumer] paper-search 失败 (attempt ${attempt + 1}):`, errorMsg);
    }
  }

  // 4. 恢复 config.yaml
  if (backupPath) {
    try {
      taskService.restoreConfig(backupPath);
    } catch (err) {
      console.error('[queue-consumer] 恢复 config.yaml 失败:', err.message);
    }
  }

  // 5. 更新任务状态
  if (success) {
    // 验证输出文件
    const outputDir = path.join(taskService.TASKS_DIR, task.id, 'output');
    const resultsMd = path.join(outputDir, 'results.md');
    const paperAnalysis = path.join(outputDir, 'paper_analysis.json');

    if (fs.existsSync(resultsMd) || fs.existsSync(paperAnalysis)) {
      const summary = taskService.extractResultSummary(task.id);
      taskService.markCompleted(task.id, summary);
      console.log(`[queue-consumer] ✅ 任务 ${task.id} 完成，找到 ${summary.papers_found} 篇论文`);
    } else {
      taskService.markFailed(task.id, 'paper-search 执行完毕但未生成输出文件');
      console.log(`[queue-consumer] ❌ 任务 ${task.id} 完成但无输出文件`);
    }
  } else if (errorMsg === '任务已被用户停止') {
    taskService.markStopped(task.id);
    console.log(`[queue-consumer] ⏹ 任务 ${task.id} 已被用户停止`);
  } else {
    taskService.markFailed(task.id, errorMsg || 'paper-search 执行失败');
    console.log(`[queue-consumer] ❌ 任务 ${task.id} 最终失败: ${errorMsg}`);
  }
}

/**
 * 启动 Claude Code CLI 执行 paper-search
 * 通过 stdin 传递 prompt（避免命令行参数在 Windows shell 中被错误转义）
 */
function runPaperSearch() {
  return new Promise((resolve, reject) => {
    // 读取 paper-search skill 文件
    const skillPath = path.join(taskService.PROJECT_ROOT, '.claude', 'skills', 'paper-search.md');
    let prompt;
    try {
      let skillContent = fs.readFileSync(skillPath, 'utf-8');
      // 剥离 YAML frontmatter（--- ... ---），其内容仅给 skill 系统用
      skillContent = skillContent.replace(/^---[\s\S]*?---\s*\n/, '');
      prompt = `${skillContent}\n\n请严格按照以上指令，读取项目根目录的 config.yaml，执行完整的学术论文搜索流水线（Step 1 ~ Step 7）。`;
    } catch (err) {
      reject(new Error(`无法读取 paper-search skill 文件: ${err.message}`));
      return;
    }

    // stdin 模式：claude -p 从标准输入读取 prompt
    // --dangerously-skip-permissions: headless 模式下绕过权限审批，允许所有工具自动执行
    const child = spawn('claude', ['-p', '--dangerously-skip-permissions'], {
      cwd: taskService.PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: SEARCH_TIMEOUT_MS,
      shell: true, // Windows 需要 shell 来解析 PATH
      env: { ...process.env },
    });

    // 存储子进程引用，供 stopCurrentTask() 使用
    currentChildProcess = child;

    // 将 prompt 写入 stdin 后关闭
    child.stdin.write(prompt);
    child.stdin.end();

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // 打印到控制台（方便调试）
      process.stdout.write(`[paper-search] ${text}`);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(`[paper-search:err] ${text}`);
    });

    child.on('close', (code, signal) => {
      currentChildProcess = null;

      // 被用户手动停止（taskkill 发出 SIGKILL/退出码 1）
      if (signal === 'SIGTERM' || signal === 'SIGKILL' || (code !== 0 && code !== null && !stdout)) {
        reject(new Error('任务已被用户停止'));
        return;
      }

      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(
          `claude 进程退出码 ${code}${stderr ? ': ' + stderr.slice(-500) : ''}`
        ));
      }
    });

    child.on('error', (err) => {
      currentChildProcess = null;
      reject(new Error(`无法启动 claude CLI: ${err.message}`));
    });
  });
}

module.exports = { start, stop, getStatus, stopCurrentTask };
