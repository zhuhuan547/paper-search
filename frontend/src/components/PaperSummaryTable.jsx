import { useState, useMemo } from 'react';
import PaperDetailCard from './PaperDetailCard';

const SORT_KEYS = {
  rank: 'rank',
  title: 'title',
  venue: 'venue',
  year: 'year',
  citations: 'citations',
  score: 'score',
};

export default function PaperSummaryTable({ papers }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [sortKey, setSortKey] = useState('rank');
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    if (!papers || papers.length === 0) return [];
    const arr = [...papers];
    arr.sort((a, b) => {
      let va = a[sortKey] ?? '';
      let vb = b[sortKey] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [papers, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  if (!papers || papers.length === 0) {
    return <div className="empty-state"><p>暂无论文数据</p></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--gray-500)' }}>
        共 {papers.length} 篇论文 · 点击表头排序 · 点击行展开详情
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="paper-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('rank')} style={{ width: 40 }}>#{sortIndicator('rank')}</th>
              <th onClick={() => handleSort('title')}>标题{sortIndicator('title')}</th>
              <th onClick={() => handleSort('venue')} style={{ width: 160 }}>会议/期刊{sortIndicator('venue')}</th>
              <th onClick={() => handleSort('year')} style={{ width: 60 }}>年份{sortIndicator('year')}</th>
              <th onClick={() => handleSort('citations')} style={{ width: 60 }}>引用{sortIndicator('citations')}</th>
              <th style={{ width: 100 }}>代码</th>
              <th onClick={() => handleSort('score')} style={{ width: 60 }}>评分{sortIndicator('score')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((paper, i) => (
              <>
                <tr
                  key={paper.title || i}
                  className={`paper-row ${expandedIdx === i ? 'expanded' : ''}`}
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                >
                  <td>{paper.rank || i + 1}</td>
                  <td className="paper-title">
                    <div style={{
                      maxWidth: 350,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {paper.title || '—'}
                    </div>
                  </td>
                  <td className="paper-venue">
                    <div style={{
                      maxWidth: 140,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {paper.venue || '—'}
                    </div>
                  </td>
                  <td>{paper.year || '—'}</td>
                  <td>{paper.citations ?? '—'}</td>
                  <td className="paper-code">
                    {paper.has_code && paper.repo_url ? (
                      <a href={paper.repo_url} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`⭐ ${paper.stars || 0}`}>
                        GitHub {paper.stars ? `⭐${paper.stars}` : ''}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--gray-300)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {paper.score != null ? paper.score.toFixed(1) : '—'}
                  </td>
                </tr>
                {expandedIdx === i && (
                  <tr key={`detail-${i}`}>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <PaperDetailCard paper={paper} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
