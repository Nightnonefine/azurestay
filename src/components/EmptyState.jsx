export default function EmptyState({
  icon = '✦',
  title = 'Chưa có dữ liệu',
  description = 'Không tìm thấy kết quả phù hợp với điều kiện hiện tại.',
  action = null,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
