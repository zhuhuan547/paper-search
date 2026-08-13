export default function SearchInput({ value, onChange, onSubmit, loading }) {
  const handleKeyDown = (e) => {
    // Ctrl+Enter 提交
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="search-box">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="描述你想找的论文...&#10;例：联邦学习隐私保护，近3年顶会，要开源代码，star>10，找15篇"
        disabled={loading}
        autoFocus
      />
      <button
        className="btn btn-primary"
        onClick={onSubmit}
        disabled={loading || !value.trim()}
      >
        {loading ? '提交中...' : '🔍 搜索'}
      </button>
    </div>
  );
}
