import { useEffect, useRef } from 'react';

/**
 * 搜索进度日志 —— 实时展示消费端（Claude 会话）在搜索过程中
 * 逐步追加到 tasks/{id}/progress.log 的中文过程输出。
 */
export default function ProgressLog({ lines }) {
  const ref = useRef(null);

  // 新日志到达时自动滚动到底部
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [lines]);

  if (!lines || lines.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 16, textAlign: 'left' }}>
      <h3 style={{ fontSize: 14, marginBottom: 8 }}>🔎 搜索进度</h3>
      <pre
        ref={ref}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: 12,
          lineHeight: 1.7,
          maxHeight: 360,
          overflowY: 'auto',
          margin: 0,
          padding: 12,
          background: 'var(--gray-50)',
          borderRadius: 6,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          color: 'var(--gray-700)',
        }}
      >
        {lines.join('\n')}
      </pre>
    </div>
  );
}
