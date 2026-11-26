import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { useList } from '../../hooks/useList';
import { bookingApi } from '../../services/api';
import { formatDate, formatMoney } from '../../utils/format';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'CheckedIn', label: 'Đã nhận phòng' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã huỷ' },
];

const PAGE_SIZE = 8;

export default function MyBookings() {
  const [statusFilter, setStatusFilter] = useState('');

  const { items, total, loading, error, page, setPage, reload } = useList(
    ({ page: p, pageSize }) => bookingApi.mine({ status: statusFilter, page: p, pageSize }),
    [statusFilter],
    { pageSize: PAGE_SIZE },
  );

  function handleStatusChange(nextStatus) {
    setStatusFilter(nextStatus);
    setPage(1);
  }

  return (
    <div className="container account-page">
      <div>
        <h1 style={{ color: 'var(--navy)' }}>Đơn đặt phòng của tôi</h1>
        <p style={{ color: 'var(--muted)' }}>
          Theo dõi lịch sử đặt phòng, kiểm tra trạng thái hoặc huỷ đơn khi cần.
        </p>
      </div>

      <nav className="account-tabs" aria-label="Điều hướng tài khoản">
        <NavLink to="/account" end className={({ isActive }) => `account-tab${isActive ? ' active' : ''}`}>
          Thông tin cá nhân
        </NavLink>
        <NavLink to="/account/bookings" className={({ isActive }) => `account-tab${isActive ? ' active' : ''}`}>
          Đơn đặt phòng của tôi
        </NavLink>
      </nav>

      <div className="booking-filter-bar">
        <div className="status-filter-pills" role="group" aria-label="Lọc theo trạng thái">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value || 'all'}
              type="button"
              className={`status-pill-btn${statusFilter === opt.value ? ' active' : ''}`}
              onClick={() => handleStatusChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600 }}>
          {loading ? 'Đang tải...' : `${total} đơn`}
        </span>
      </div>

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
          icon="🧳"
          title="Chưa có đơn đặt phòng nào"
          description={
            statusFilter
              ? 'Không có đơn nào ở trạng thái bạn đang lọc.'
              : 'Bạn chưa thực hiện đơn đặt phòng nào trên AzureStay.'
          }
          action={
            <Link to="/hotels" className="btn btn-primary btn-sm">
              Tìm khách sạn ngay
            </Link>
          }
        />
      ) : (
        <>
          <div className="booking-cards">
            {items.map((booking) => (
              <article key={booking.id} className="booking-row-card">
                <div>
                  <div className="booking-code-line">
                    <span className="booking-code">#{booking.code}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="booking-hotel-name">{booking.hotelName}</div>
                  <div className="booking-meta-line">
                    <span>Phòng: {booking.roomTypeName}</span>
                    <span>
                      {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ({booking.nights}{' '}
                      đêm)
                    </span>
                    <span>{booking.rooms} phòng</span>
                  </div>
                </div>

                <div className="booking-row-right">
                  <span className="booking-total-price">{formatMoney(booking.totalAmount)}</span>
                  <Link to={`/account/bookings/${booking.code}`} className="btn btn-outline btn-sm">
                    Xem chi tiết
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
