const STATUS_MAP = {
  pending: { label: '⏳ 待执行', className: 'status-pending' },
  running: { label: '🔄 搜索中', className: 'status-running' },
  completed: { label: '✅ 已完成', className: 'status-completed' },
  failed: { label: '❌ 失败', className: 'status-failed' },
  stopped: { label: '⏹ 已暂停', className: 'status-stopped' },
};

export default function TaskStatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, className: '' };
  return <span className={`status-badge ${s.className}`}>{s.label}</span>;
}
