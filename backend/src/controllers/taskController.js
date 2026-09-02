/**
 * 任务 API 控制器
 *
 * 处理 HTTP 请求 → 调 taskService → 返回 JSON 响应
 */

const taskService = require('../services/taskService');
const queueConsumer = require('../services/queueConsumer');
const fs = require('fs');
const path = require('path');

// ── POST /api/tasks ──────────────────────────────────

function createTask(req, res) {
  try {
    const { query, config_override } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: '缺少 query 字段',
        message: '请提供论文搜索需求的自然语言描述',
      });
    }

    const task = taskService.createTask(query.trim(), config_override || {});

    const pendingTasks = taskService.listTasks('pending');
    const queuePosition = pendingTasks.filter(
      (t) => t.priority <= task.priority && t.created_at <= task.created_at
    ).length;

    res.status(201).json({
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        original_query: task.original_query,
        config: task.config,
        created_at: task.created_at,
      },
      queue_position: queuePosition,
      consumer_status: queueConsumer.getStatus(),
    });
  } catch (err) {
    console.error('[api] createTask error:', err);
    res.status(500).json({ error: '创建任务失败', message: err.message });
  }
}

// ── POST /api/parse ──────────────────────────────────

function parseQuery(req, res) {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: '缺少 query 字段',
        message: '请提供论文搜索需求的自然语言描述',
      });
    }

    const preview = taskService.previewConfig(query.trim());
    res.json(preview);
  } catch (err) {
    console.error('[api] parseQuery error:', err);
    res.status(500).json({ error: '解析失败', message: err.message });
  }
}

// ── GET /api/tasks ───────────────────────────────────

function listTasks(req, res) {
  try {
    const { status } = req.query;
    const tasks = taskService.listTasks(status || null);

    res.json({
      tasks,
      total: tasks.length,
      consumer_status: queueConsumer.getStatus(),
    });
  } catch (err) {
    console.error('[api] listTasks error:', err);
    res.status(500).json({ error: '获取任务列表失败', message: err.message });
  }
}

// ── GET /api/tasks/:id ───────────────────────────────

function getTask(req, res) {
  try {
    const { id } = req.params;
    const result = taskService.getTask(id);

    if (!result) {
      return res.status(404).json({ error: '任务不存在', task_id: id });
    }

    // 附加消费者状态
    result.consumer_status = queueConsumer.getStatus();

    res.json(result);
  } catch (err) {
    console.error('[api] getTask error:', err);
    res.status(500).json({ error: '获取任务详情失败', message: err.message });
  }
}

// ── DELETE /api/tasks/:id ────────────────────────────

function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const success = taskService.deleteTask(id);

    if (!success) {
      return res.status(404).json({ error: '任务不存在', task_id: id });
    }

    res.json({ success: true, task_id: id });
  } catch (err) {
    console.error('[api] deleteTask error:', err);
    res.status(500).json({ error: '删除任务失败', message: err.message });
  }
}

// ── POST /api/tasks/:id/run ──────────────────────────

function runTask(req, res) {
  try {
    const { id } = req.params;
    const result = taskService.getTask(id);

    if (!result) {
      return res.status(404).json({ error: '任务不存在', task_id: id });
    }

    if (result.task.status === 'running') {
      return res.json({
        success: true,
        task_id: id,
        message: '任务正在由消费端执行中，无需重复启动',
        consumer_status: queueConsumer.getStatus(),
      });
    }

    // 重置为 pending 让消费者取走
    taskService.resetToPending(id);

    res.json({
      success: true,
      task_id: id,
      message: '任务已重新加入队列，消费者将自动执行',
      consumer_status: queueConsumer.getStatus(),
    });
  } catch (err) {
    console.error('[api] runTask error:', err);
    res.status(500).json({ error: '启动任务失败', message: err.message });
  }
}

// ── POST /api/tasks/:id/retry ────────────────────────

function retryTask(req, res) {
  try {
    const { id } = req.params;
    const result = taskService.getTask(id);

    if (!result) {
      return res.status(404).json({ error: '任务不存在', task_id: id });
    }

    if (result.task.status !== 'failed' && result.task.status !== 'stopped') {
      return res.status(400).json({
        error: '只有失败或已暂停的任务才能重试',
        current_status: result.task.status,
      });
    }

    taskService.resetToPending(id, { resume: true });

    res.json({
      success: true,
      task_id: id,
      message: '任务已重置，消费者将从断点恢复重试',
      consumer_status: queueConsumer.getStatus(),
    });
  } catch (err) {
    console.error('[api] retryTask error:', err);
    res.status(500).json({ error: '重试任务失败', message: err.message });
  }
}

// ── POST /api/tasks/:id/stop ──────────────────────────

function stopTask(req, res) {
  try {
    const { id } = req.params;
    const result = taskService.getTask(id);

    if (!result) {
      return res.status(404).json({ error: '任务不存在', task_id: id });
    }

    if (result.task.status !== 'running') {
      return res.json({
        success: false,
        task_id: id,
        message: `任务当前状态为 ${result.task.status}，无需停止`,
        consumer_status: queueConsumer.getStatus(),
      });
    }

    const consumerStatus = queueConsumer.getStatus();

    // 老模式：后端 spawn 了子进程，可直接 kill
    if (consumerStatus.currentTaskId === id) {
      const stopped = queueConsumer.stopCurrentTask();
      return res.json({
        success: stopped,
        task_id: id,
        message: stopped ? '任务已停止' : '未能停止任务（无可停止的进程）',
        consumer_status: consumerStatus,
      });
    }

    // 外部消费者模式：后端不 spawn 进程，无法直接 kill。
    // 改为写入 stop_requested 标记，由消费者（Claude 会话）在步骤间检测并中止。
    taskService.requestStop(id);

    res.json({
      success: true,
      task_id: id,
      message: '已请求停止，消费者将在当前步骤完成后停止该任务',
      consumer_status: consumerStatus,
    });
  } catch (err) {
    console.error('[api] stopTask error:', err);
    res.status(500).json({ error: '停止任务失败', message: err.message });
  }
}

// ── GET /api/tasks/:id/results.md ────────────────────
// ── GET /api/tasks/:id/results.csv ───────────────────
// ── GET /api/tasks/:id/references.bib ────────────────

function getResultFile(req, res) {
  try {
    const { id } = req.params;

    // 从 URL 路径判断文件类型
    let filename;
    let contentType;

    if (req.path.endsWith('/results.md')) {
      filename = 'results.md';
      contentType = 'text/markdown; charset=utf-8';
    } else if (req.path.endsWith('/results.csv')) {
      filename = 'results.csv';
      contentType = 'text/csv; charset=utf-8';
    } else if (req.path.endsWith('/references.bib')) {
      filename = 'references.bib';
      contentType = 'text/plain; charset=utf-8';
    } else {
      return res.status(400).json({ error: '不支持的文件类型' });
    }

    const filePath = path.join(taskService.TASKS_DIR, id, 'output', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: '文件不存在',
        task_id: id,
        file: filename,
      });
    }

    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (err) {
    console.error('[api] getResultFile error:', err);
    res.status(500).json({ error: '获取文件失败', message: err.message });
  }
}

module.exports = {
  createTask,
  parseQuery,
  listTasks,
  getTask,
  deleteTask,
  runTask,
  retryTask,
  getResultFile,
  stopTask,
};
