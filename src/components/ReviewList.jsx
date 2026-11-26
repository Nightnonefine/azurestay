import { hotelApi } from '../services/api';
import { useList } from '../hooks/useList';
import { formatDate } from '../utils/format';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import Spinner from './Spinner';

export default function ReviewList({ slug }) {
  const { items, total, loading, error, page, setPage, reload } = useList(
    ({ page: p, pageSize }) => hotelApi.reviews(slug, { page: p, pageSize }),
    [slug],
    { pageSize: 5, enabled: Boolean(slug) },
  );

  if (loading) {
    return <Spinner text="Đang tải đánh giá từ khách lưu trú..." />;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <p>{error}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={reload} style={{ marginTop: 8 }}>
          Thử lại
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="★"
        title="Chưa có đánh giá nào"
        description="Hãy trở thành một trong những vị khách đầu tiên chia sẻ trải nghiệm tại đây."
      />
    );
  }

  return (
    <div>
      <div className="review-list">
        {items.map((review) => (
          <article key={review.id} className="review-card">
            <div className="review-head">
              <span className="review-author">{review.guestName}</span>
              <div className="review-meta">
                <span className="review-stars" aria-label={`${review.rating} sao`}>
                  {'★'.repeat(review.rating)}
                </span>
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </div>
            <p>{review.comment}</p>
          </article>
        ))}
      </div>

      <Pagination page={page} pageSize={5} total={total} onPageChange={setPage} />
    </div>
  );
}
