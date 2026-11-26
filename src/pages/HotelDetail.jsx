import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import DateRangeInput from '../components/DateRangeInput';
import EmptyState from '../components/EmptyState';
import ReviewList from '../components/ReviewList';
import RoomTypeCard from '../components/RoomTypeCard';
import Spinner from '../components/Spinner';
import { getApiErrorMessage, hotelApi, metaApi } from '../services/api';
import { addDaysIso, todayIso, validateDateRange } from '../utils/dates';
import { amenityLabel, formatDate, formatMoney, resolveImageUrl } from '../utils/format';

export default function HotelDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultCheckIn = todayIso();
  const defaultCheckOut = addDaysIso(defaultCheckIn, 2);

  const [checkIn, setCheckIn] = useState(() => searchParams.get('checkIn') || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(() => searchParams.get('checkOut') || defaultCheckOut);
  const [appliedDates, setAppliedDates] = useState(() => ({
    checkIn: searchParams.get('checkIn') || defaultCheckIn,
    checkOut: searchParams.get('checkOut') || defaultCheckOut,
  }));
  const [dateError, setDateError] = useState('');

  const [hotel, setHotel] = useState(null);
  const [availabilityDays, setAvailabilityDays] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [availLoading, setAvailLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    metaApi
      .amenities()
      .then((list) => setAmenities(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const amenityMap = useMemo(() => {
    const map = {};
    amenities.forEach((a) => {
      map[a.code] = a.label;
    });
    return map;
  }, [amenities]);

  // Tải thông tin khách sạn kèm tồn kho theo khoảng ngày đang áp dụng.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const dateCheck = validateDateRange(appliedDates.checkIn, appliedDates.checkOut);
    const params = dateCheck.valid
      ? { checkIn: appliedDates.checkIn, checkOut: appliedDates.checkOut }
      : {};

    hotelApi
      .detail(slug, params)
      .then((data) => {
        if (!active) return;
        setHotel(data);
        setSelectedImageIdx(0);
      })
      .catch((err) => {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Không tải được thông tin khách sạn.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, appliedDates.checkIn, appliedDates.checkOut, reloadTick]);

  // Gọi API /availability khi đổi ngày để hiển thị lịch trống từng ngày.
  useEffect(() => {
    const dateCheck = validateDateRange(appliedDates.checkIn, appliedDates.checkOut);
    if (!dateCheck.valid || !slug) {
      setAvailabilityDays([]);
      return undefined;
    }

    let active = true;
    setAvailLoading(true);

    hotelApi
      .availability(slug, { from: appliedDates.checkIn, to: appliedDates.checkOut })
      .then((days) => {
        if (!active) return;
        setAvailabilityDays(Array.isArray(days) ? days : []);
      })
      .catch(() => {
        if (!active) return;
        setAvailabilityDays([]);
      })
      .finally(() => {
        if (active) setAvailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, appliedDates.checkIn, appliedDates.checkOut]);

  function handleApplyDates(e) {
    e.preventDefault();
    const check = validateDateRange(checkIn, checkOut);
    if (!check.valid) {
      setDateError(check.error);
      return;
    }
    setDateError('');
    setAppliedDates({ checkIn, checkOut });
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('checkIn', checkIn);
    nextParams.set('checkOut', checkOut);
    setSearchParams(nextParams, { replace: true });
  }

  if (loading) {
    return (
      <div className="container detail-page">
        <Spinner text="Đang tải chi tiết khách sạn..." />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="container detail-page">
        <div className="alert alert-error">
          <p>{error || 'Không tìm thấy khách sạn.'}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setReloadTick((t) => t + 1)}
            >
              Thử lại
            </button>
            <Link to="/hotels" className="btn btn-primary btn-sm">
              Về danh sách khách sạn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gallery = Array.isArray(hotel.images) && hotel.images.length > 0
    ? hotel.images
    : hotel.coverImage
      ? [hotel.coverImage]
      : [];
  const activeImage = resolveImageUrl(gallery[selectedImageIdx] || gallery[0]);
  const starsText = '★'.repeat(Math.max(1, Math.min(5, hotel.starRating || 0)));

  return (
    <div className="container detail-page">
      <nav className="breadcrumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/hotels">Khách sạn</Link>
        <span>/</span>
        <span>{hotel.name}</span>
      </nav>

      <header className="detail-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="hotel-stars">{starsText}</span>
            <span className="hotel-rating-pill">
              {hotel.reviewCount > 0
                ? `${hotel.ratingAverage.toFixed(1)} / 5 (${hotel.reviewCount} đánh giá)`
                : 'Chưa có đánh giá'}
            </span>
          </div>
          <h1>{hotel.name}</h1>
          <p style={{ color: 'var(--muted)' }}>
            {hotel.address} — {hotel.district}, {hotel.city}
          </p>
        </div>

        <div className="detail-price-box">
          <span className="hotel-price-label">Giá mỗi đêm từ</span>
          <div className="hotel-price-value" style={{ fontSize: '1.35rem' }}>
            {formatMoney(hotel.priceFrom)}
          </div>
        </div>
      </header>

      {gallery.length > 0 && (
        <section className="detail-gallery" aria-label="Thư viện ảnh khách sạn">
          <div className="gallery-main">
            <img src={activeImage} alt={hotel.name} />
          </div>
          {gallery.length > 1 && (
            <div className="gallery-thumbs">
              {gallery.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  className={`gallery-thumb${idx === selectedImageIdx ? ' active' : ''}`}
                  onClick={() => setSelectedImageIdx(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                >
                  <img src={resolveImageUrl(url)} alt={`${hotel.name} - ảnh ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <form className="detail-date-panel" onSubmit={handleApplyDates}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <DateRangeInput
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={({ checkIn: ci, checkOut: co }) => {
              setCheckIn(ci);
              setCheckOut(co);
            }}
          />
          {dateError && (
            <div className="form-error" style={{ marginTop: 6 }}>
              {dateError}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary">
          Kiểm tra phòng trống
        </button>
      </form>

      <section className="detail-info-grid">
        <div className="detail-section-card">
          <h2>Giới thiệu khách sạn</h2>
          <p style={{ whiteSpace: 'pre-line', color: 'var(--text)' }}>{hotel.description}</p>
        </div>

        <div className="detail-section-card">
          <h2>Tiện ích nổi bật</h2>
          {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 ? (
            <div className="amenity-chips">
              {hotel.amenities.map((code) => (
                <span key={code} className="amenity-chip">
                  {amenityLabel(code, amenityMap)}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>Đang cập nhật danh sách tiện ích.</p>
          )}
        </div>
      </section>

      <section>
        <div className="section-head">
          <div>
            <h2>Chọn loại phòng</h2>
            <p>
              Hiển thị tình trạng phòng trống từ {formatDate(appliedDates.checkIn)} đến{' '}
              {formatDate(appliedDates.checkOut)}.
            </p>
          </div>
        </div>

        {Array.isArray(hotel.roomTypes) && hotel.roomTypes.length > 0 ? (
          <div className="room-list">
            {hotel.roomTypes.map((rt) => (
              <RoomTypeCard
                key={rt.id}
                roomType={rt}
                hotelSlug={hotel.slug}
                checkIn={appliedDates.checkIn}
                checkOut={appliedDates.checkOut}
                amenityMap={amenityMap}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có loại phòng mở bán"
            description="Khách sạn này hiện chưa có loại phòng hoạt động."
          />
        )}
      </section>

      <section className="detail-section-card">
        <h2>Lịch phòng trống theo từng ngày</h2>
        {availLoading ? (
          <Spinner text="Đang kiểm tra lịch phòng trống..." />
        ) : availabilityDays.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Không có dữ liệu lịch trống cho khoảng ngày đã chọn.</p>
        ) : (
          <div className="availability-table-wrap">
            <table className="availability-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  {(availabilityDays[0]?.roomTypes || []).map((rt) => (
                    <th key={rt.id}>{rt.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availabilityDays.map((day) => (
                  <tr key={day.date}>
                    <td>{formatDate(day.date)}</td>
                    {day.roomTypes.map((rt) => (
                      <td key={rt.id}>
                        {rt.available > 0 ? (
                          <span style={{ color: 'var(--teal-dark)', fontWeight: 600 }}>
                            Còn {rt.available}/{rt.total}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Hết phòng</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-section-card">
        <h2>Đánh giá của khách hàng ({hotel.reviewCount})</h2>
        <ReviewList slug={hotel.slug} />
      </section>
    </div>
  );
}
