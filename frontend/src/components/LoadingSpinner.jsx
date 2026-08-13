export default function LoadingSpinner({ text = '加载中...' }) {
  return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
