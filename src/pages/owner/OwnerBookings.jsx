import { useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { useList } from '../../hooks/useList';
import { ownerApi } from '../../services/api';
import '../../styles/owner.css';
import { formatDate, formatMoney } from '../../utils/format';
import { fetchAllOwnerHotels, formatOwnerApiError } from '../../utils/portal';

const PAGE_SIZE = 10;

// Ma trận nút hành động chỉ hiển thị khi chuyển trạng thái hợp lệ theo vòng đời SPEC mục 3.
function getAllowedActions(status) {
  switch (status) {
    case 'Pending':
      return [
        { target: 'Confirmed', label: 'Xác nhận', danger: false },
        { target: 'Cancelled', label: 'Huỷ', danger: true },
      ];
    case 'Confirmed':
      return [
        { target: 'CheckedIn', label: 'Đã nhận phòng', danger: false },
        { target: 'Cancelled', label: 'Huỷ', danger: true },
      ];
    case 'CheckedIn':
      return [{ target: 'Completed', label: 'Trả phòng', danger: false }];
    default:
      return [];
  }
}

export default function OwnerBookings() {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Hộp thoại xác nhận đổi trạng thái đơn đặt phòng
  const [actionTarget, setActionTarget] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchAllOwnerHotels()
      .then((list) => setHotels(list))
      .catch(() => {
        // Lỗi quyền hoặc mạng sẽ được hiển thị ở danh sách đơn chính.
      });
  }, []);

  const { items, total, loading, error, page, setPage, reload } = useList(
    ({ page: p, pageSize }) =>
      ownerApi.bookings({
        hotelId: hotelId ? Number(hotelId) : undefined,
        status,
        from,
        to,
        sort,
        page: p,
        pageSize,
      }),
    [hotelId, status, from, to, sort],
    { pageSize: PAGE_SIZE },
  );

  function openTransitionDialog(booking, action) {
    setActionTarget({ booking, action });
    setActionNote('');
  }

  async function confirmTransition() {
    if (!actionTarget) return;
    setSubmittingAction(true);
    setFeedback({ type: '', text: '' });
    try {
      await ownerApi.updateBookingStatus(actionTarget.booking.id, {
        status: actionTarget.action.target,
        note: actionNote.trim() || undefined,
      });
      setFeedback({
        type: 'success',
        text: `Đã cập nhật đơn #${actionTarget.booking.code} sang "${actionTarget.action.label}".`,
      });
      setActionTarget(null);
      reload();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: formatOwnerApiError(err, 'Không thể cập nhật trạng thái đơn đặt phòng.'),
      });
    } finally {
      setSubmittingAction(false);
    }
  }

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Đơn đặt phòng</h1>
          <p className="portal-subtitle">
            Theo dõi đơn đặt phòng từ khách và xử lý xác nhận, nhận phòng, trả phòng hoặc huỷ đơn.
          </p>
        </div>
      </div>

      <PortalNav area="owner" />

      <div className="toolbar-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="ob-hotel">
            Khách sạn
          </label>
          <select
            id="ob-hotel"
            className="form-select"
            value={hotelId}
            onChange={(e) => {
              setHotelId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả khách sạn</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ob-status">
            Trạng thái
          </label>
          <select
            id="ob-status"
            className="form-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ xác nhận</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="CheckedIn">Đã nhận phòng</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Cancelled">Đã huỷ</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ob-from">
            Từ ngày
          </label>
          <input
            id="ob-from"
            type="date"
            className="form-input"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ob-to">
            Đến ngày
          </label>
          <input
            id="ob-to"
            type="date"
            className="form-input"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ob-sort">
            Sắp xếp
          </label>
          <select
            id="ob-sort"
            className="form-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Mới đặt nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="checkin-asc">Nhận phòng gần nhất</option>
            <option value="checkin-desc">Nhận phòng xa nhất</option>
            <option value="amount-desc">Tổng tiền cao nhất</option>
          </select>
        </div>
      </div>

      <div className="toolbar-meta">
        <span>{loading ? 'Đang tải...' : `Tổng ${total} đơn đặt phòng`}</span>
        {(hotelId || status || from || to) && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setHotelId('');
              setStatus('');
              setFrom('');
              setTo('');
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
        <Spinner text="Đang tải danh sách đơn đặt phòng..." />
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
          icon="🧾"
          title="Không có đơn đặt phòng phù hợp"
          description="Chưa có đơn đặt phòng nào khớp điều kiện lọc hiện tại."
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách</th>
                  <th>SĐT</th>
                  <th>Khách sạn</th>
                  <th>Loại phòng</th>
                  <th>Ngày</th>
                  <th>Số phòng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => {
                  const actions = getAllowedActions(b.status);
                  return (
                    <tr key={b.id}>
                      <td data-label="Mã đơn">
                        <span className="code-pill">#{b.code}</span>
                      </td>
                      <td data-label="Khách">
                        <div className="table-title">{b.guestName}</div>
                        <div className="table-sub">{b.guestEmail}</div>
                      </td>
                      <td data-label="SĐT">{b.guestPhone}</td>
                      <td data-label="Khách sạn">{b.hotelName}</td>
                      <td data-label="Loại phòng">{b.roomTypeName}</td>
                      <td data-label="Ngày">
                        {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                        <div className="table-sub">{b.nights} đêm</div>
                      </td>
                      <td data-label="Số phòng">{b.rooms}</td>
                      <td data-label="Tổng tiền">
                        <strong>{formatMoney(b.totalAmount)}</strong>
                      </td>
                      <td data-label="Trạng thái">
                        <StatusBadge status={b.status} />
                      </td>
                      <td data-label="Hành động">
                        {actions.length === 0 ? (
                          <span className="table-sub">—</span>
                        ) : (
                          <div className="table-actions">
                            {actions.map((act) => (
                              <button
                                key={act.target}
                                type="button"
                                className={`btn btn-sm ${act.danger ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => openTransitionDialog(b, act)}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(actionTarget)}
        title={actionTarget ? `${actionTarget.action.label} đơn #${actionTarget.booking.code}` : ''}
        message={
          actionTarget
            ? `Xác nhận chuyển trạng thái đơn của khách ${actionTarget.booking.guestName} (${actionTarget.booking.roomTypeName}) sang "${actionTarget.action.label}"?`
            : ''
        }
        confirmLabel={actionTarget?.action.label || 'Xác nhận'}
        danger={Boolean(actionTarget?.action.danger)}
        loading={submittingAction}
        onConfirm={confirmTransition}
        onCancel={() => setActionTarget(null)}
      >
        <div className="form-field">
          <label className="form-label" htmlFor="booking-status-note">
            Ghi chú xử lý (tuỳ chọn)
          </label>
          <input
            id="booking-status-note"
            type="text"
            className="form-input"
            placeholder="Nhập lý do hoặc ghi chú lễ tân..."
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
