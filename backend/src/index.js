/**
 * 学术论文搜索系统 — Express 后端入口
 *
 * 启动后：
 *   - 提供 REST API（/api/tasks）
 *   - 自动启动后台队列消费者（每 5s 检查 pending 任务 → 调 paper-search）
 */

const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/tasks');
const queueConsumer = require('./services/queueConsumer');

// ── 配置 ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

// ── Express 应用 ─────────────────────────────────────
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, _res, next) => {
  console.log(`[api] ${req.method} ${req.url}`);
  next();
});

// ── 路由 ──────────────────────────────────────────────

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    consumer: queueConsumer.getStatus(),
  });
});

// 任务相关 API
app.use('/api/tasks', taskRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 全局错误处理
app.use((err, _req, res, _next) => {
  console.error('[api] unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

// ── 启动 ──────────────────────────────────────────────

app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║     📚 学术论文搜索系统 — Express 后端        ║
║                                              ║
║     API:  http://${HOST}:${PORT}              ║
║     健康: http://${HOST}:${PORT}/api/health   ║
║                                              ║
║     任务目录: ./tasks/                         ║
║     Config:  ./config.yaml                    ║
╚══════════════════════════════════════════════╝
`);

  // 启动后台队列消费者
  queueConsumer.start();
});

// ── 优雅退出 ──────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\n[server] 收到 SIGINT，正在关闭...');
  queueConsumer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[server] 收到 SIGTERM，正在关闭...');
  queueConsumer.stop();
  process.exit(0);
});
