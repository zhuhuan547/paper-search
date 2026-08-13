import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import { listTasks, deleteTask, runTask } from '../api/client';

export default function TaskListPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await listTasks(statusFilter || null);
      setTasks(res.data.tasks);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [statusFilter]);

  const handleDelete = async (taskId) => {
    if (!confirm('确定删除该任务及其所有结果？')) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRun = async (taskId) => {
    try {
      await runTask(taskId);
      fetchTasks(); // 刷新
    } catch (err) {
      alert('启动失败: ' + (err.response?.data?.message || err.message));
    }
  };

  // 自动刷新（每 5s）
  useEffect(() => {
    const timer = setInterval(fetchTasks, 5000);
    return () => clearInterval(timer);
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner" />
        <span>加载中...</span>
      </div>
    );
  }

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    running: tasks.filter((t) => t.status === 'running').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    stopped: tasks.filter((t) => t.status === 'stopped').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>📋 任务列表</h2>
        <Link to="/" className="btn btn-primary">+ 新建搜索</Link>
      </div>

      <div className="stat-bar">
        <span>全部: <strong>{stats.total}</strong></span>
        <span>待执行: <strong>{stats.pending}</strong></span>
        {stats.running > 0 && <span>执行中: <strong style={{ color: 'var(--primary)' }}>{stats.running}</strong></span>}
        <span>已完成: <strong>{stats.completed}</strong></span>
        {stats.failed > 0 && <span style={{ color: 'var(--danger)' }}>失败: <strong>{stats.failed}</strong></span>}
        {stats.stopped > 0 && <span style={{ color: 'var(--gray-500)' }}>已暂停: <strong>{stats.stopped}</strong></span>}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['', 'pending', 'running', 'completed', 'failed', 'stopped'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || '全部'}
          </button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          ❌ {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>{statusFilter ? `没有 ${statusFilter} 状态的任务` : '还没有搜索任务'}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>创建第一个搜索</Link>
        </div>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onView={() => navigate(`/tasks/${task.id}`)}
            onDelete={() => handleDelete(task.id)}
            onRun={() => handleRun(task.id)}
          />
        ))
      )}
    </div>
  );
}
