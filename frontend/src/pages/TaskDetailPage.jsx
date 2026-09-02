import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTask, runTask, retryTask, stopTask } from '../api/client';
import TaskStatusBadge from '../components/TaskStatusBadge';
import PaperSummaryTable from '../components/PaperSummaryTable';
import MarkdownViewer from '../components/MarkdownViewer';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressLog from '../components/ProgressLog';

const TABS = [
  { key: 'summary', label: '📊 汇总' },
  { key: 'detail', label: '📄 详细报告' },
  { key: 'csv', label: '📋 CSV' },
  { key: 'bibtex', label: '📚 BibTeX' },
];

export default function TaskDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [csvContent, setCsvContent] = useState('');
  const [bibContent, setBibContent] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      const res = await getTask(id);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // pending（等消费者接走）或 running 时每 3 秒轮询，自动刷新状态，无需手动刷新
  useEffect(() => {
    if (!data || !['pending', 'running'].includes(data.task.status)) return;
    const timer = setInterval(fetchTask, 3000);
    return () => clearInterval(timer);
  }, [data?.task?.status, fetchTask]);

  // 加载 CSV/BibTeX 内容
  useEffect(() => {
    if (!data?.output_files) return;
    if (activeTab === 'csv' && data.output_files.csv && !csvContent) {
      fetch(data.output_files.csv)
        .then((r) => r.text())
        .then(setCsvContent)
        .catch(() => setCsvContent('加载失败'));
    }
    if (activeTab === 'bibtex' && data.output_files.bibtex && !bibContent) {
      fetch(data.output_files.bibtex)
        .then((r) => r.text())
        .then(setBibContent)
        .catch(() => setBibContent('加载失败'));
    }
  }, [activeTab, data?.output_files, csvContent, bibContent]);

  const handleRun = async () => {
    setActionLoading(true);
    try {
      await runTask(id);
      await fetchTask();
    } catch (err) {
      alert('启动失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async () => {
    setActionLoading(true);
    try {
      await retryTask(id);
      await fetchTask();
    } catch (err) {
      alert('重试失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!confirm('确定要暂停当前搜索吗？已完成的结果将保留。')) return;
    setActionLoading(true);
    try {
      const res = await stopTask(id);
      alert(res.data.message || '已停止');
      await fetchTask();
    } catch (err) {
      alert('暂停失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="加载任务..." />;
  if (error || !data) {
    return (
      <div className="empty-state">
        <div className="icon">❌</div>
        <p>{error || '任务不存在'}</p>
        <Link to="/tasks" className="btn btn-outline" style={{ marginTop: 16 }}>返回任务列表</Link>
      </div>
    );
  }

  const { task, papers, output_files } = data;
  const progress = data.progress || [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/tasks" style={{ fontSize: 13 }}>← 返回任务列表</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <h2 className="page-title" style={{ marginBottom: 0, flex: 1 }}>{task.title}</h2>
          <TaskStatusBadge status={task.status} />
        </div>
        <div className="stat-bar" style={{ marginTop: 8, marginBottom: 0 }}>
          <span>创建: {new Date(task.created_at).toLocaleString('zh-CN')}</span>
          {task.started_at && <span>开始: {new Date(task.started_at).toLocaleString('zh-CN')}</span>}
          {task.completed_at && <span>完成: {new Date(task.completed_at).toLocaleString('zh-CN')}</span>}
          {task.result_summary?.papers_found > 0 && (
            <span>找到论文: <strong>{task.result_summary.papers_found} 篇</strong></span>
          )}
        </div>

        {/* Actions */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {task.status === 'pending' && (
            <button className="btn btn-success" onClick={handleRun} disabled={actionLoading}>
              ▶ 开始搜索
            </button>
          )}
          {task.status === 'running' && (
            <button className="btn btn-danger" onClick={handleStop} disabled={actionLoading}
              style={{ background: 'var(--danger)', color: '#fff' }}>
              ⏹ 暂停搜索
            </button>
          )}
          {task.status === 'failed' && (
            <button className="btn btn-primary" onClick={handleRetry} disabled={actionLoading}>
              🔄 重试
            </button>
          )}
          {task.status === 'stopped' && (
            <button className="btn btn-primary" onClick={handleRetry} disabled={actionLoading}>
              ▶ 继续搜索
            </button>
          )}
          {(task.status === 'completed' || task.status === 'failed' || task.status === 'stopped') && (
            <button className="btn btn-outline" onClick={handleRun} disabled={actionLoading}>
              🔄 重新执行
            </button>
          )}
        </div>
      </div>

      {/* Pending hint */}
      {task.status === 'pending' && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '12px 16px' }}>
          ⏳ 任务已加入队列，消费者将自动开始搜索（最多约 1 分钟），页面会自动刷新状态
        </div>
      )}

      {/* Search conditions summary */}
      {task.status === 'pending' && task.config && (
        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>📝 搜索条件</h3>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            <span>关键词: {task.config.search?.keywords?.join(', ') || '—'}</span>
            <span>年份: {task.config.search?.year_range?.join(' – ') || '—'}</span>
            <span>会议等级: {task.config.venue?.min_ccf_level ? 'CCF-' + task.config.venue.min_ccf_level : '不限'}</span>
            <span>会议白名单: {task.config.venue?.include_patterns?.join(', ') || '不限'}</span>
            <span>技术模块: {task.config.modules?.include?.join(', ') || '不限'}</span>
            <span>数据集: {task.config.datasets?.include?.join(', ') || '不限'}</span>
            <span>要求开源: {task.config.code?.require_open_source ? `是 (≥${task.config.code.min_stars} stars)` : '否'}</span>
            <span>目标数量: {task.config.search?.max_papers || 10} 篇</span>
          </div>
        </div>
      )}

      {/* Running state */}
      {task.status === 'running' && (
        <>
          <LoadingSpinner text="正在搜索中，请稍候...（搜索可能需要 3-5 分钟）" />
          <ProgressLog lines={progress} />
        </>
      )}

      {/* 已结束任务也可回看搜索过程 */}
      {(task.status === 'completed' || task.status === 'failed' || task.status === 'stopped') && progress.length > 0 && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--gray-500)' }}>查看搜索过程</summary>
          <ProgressLog lines={progress} />
        </details>
      )}

      {/* Failed state */}
      {task.status === 'failed' && (
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: 8 }}>❌ 搜索失败</h3>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>{task.error || '未知错误'}</p>
        </div>
      )}

      {/* Completed: tabs + results */}
      {task.status === 'completed' && (
        <>
          {/* Tabs */}
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Summary Table */}
          {activeTab === 'summary' && (
            <PaperSummaryTable papers={papers} />
          )}

          {/* Detailed Report (Markdown) */}
          {activeTab === 'detail' && (
            output_files?.markdown ? (
              <MarkdownViewer url={output_files.markdown} />
            ) : (
              <div className="empty-state"><p>没有可用的 Markdown 报告</p></div>
            )
          )}

          {/* CSV */}
          {activeTab === 'csv' && (
            <div className="card">
              {csvContent ? (
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: 12,
                  lineHeight: 1.6,
                  maxHeight: '70vh',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                }}>
                  {csvContent}
                </pre>
              ) : output_files?.csv ? (
                <LoadingSpinner text="加载 CSV..." />
              ) : (
                <div className="empty-state"><p>没有可用的 CSV 数据</p></div>
              )}
            </div>
          )}

          {/* BibTeX */}
          {activeTab === 'bibtex' && (
            <div className="card">
              {bibContent ? (
                <>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        navigator.clipboard.writeText(bibContent);
                        alert('已复制到剪贴板');
                      }}
                    >
                      📋 复制全部
                    </button>
                  </div>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: 12,
                    lineHeight: 1.6,
                    maxHeight: '70vh',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                  }}>
                    {bibContent}
                  </pre>
                </>
              ) : output_files?.bibtex ? (
                <LoadingSpinner text="加载 BibTeX..." />
              ) : (
                <div className="empty-state"><p>没有可用的 BibTeX 数据</p></div>
              )}
            </div>
          )}
        </>
      )}

      {/* Raw query reference */}
      {task.original_query && (
        <details style={{ marginTop: 24, fontSize: 12, color: 'var(--gray-500)' }}>
          <summary style={{ cursor: 'pointer' }}>原始搜索需求</summary>
          <p style={{ marginTop: 4, padding: 8, background: 'var(--gray-50)', borderRadius: 4 }}>
            {task.original_query}
          </p>
        </details>
      )}
    </div>
  );
}
