import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DateRangeInput from '../components/DateRangeInput';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { bookingApi, getApiErrorMessage, hotelApi } from '../services/api';
import { addDaysIso, todayIso, validateDateRange } from '../utils/dates';
import { formatDate, formatMoney } from '../utils/format';
import { validateBooking } from '../utils/validate';

export default function BookingForm() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialCheckIn = searchParams.get('checkIn') || todayIso();
  const initialCheckOut = searchParams.get('checkOut') || addDaysIso(initialCheckIn, 1);
  const initialRoomTypeId = searchParams.get('roomTypeId') || '';

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [roomTypeId, setRoomTypeId] = useState(initialRoomTypeId);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guestName, setGuestName] = useState(user?.fullName || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tải thông tin khách sạn + tồn kho ứng với ngày nhận/trả đang chọn.
  useEffect(() => {
    let active = true;
    const dateCheck = validateDateRange(checkIn, checkOut);
    const params = dateCheck.valid ? { checkIn, checkOut } : {};

    setLoading((prev) => (hotel ? prev : true));
    setLoadError('');

    hotelApi
      .detail(slug, params)
      .then((data) => {
        if (!active) return;
        setHotel(data);
        if (data?.roomTypes?.length > 0) {
          const exists = data.roomTypes.some((rt) => String(rt.id) === String(roomTypeId));
          if (!exists) {
            setRoomTypeId(String(data.roomTypes[0].id));
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(getApiErrorMessage(err, 'Không tải được thông tin đặt phòng.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, checkIn, checkOut]);

  const selectedRoomType = useMemo(() => {
    if (!hotel?.roomTypes) return null;
    return hotel.roomTypes.find((rt) => String(rt.id) === String(roomTypeId)) || hotel.roomTypes[0] || null;
  }, [hotel, roomTypeId]);

  // Tính tạm tiền ở client để hiển thị cho khách; backend sẽ tính lại và chụp giá chính thức.
  const dateInfo = validateDateRange(checkIn, checkOut);
  const nights = dateInfo.valid ? dateInfo.nights : 0;
  const pricePerNight = selectedRoomType ? Number(selectedRoomType.pricePerNight) : 0;
  const estimatedTotal = nights * Math.max(1, Number(rooms) || 1) * pricePerNight;

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    if (!selectedRoomType) {
      setServerError('Vui lòng chọn loại phòng hợp lệ.');
      return;
    }

    const maxCapacityPerRoom = selectedRoomType.maxAdults + selectedRoomType.maxChildren;
    const errors = validateBooking({
      guestName,
      guestPhone,
      guestEmail,
      rooms,
      adults,
      children,
      checkIn,
      checkOut,
      available: selectedRoomType.available,
      maxCapacityPerRoom,
    });

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const booking = await bookingApi.create({
        roomTypeId: selectedRoomType.id,
        checkIn,
        checkOut,
        rooms: Number(rooms),
        adults: Number(adults),
        children: Number(children || 0),
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        note: note.trim() || null,
      });

      navigate(`/account/bookings/${booking.code}?created=1`, { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Không thể tạo đơn đặt phòng.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container booking-layout">
        <Spinner text="Đang chuẩn bị biểu mẫu đặt phòng..." />
      </div>
    );
  }

  if (loadError || !hotel) {
    return (
      <div className="container" style={{ padding: '32px 20px' }}>
        <div className="alert alert-error">
          <p>{loadError || 'Không tìm thấy khách sạn.'}</p>
          <Link to="/hotels" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
            Quay lại danh sách khách sạn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="page-banner">
        <div className="container">
          <h1>Đặt phòng tại {hotel.name}</h1>
          <p>
            {hotel.address} — {hotel.city}
          </p>
        </div>
      </section>

      <div className="container booking-layout">
        <form className="booking-form-card" onSubmit={handleSubmit} noValidate>
          <h2 style={{ color: 'var(--navy)' }}>Thông tin đặt phòng & người nhận</h2>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <div className="form-field">
            <label className="form-label" htmlFor="booking-room-type">
              Loại phòng
            </label>
            <select
              id="booking-room-type"
              className="form-select"
              value={selectedRoomType?.id || ''}
              onChange={(e) => setRoomTypeId(e.target.value)}
            >
              {hotel.roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} — {formatMoney(rt.pricePerNight)}/đêm
                  {typeof rt.available === 'number' ? ` (Còn ${rt.available} phòng)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <DateRangeInput
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={({ checkIn: ci, checkOut: co }) => {
                setCheckIn(ci);
                setCheckOut(co);
              }}
            />
            {fieldErrors.dates && (
              <div className="form-error" style={{ marginTop: 6 }}>
                {fieldErrors.dates}
              </div>
            )}
          </div>

          <div className="form-grid-3">
            <div className="form-field">
              <label className="form-label" htmlFor="booking-rooms">
                Số phòng
              </label>
              <input
                id="booking-rooms"
                type="number"
                className={`form-input${fieldErrors.rooms ? ' is-invalid' : ''}`}
                min={1}
                max={typeof selectedRoomType?.available === 'number' ? Math.max(1, selectedRoomType.available) : 50}
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
              />
              {fieldErrors.rooms && <span className="form-error">{fieldErrors.rooms}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="booking-adults">
                Người lớn
              </label>
              <input
                id="booking-adults"
                type="number"
                className={`form-input${fieldErrors.adults ? ' is-invalid' : ''}`}
                min={1}
                max={200}
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
              />
              {fieldErrors.adults && <span className="form-error">{fieldErrors.adults}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="booking-children">
                Trẻ em
              </label>
              <input
                id="booking-children"
                type="number"
                className={`form-input${fieldErrors.children ? ' is-invalid' : ''}`}
                min={0}
                max={200}
                value={children}
                onChange={(e) => setChildren(e.target.value)}
              />
              {fieldErrors.children && <span className="form-error">{fieldErrors.children}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="booking-name">
                Họ tên khách nhận phòng
              </label>
              <input
                id="booking-name"
                type="text"
                className={`form-input${fieldErrors.guestName ? ' is-invalid' : ''}`}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
              {fieldErrors.guestName && <span className="form-error">{fieldErrors.guestName}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="booking-phone">
                Số điện thoại
              </label>
              <input
                id="booking-phone"
                type="tel"
                className={`form-input${fieldErrors.guestPhone ? ' is-invalid' : ''}`}
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="0901234567"
              />
              {fieldErrors.guestPhone && (
                <span className="form-error">{fieldErrors.guestPhone}</span>
              )}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="booking-email">
              Email liên hệ
            </label>
            <input
              id="booking-email"
              type="email"
              className={`form-input${fieldErrors.guestEmail ? ' is-invalid' : ''}`}
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="email@example.com"
            />
            {fieldErrors.guestEmail && <span className="form-error">{fieldErrors.guestEmail}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="booking-note">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              id="booking-note"
              rows={3}
              className="form-textarea"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Yêu cầu nhận phòng sớm, tầng cao, giường phụ..."
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Đang gửi đơn...' : 'Xác nhận đặt phòng'}
            </button>
            <Link to={`/hotels/${hotel.slug}`} className="btn btn-outline btn-lg">
              Quay lại khách sạn
            </Link>
          </div>
        </form>

        <aside className="booking-summary-card" aria-label="Tóm tắt đặt phòng">
          <h2 style={{ color: 'var(--navy)', fontSize: '1.15rem' }}>Tóm tắt đơn đặt phòng</h2>
          <div className="summary-row">
            <span>Khách sạn</span>
            <strong>{hotel.name}</strong>
          </div>
          <div className="summary-row">
            <span>Loại phòng</span>
            <strong>{selectedRoomType?.name}</strong>
          </div>
          <div className="summary-row">
            <span>Nhận phòng</span>
            <strong>{formatDate(checkIn) || '—'}</strong>
          </div>
          <div className="summary-row">
            <span>Trả phòng</span>
            <strong>{formatDate(checkOut) || '—'}</strong>
          </div>
          <div className="summary-row">
            <span>Số đêm</span>
            <strong>{nights} đêm</strong>
          </div>
          <div className="summary-row">
            <span>Số phòng</span>
            <strong>{Math.max(1, Number(rooms) || 1)} phòng</strong>
          </div>
          <div className="summary-row">
            <span>Đơn giá</span>
            <strong>{formatMoney(pricePerNight)} / đêm</strong>
          </div>
          {typeof selectedRoomType?.available === 'number' && (
            <div className="summary-row">
              <span>Phòng còn trống</span>
              <strong style={{ color: selectedRoomType.available > 0 ? 'var(--teal-dark)' : 'var(--danger)' }}>
                {selectedRoomType.available} phòng
              </strong>
            </div>
          )}

          <div className="summary-total">
            <span>Tổng tạm tính</span>
            <span style={{ color: 'var(--teal-dark)' }}>{formatMoney(estimatedTotal)}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Công thức: {nights} đêm × {Math.max(1, Number(rooms) || 1)} phòng ×{' '}
            {formatMoney(pricePerNight)}. Đơn tạo ra ở trạng thái Chờ xác nhận.
          </p>
        </aside>
      </div>
    </div>
  );
}
