export default function AdvancedOptions({ value, onChange, preview }) {
  // 读取显示值：手动高级选项(value) > 纯文本解析预览(preview) > 默认值
  // 这样纯文本里说「找3篇」，高级选项的「目标篇数」就显示 3，而不是默认 10
  const getVal = (path) => {
    const keys = path.split('.');
    let v = value;
    let p = preview;
    for (const k of keys) {
      if (v !== undefined && v !== null) v = v[k];
      else v = undefined;
      if (p !== undefined && p !== null) p = p[k];
      else p = undefined;
    }
    if (v !== undefined && v !== null) return v;
    if (p !== undefined && p !== null) return p;
    return undefined;
  };

  const yr = getVal('search.year_range') || [];
  const maxPapers = getVal('search.max_papers') ?? 10;

  return (
    <div className="advanced-panel">
      <label>
        开始年份
        <input type="number" value={yr[0] ?? ''}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) onChange('search.year_range', [v, yr[1] ?? 2026]);
          }}
          min={2000} max={2026} placeholder="2021" />
      </label>

      <label>
        结束年份
        <input type="number" value={yr[1] ?? ''}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) onChange('search.year_range', [yr[0] ?? 2021, v]);
          }}
          min={2000} max={2026} placeholder="2026" />
      </label>

      <label>
        CCF 最低等级
        <select value={getVal('venue.min_ccf_level') || ''}
          onChange={(e) => onChange('venue.min_ccf_level', e.target.value || null)}>
          <option value="">不限</option>
          <option value="A">CCF-A</option>
          <option value="B">CCF-B</option>
          <option value="C">CCF-C</option>
        </select>
      </label>

      <label>
        指定会议/期刊 (逗号分隔)
        <input type="text" value={(getVal('venue.include_patterns') || []).join(', ')}
          onChange={(e) => {
            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange('venue.include_patterns', arr.length > 0 ? arr : []);
          }}
          placeholder="CVPR, NeurIPS, ICML" />
      </label>

      <label>
        指定数据集 (逗号分隔)
        <input type="text" value={(getVal('datasets.include') || []).join(', ')}
          onChange={(e) => {
            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange('datasets.include', arr.length > 0 ? arr : []);
          }}
          placeholder="ImageNet, CIFAR-10" />
      </label>

      <label>
        技术模块 (逗号分隔)
        <input type="text" value={(getVal('modules.include') || []).join(', ')}
          onChange={(e) => {
            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange('modules.include', arr.length > 0 ? arr : []);
          }}
          placeholder="differential privacy, GAN" />
      </label>

      <label>
        排除技术模块 (逗号分隔)
        <input type="text" value={(getVal('modules.exclude') || []).join(', ')}
          onChange={(e) => {
            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange('modules.exclude', arr.length > 0 ? arr : []);
          }}
          placeholder="federated averaging" />
      </label>

      <label>
        最低 Star 数
        <input type="number" value={getVal('code.min_stars') ?? 0}
          onChange={(e) => onChange('code.min_stars', parseInt(e.target.value) || 0)}
          min={0} />
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={!!getVal('code.require_open_source')}
          onChange={(e) => onChange('code.require_open_source', e.target.checked)} />
        必须开源代码
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={getVal('venue.allow_arxiv_only') !== false}
          onChange={(e) => onChange('venue.allow_arxiv_only', e.target.checked)} />
        允许纯预印本 (arXiv)
      </label>

      <label>
        目标篇数
        <input type="number" value={maxPapers}
          onChange={(e) => onChange('search.max_papers', parseInt(e.target.value) || 10)}
          min={1} max={50} />
      </label>
    </div>
  );
}
