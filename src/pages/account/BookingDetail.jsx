import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { bookingApi, getApiErrorMessage } from '../../services/api';
import { formatDate, formatDateTime, formatMoney } from '../../utils/format';

export default function BookingDetail() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('created') === '1';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    bookingApi
      .detail(code)
      .then((data) => {
        if (!active) return;
        setBooking(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Không tải được chi tiết đơn đặt phòng.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [code, reloadTick]);

  const canCancel = booking && (booking.status === 'Pending' || booking.status === 'Confirmed');

  async function handleConfirmCancel() {
    if (!booking) return;
    setCancelError('');
    setCancelling(true);
    try {
      const updated = await bookingApi.cancel(booking.id, {
        reason: cancelReason.trim() || null,
      });
      setBooking(updated);
      setCancelOpen(false);
      setCancelReason('');
      setCancelSuccess('Đã huỷ đơn đặt phòng thành công.');
    } catch (err) {
      setCancelError(getApiErrorMessage(err, 'Không thể huỷ đơn đặt phòng.'));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="container account-page">
        <Spinner text="Đang tải thông tin đơn đặt phòng..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container account-page">
        <div className="alert alert-error">
          <p>{error || 'Không tìm thấy đơn đặt phòng.'}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setReloadTick((t) => t + 1)}
            >
              Thử lại
            </button>
            <Link to="/account/bookings" className="btn btn-primary btn-sm">
              Về danh sách đơn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container account-page">
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link to="/account">Tài khoản</Link>
        <span>/</span>
        <Link to="/account/bookings">Đơn đặt phòng</Link>
        <span>/</span>
        <span>#{booking.code}</span>
      </nav>

      {justCreated && (
        <div className="alert alert-success">
          <strong>Đặt phòng thành công!</strong> Mã đơn của bạn là{' '}
          <span className="booking-code">#{booking.code}</span>. Đơn đang ở trạng thái Chờ xác nhận.
        </div>
      )}

      {cancelSuccess && <div className="alert alert-success">{cancelSuccess}</div>}

      <div className="detail-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="booking-code">#{booking.code}</span>
            <StatusBadge status={booking.status} />
          </div>
          <h1 style={{ marginTop: 8 }}>{booking.hotelName}</h1>
          <p style={{ color: 'var(--muted)' }}>
            Tạo lúc {formatDateTime(booking.createdAt)} • Cập nhật lúc{' '}
            {formatDateTime(booking.updatedAt)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to={`/hotels/${booking.hotelSlug}`} className="btn btn-outline btn-sm">
            Xem khách sạn
          </Link>
          {canCancel && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                setCancelError('');
                setCancelOpen(true);
              }}
            >
              Huỷ đơn đặt phòng
            </button>
          )}
        </div>
      </div>

      <div className="booking-detail-grid">
        <section className="account-card">
          <h2>Chi tiết lưu trú</h2>
          <dl className="info-dl">
            <dt>Khách sạn</dt>
            <dd>{booking.hotelName}</dd>
            <dt>Loại phòng</dt>
            <dd>{booking.roomTypeName}</dd>
            <dt>Nhận phòng</dt>
            <dd>{formatDate(booking.checkIn)}</dd>
            <dt>Trả phòng</dt>
            <dd>{formatDate(booking.checkOut)}</dd>
            <dt>Thời gian</dt>
            <dd>
              {booking.nights} đêm • {booking.rooms} phòng
            </dd>
            <dt>Số khách</dt>
            <dd>
              {booking.adults} người lớn
              {booking.children > 0 ? `, ${booking.children} trẻ em` : ''}
            </dd>
            <dt>Khách nhận phòng</dt>
            <dd>{booking.guestName}</dd>
            <dt>Số điện thoại</dt>
            <dd>{booking.guestPhone}</dd>
            <dt>Email liên hệ</dt>
            <dd>{booking.guestEmail}</dd>
            <dt>Ghi chú</dt>
            <dd>{booking.note || 'Không có'}</dd>
          </dl>
        </section>

        <aside className="account-card">
          <h2>Thanh toán & Tổng tiền</h2>
          <div className="summary-row">
            <span>Giá mỗi đêm (lúc đặt)</span>
            <strong>{formatMoney(booking.pricePerNight)}</strong>
          </div>
          <div className="summary-row">
            <span>Số đêm</span>
            <strong>{booking.nights} đêm</strong>
          </div>
          <div className="summary-row">
            <span>Số phòng</span>
            <strong>{booking.rooms} phòng</strong>
          </div>
          <div className="summary-total">
            <span>Tổng cộng</span>
            <span style={{ color: 'var(--teal-dark)' }}>{formatMoney(booking.totalAmount)}</span>
          </div>
          <Link to="/account/bookings" className="btn btn-outline">
            ← Quay lại danh sách đơn
          </Link>
        </aside>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title={`Huỷ đơn đặt phòng #${booking.code}?`}
        message="Phòng sẽ được mở trả lại tồn kho sau khi huỷ. Thao tác này không thể hoàn tác."
        confirmLabel="Xác nhận huỷ đơn"
        cancelLabel="Giữ lại đơn"
        danger
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelOpen(false)}
      >
        {cancelError && <div className="alert alert-error">{cancelError}</div>}
        <div className="form-field">
          <label className="form-label" htmlFor="cancel-reason">
            Lý do huỷ (tuỳ chọn)
          </label>
          <textarea
            id="cancel-reason"
            rows={2}
            className="form-textarea"
            maxLength={400}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Thay đổi lịch trình..."
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
