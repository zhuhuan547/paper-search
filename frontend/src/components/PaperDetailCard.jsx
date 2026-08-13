export default function PaperDetailCard({ paper }) {
  if (!paper) return null;

  const authors = Array.isArray(paper.authors)
    ? paper.authors.join(', ')
    : (paper.authors || 'Unknown');

  const tags = paper.tech_modules || [];
  const datasets = paper.datasets_used || [];

  return (
    <div className="paper-detail">
      <h3>{paper.title || 'Unknown'}</h3>

      <dl className="paper-detail-grid">
        <dt>作者</dt>
        <dd>{authors}</dd>

        <dt>会议/期刊</dt>
        <dd>{paper.venue || '—'}{paper.venue_full ? ` (${paper.venue_full})` : ''}</dd>

        <dt>年份</dt>
        <dd>{paper.year || '—'}</dd>

        <dt>引用数</dt>
        <dd>{paper.citations ?? '—'}</dd>

        {paper.arxiv_id && (
          <>
            <dt>arXiv</dt>
            <dd>
              <a href={`https://arxiv.org/abs/${paper.arxiv_id}`} target="_blank" rel="noopener noreferrer">
                {paper.arxiv_id}
              </a>
            </dd>
          </>
        )}

        {paper.doi && (
          <>
            <dt>DOI</dt>
            <dd>
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer">
                {paper.doi}
              </a>
            </dd>
          </>
        )}

        {paper.has_code && paper.repo_url && (
          <>
            <dt>代码仓库</dt>
            <dd>
              <a href={paper.repo_url} target="_blank" rel="noopener noreferrer">
                {paper.repo_url} {paper.stars ? `⭐ ${paper.stars}` : ''}
              </a>
            </dd>
          </>
        )}

        {paper.score != null && (
          <>
            <dt>综合评分</dt>
            <dd style={{ fontWeight: 700, color: 'var(--primary)' }}>{paper.score.toFixed(1)}</dd>
          </>
        )}
      </dl>

      {paper.method_summary && (
        <div style={{ marginBottom: 12 }}>
          <strong style={{ fontSize: 14 }}>核心方法：</strong>
          <span style={{ fontSize: 14 }}>{paper.method_summary}</span>
        </div>
      )}

      {tags.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <strong style={{ fontSize: 13, marginRight: 8 }}>技术模块：</strong>
          <div className="paper-tags" style={{ display: 'inline-flex' }}>
            {tags.map((t) => (
              <span key={t} className="paper-tag">{t}</span>
            ))}
          </div>
        </div>
      )}

      {datasets.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <strong style={{ fontSize: 13, marginRight: 8 }}>数据集：</strong>
          <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{datasets.join(', ')}</span>
        </div>
      )}

      {paper.abstract && (
        <div>
          <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>摘要：</strong>
          <div className="paper-abstract">{paper.abstract}</div>
        </div>
      )}
    </div>
  );
}
