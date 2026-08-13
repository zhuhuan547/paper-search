import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

/** POST /api/tasks — 创建搜索任务 */
export function createTask(query, configOverride = {}) {
  return api.post('/tasks', { query, config_override: configOverride });
}

/** GET /api/tasks — 获取任务列表 */
export function listTasks(statusFilter) {
  return api.get('/tasks', { params: statusFilter ? { status: statusFilter } : {} });
}

/** GET /api/tasks/:id — 获取任务详情 + 论文结果 */
export function getTask(taskId) {
  return api.get(`/tasks/${taskId}`);
}

/** DELETE /api/tasks/:id — 删除任务 */
export function deleteTask(taskId) {
  return api.delete(`/tasks/${taskId}`);
}

/** POST /api/tasks/:id/run — 手动触发执行 */
export function runTask(taskId) {
  return api.post(`/tasks/${taskId}/run`);
}

/** POST /api/tasks/:id/retry — 重试失败任务 */
export function retryTask(taskId) {
  return api.post(`/tasks/${taskId}/retry`);
}

/** POST /api/tasks/:id/stop — 停止正在执行的任务 */
export function stopTask(taskId) {
  return api.post(`/tasks/${taskId}/stop`);
}

/** GET /api/health — 健康检查 */
export function healthCheck() {
  return api.get('/health');
}

export default api;
