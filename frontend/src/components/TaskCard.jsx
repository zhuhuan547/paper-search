import TaskStatusBadge from './TaskStatusBadge';

export default function TaskCard({ task, onView, onDelete, onRun }) {
  return (
    <div className="card task-card">
      <div className="task-card-main">
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-meta">
          {new Date(task.created_at).toLocaleString('zh-CN')}
          {task.result_summary?.papers_found > 0 && (
            <> · {task.result_summary.papers_found} 篇论文</>
          )}
          {task.error && (
            <> · <span style={{ color: 'var(--danger)' }}>{task.error.slice(0, 50)}</span></>
          )}
        </div>
      </div>
      <TaskStatusBadge status={task.status} />
      <div className="task-card-actions">
        {task.status === 'pending' && (
          <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); onRun(); }}>
            ▶ 执行
          </button>
        )}
        {task.status === 'failed' && (
          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onRun(); }}>
            🔄 重试
          </button>
        )}
        <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
          查看
        </button>
        <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          删除
        </button>
      </div>
    </div>
  );
}
