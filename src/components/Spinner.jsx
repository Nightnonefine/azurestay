export default function Spinner({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="spinner-box" role="status" aria-live="polite">
      <div className="spinner-circle" />
      <span>{text}</span>
    </div>
  );
}
