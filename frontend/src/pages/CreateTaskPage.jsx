import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import AdvancedOptions from '../components/AdvancedOptions';
import { createTask, parseQuery } from '../api/client';

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [advanced, setAdvanced] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const debounceRef = useRef(null);

  // 实时解析纯文本，作为高级选项的「基准」显示（防抖 400ms）
  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q) {
      setPreview(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await parseQuery(q);
        setPreview(res.data);
      } catch {
        setPreview(null);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await createTask(query.trim(), advanced);
      navigate(`/tasks/${res.data.task.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || '创建任务失败');
      setSubmitting(false);
    }
  };

  const handleAdvancedChange = (key, value) => {
    setAdvanced((prev) => {
      const next = { ...prev };
      // 深度设置
      const keys = key.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      // 清理空值
      for (const k of Object.keys(next)) {
        if (next[k] && typeof next[k] === 'object' && !Array.isArray(next[k]) && Object.keys(next[k]).length === 0) {
          delete next[k];
        }
      }
      return next;
    });
  };

  const merged = preview?.merged;

  return (
    <div>
      <div className="search-hero">
        <h1>🔬 学术论文搜索</h1>
        <p>用自然语言描述你想找的论文，支持中英文</p>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      {/* 实时解析预览 */}
      {merged && (
        <div className="card" style={{ maxWidth: 700, margin: '12px auto', textAlign: 'left' }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>📝 解析结果（以你输入的文字为准）</h3>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            <span>关键词: {merged.search?.keywords?.join(', ') || '—'}</span>
            <span>年份: {merged.search?.year_range?.join(' – ') || '—'}</span>
            <span>目标篇数: {merged.search?.max_papers ?? 10} 篇</span>
            <span>要求开源: {merged.code?.require_open_source ? '是' : '否'}</span>
            <span>会议等级: {merged.venue?.min_ccf_level ? 'CCF-' + merged.venue.min_ccf_level : '不限'}</span>
            <span>数据集: {merged.datasets?.include?.join(', ') || '不限'}</span>
          </div>
        </div>
      )}

      <div className="advanced-toggle">
        <button onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? '▾ 收起高级选项' : '▸ 高级选项'}
        </button>
      </div>

      {showAdvanced && (
        <AdvancedOptions
          value={advanced}
          onChange={handleAdvancedChange}
          preview={merged}
        />
      )}

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', textAlign: 'center', maxWidth: 700, margin: '16px auto' }}>
          ❌ {error}
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '24px auto', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          💡 示例：联邦学习隐私保护，近3年顶会，要开源代码，找15篇
        </p>
      </div>
    </div>
  );
}
