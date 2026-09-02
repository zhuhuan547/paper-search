/**
 * /api/tasks 路由
 */

const { Router } = require('express');
const ctrl = require('../controllers/taskController');

const router = Router();

// POST /api/tasks — 创建搜索任务
router.post('/', ctrl.createTask);

// POST /api/tasks/parse — 解析自然语言，返回配置预览（不创建任务）
router.post('/parse', ctrl.parseQuery);

// GET /api/tasks — 列出所有任务
router.get('/', ctrl.listTasks);

// GET /api/tasks/:id — 获取任务详情 + 论文结果
router.get('/:id', ctrl.getTask);

// DELETE /api/tasks/:id — 删除任务
router.delete('/:id', ctrl.deleteTask);

// POST /api/tasks/:id/run — 手动触发执行
router.post('/:id/run', ctrl.runTask);

// POST /api/tasks/:id/retry — 重试失败任务
router.post('/:id/retry', ctrl.retryTask);

// POST /api/tasks/:id/stop — 停止正在执行的任务
router.post('/:id/stop', ctrl.stopTask);

// GET /api/tasks/:id/results.md — 获取原始输出文件
router.get('/:id/results.md', ctrl.getResultFile);
router.get('/:id/results.csv', ctrl.getResultFile);
router.get('/:id/references.bib', ctrl.getResultFile);

module.exports = router;
