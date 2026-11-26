import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { useDebounce } from '../../hooks/useDebounce';
import { useList } from '../../hooks/useList';
import { adminApi, getApiErrorMessage, metaApi } from '../../services/api';
import '../../styles/owner.css';
import '../../styles/admin.css';
import { formatDate, hotelStatusLabel } from '../../utils/format';

const PAGE_SIZE = 10;

export default function AdminHotels() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState('newest');
  const [cities, setCities] = useState([]);
  const debouncedQ = useDebounce(search, 300);

  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [confirmAction, setConfirmAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    metaApi
      .cities()
      .then((data) => {
        if (Array.isArray(data)) {
          setCities(data.map((c) => c.city));
        }
      })
      .catch(() => {});
  }, []);

  const { items, total, loading, error, page, setPage, reload } = useList(
    ({ page: p, pageSize }) =>
      adminApi.hotels({
        q: debouncedQ,
        status,
        city,
        sort,
        page: p,
        pageSize,
      }),
    [debouncedQ, status, city, sort],
    { pageSize: PAGE_SIZE },
  );

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setSubmitting(true);
    setFeedback({ type: '', text: '' });
    try {
      if (confirmAction.kind === 'status') {
        await adminApi.updateHotelStatus(confirmAction.hotel.id, {
          status: confirmAction.targetStatus,
        });
        setFeedback({
          type: 'success',
          text: `Đã chuyển khách sạn "${confirmAction.hotel.name}" sang trạng thái "${hotelStatusLabel(confirmAction.targetStatus)}".`,
        });
      } else if (confirmAction.kind === 'featured') {
        const nextFeatured = !confirmAction.hotel.featured;
        await adminApi.toggleFeatured(confirmAction.hotel.id, { featured: nextFeatured });
        setFeedback({
          type: 'success',
          text: nextFeatured
            ? `Đã bật Nổi bật cho khách sạn "${confirmAction.hotel.name}".`
            : `Đã tắt Nổi bật cho khách sạn "${confirmAction.hotel.name}".`,
        });
      }
      setConfirmAction(null);
      reload();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Không thể cập nhật khách sạn.'),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Quản lý &amp; duyệt khách sạn</h1>
          <p className="portal-subtitle">
            Duyệt khách sạn mới, tạm ngưng vi phạm, từ chối hoặc bật/tắt nhãn Nổi bật (Featured).
          </p>
        </div>
      </div>

      <PortalNav area="admin" />

      <div className="toolbar-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="ah-search">
            Tìm kiếm
          </label>
          <input
            id="ah-search"
            type="search"
            className="form-input"
            placeholder="Tên khách sạn, email chủ, quận..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ah-status">
            Trạng thái
          </label>
          <select
            id="ah-status"
            className="form-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Suspended">Tạm ngưng</option>
            <option value="Rejected">Từ chối</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ah-city">
            Thành phố
          </label>
          <select
            id="ah-city"
            className="form-select"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả thành phố</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ah-sort">
            Sắp xếp
          </label>
          <select
            id="ah-sort"
            className="form-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Tên A → Z</option>
            <option value="rating">Hạng sao cao nhất</option>
          </select>
        </div>
      </div>

      <div className="toolbar-meta">
        <span>{loading ? 'Đang tải...' : `Tổng ${total} khách sạn`}</span>
        {(search || status || city) && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearch('');
              setStatus('');
              setCity('');
              setSort('newest');
              setPage(1);
            }}
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {feedback.text && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <Spinner text="Đang tải danh sách khách sạn..." />
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={reload}
            style={{ marginTop: 10 }}
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🏨"
          title="Không có khách sạn phù hợp"
          description="Không tìm thấy khách sạn nào khớp bộ lọc hiện tại."
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Khách sạn</th>
                  <th>Chủ sở hữu</th>
                  <th>Thành phố</th>
                  <th>Loại phòng</th>
                  <th>Trạng thái</th>
                  <th>Nổi bật</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((hotel) => (
                  <tr key={hotel.id}>
                    <td data-label="Khách sạn">
                      <div className="table-title">{hotel.name}</div>
                      <div className="table-sub">
                        {hotel.starRating}★ · {hotel.district}
                      </div>
                    </td>
                    <td data-label="Chủ sở hữu">
                      <div className="table-title">{hotel.ownerName}</div>
                      <div className="table-sub">{hotel.ownerEmail}</div>
                    </td>
                    <td data-label="Thành phố">{hotel.city}</td>
                    <td data-label="Loại phòng">{hotel.roomTypeCount}</td>
                    <td data-label="Trạng thái">
                      <StatusBadge
                        status={hotel.status}
                        label={hotelStatusLabel(hotel.status)}
                      />
                    </td>
                    <td data-label="Nổi bật">
                      <button
                        type="button"
                        className={
                          hotel.featured ? 'admin-badge-featured' : 'admin-badge-normal'
                        }
                        onClick={() =>
                          setConfirmAction({
                            kind: 'featured',
                            hotel,
                            title: hotel.featured ? 'Bỏ gắn Nổi bật' : 'Đánh dấu Nổi bật',
                            message: hotel.featured
                              ? `Tắt nhãn Nổi bật của "${hotel.name}"?`
                              : `Bật nhãn Nổi bật (Featured) để "${hotel.name}" ưu tiên hiển thị trên trang chủ?`,
                            confirmLabel: hotel.featured ? 'Tắt nổi bật' : 'Bật nổi bật',
                            danger: false,
                          })
                        }
                      >
                        {hotel.featured ? '★ Nổi bật' : 'Thường'}
                      </button>
                    </td>
                    <td data-label="Ngày tạo">{formatDate(hotel.createdAt)}</td>
                    <td data-label="Thao tác">
                      <div className="table-actions">
                        {hotel.status !== 'Active' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              setConfirmAction({
                                kind: 'status',
                                hotel,
                                targetStatus: 'Active',
                                title: 'Duyệt khách sạn',
                                message: `Kích hoạt khách sạn "${hotel.name}" sang trạng thái Đang hoạt động?`,
                                confirmLabel: 'Duyệt',
                                danger: false,
                              })
                            }
                          >
                            Duyệt
                          </button>
                        )}
                        {hotel.status !== 'Suspended' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() =>
                              setConfirmAction({
                                kind: 'status',
                                hotel,
                                targetStatus: 'Suspended',
                                title: 'Tạm ngưng khách sạn',
                                message: `Tạm ngưng hiển thị khách sạn "${hotel.name}"?`,
                                confirmLabel: 'Tạm ngưng',
                                danger: true,
                              })
                            }
                          >
                            Tạm ngưng
                          </button>
                        )}
                        {hotel.status !== 'Rejected' && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              setConfirmAction({
                                kind: 'status',
                                hotel,
                                targetStatus: 'Rejected',
                                title: 'Từ chối khách sạn',
                                message: `Chuyển khách sạn "${hotel.name}" sang trạng thái Từ chối?`,
                                confirmLabel: 'Từ chối',
                                danger: true,
                              })
                            }
                          >
                            Từ chối
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title || 'Xác nhận thao tác'}
        message={confirmAction?.message || ''}
        confirmLabel={confirmAction?.confirmLabel || 'Xác nhận'}
        danger={Boolean(confirmAction?.danger)}
        loading={submitting}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
