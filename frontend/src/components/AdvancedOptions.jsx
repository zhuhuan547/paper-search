export default function AdvancedOptions({ value, onChange }) {
  const setField = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(key, val);
  };

  // 辅助：获取深度嵌套值
  const get = (key) => {
    const keys = key.split('.');
    let obj = value;
    for (const k of keys) {
      if (!obj) return undefined;
      obj = obj[k];
    }
    return obj;
  };

  return (
    <div className="advanced-panel">
      <label>
        开始年份
        <input type="number" value={get('search.year_range[0]') || ''}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) {
              const end = get('search.year_range[1]') || 2026;
              onChange('search', {
                ...(get('search') || {}),
                year_range: [v, end],
              });
            }
          }}
          min={2000} max={2026} placeholder="2021" />
      </label>

      <label>
        结束年份
        <input type="number" value={get('search.year_range[1]') || ''}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) {
              const start = get('search.year_range[0]') || 2021;
              onChange('search', {
                ...(get('search') || {}),
                year_range: [start, v],
              });
            }
          }}
          min={2000} max={2026} placeholder="2026" />
      </label>

      <label>
        CCF 最低等级
        <select value={get('venue.min_ccf_level') || ''} onChange={(e) => onChange('venue', { ...(get('venue') || {}), min_ccf_level: e.target.value || null })}>
          <option value="">不限</option>
          <option value="A">CCF-A</option>
          <option value="B">CCF-B</option>
          <option value="C">CCF-C</option>
        </select>
      </label>

      <label>
        指定会议/期刊 (逗号分隔)
        <input type="text" value={get('venue.include_patterns')?.join(', ') || ''}
          onChange={(e) => {
            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange('venue', { ...(get('venue') || {}), include_patterns: arr.length > 0 ? arr : [] });
          }}
          placeholder="CVPR, NeurIPS, ICML" />
      </label>

      <label>
        指定数据集 (逗号分隔)
        <input type="text" value={get('datasets.include')?.join(', ') || ''}
          onChange={(e) => {
            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange('datasets', { include: arr.length > 0 ? arr : [], exclude: [] });
          }}
          placeholder="ImageNet, CIFAR-10" />
      </label>

      <label>
        技术模块 (逗号分隔)
        <input type="text" value={get('modules.include')?.join(', ') || ''}
          onChange={(e) => {
            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange('modules', { ...(get('modules') || {}), include: arr.length > 0 ? arr : [], match_mode: 'semantic' });
          }}
          placeholder="differential privacy, GAN" />
      </label>

      <label>
        排除技术模块 (逗号分隔)
        <input type="text" value={get('modules.exclude')?.join(', ') || ''}
          onChange={(e) => {
            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange('modules', { ...(get('modules') || {}), exclude: arr.length > 0 ? arr : [], match_mode: 'semantic' });
          }}
          placeholder="federated averaging" />
      </label>

      <label>
        最低 Star 数
        <input type="number" value={get('code.min_stars') || 0}
          onChange={(e) => onChange('code', { ...(get('code') || {}), min_stars: parseInt(e.target.value) || 0 })}
          min={0} />
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={!!get('code.require_open_source')}
          onChange={(e) => onChange('code', { ...(get('code') || {}), require_open_source: e.target.checked })} />
        必须开源代码
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={get('venue.allow_arxiv_only') !== false}
          onChange={(e) => onChange('venue', { ...(get('venue') || {}), allow_arxiv_only: e.target.checked })} />
        允许纯预印本 (arXiv)
      </label>

      <label>
        目标篇数
        <input type="number" value={get('search.max_papers') || 10}
          onChange={(e) => onChange('search', { ...(get('search') || {}), max_papers: parseInt(e.target.value) || 10 })}
          min={1} max={50} />
      </label>
    </div>
  );
}
