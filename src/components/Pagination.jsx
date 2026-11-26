export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 10)));
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page || 1), totalPages);

  // Tính danh sách số trang hiển thị gọn gàng kèm dấu ba chấm.
  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - current) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        type="button"
        className="page-btn"
        disabled={current <= 1}
        onClick={() => onPageChange(current - 1)}
      >
        Trước
      </button>

      {pages.map((item, idx) =>
        item === '...' ? (
          <span key={`dots-${idx}`} className="page-btn" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`page-btn${item === current ? ' active' : ''}`}
            aria-current={item === current ? 'page' : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="page-btn"
        disabled={current >= totalPages}
        onClick={() => onPageChange(current + 1)}
      >
        Sau
      </button>
    </nav>
  );
}
