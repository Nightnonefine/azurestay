import { Link } from 'react-router-dom';
import { amenityLabel, formatMoney, resolveImageUrl } from '../utils/format';

export default function RoomTypeCard({
  roomType,
  hotelSlug,
  checkIn,
  checkOut,
  amenityMap = null,
}) {
  const thumb = resolveImageUrl(roomType.images?.[0]);
  const hasAvailabilityInfo = typeof roomType.available === 'number';
  const isSoldOut = hasAvailabilityInfo && roomType.available <= 0;

  const bookParams = new URLSearchParams();
  bookParams.set('roomTypeId', String(roomType.id));
  if (checkIn) bookParams.set('checkIn', checkIn);
  if (checkOut) bookParams.set('checkOut', checkOut);
  const bookHref = `/hotels/${hotelSlug}/book?${bookParams.toString()}`;

  return (
    <article className="room-card">
      <div className="room-card-img">
        {thumb ? (
          <img src={thumb} alt={roomType.name} loading="lazy" />
        ) : (
          <div className="hotel-card-fallback">{roomType.name}</div>
        )}
      </div>

      <div>
        <h3 className="room-card-title">{roomType.name}</h3>
        <div className="room-specs">
          <span>Giường: {roomType.bedType}</span>
          <span>Hướng: {roomType.viewType}</span>
          <span>Diện tích: {roomType.sizeM2} m²</span>
          <span>
            Tối đa: {roomType.maxAdults} người lớn, {roomType.maxChildren} trẻ em
          </span>
          {roomType.hasBathtub && <span>Có bồn tắm</span>}
        </div>
        {roomType.description && <p className="room-desc">{roomType.description}</p>}
        {Array.isArray(roomType.amenities) && roomType.amenities.length > 0 && (
          <div className="amenity-chips">
            {roomType.amenities.map((code) => (
              <span key={code} className="amenity-chip">
                {amenityLabel(code, amenityMap)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="room-card-action">
        <div>
          <span className="hotel-price-label">Giá mỗi đêm</span>
          <span className="hotel-price-value">{formatMoney(roomType.pricePerNight)}</span>
        </div>

        {hasAvailabilityInfo ? (
          <span className={`room-availability ${isSoldOut ? 'sold-out' : 'in-stock'}`}>
            {isSoldOut ? 'Hết phòng' : `Còn ${roomType.available} phòng`}
          </span>
        ) : (
          <span className="hotel-price-label">Tổng {roomType.totalRooms} phòng</span>
        )}

        {isSoldOut ? (
          <button type="button" className="btn btn-outline btn-sm" disabled>
            Hết phòng
          </button>
        ) : (
          <Link to={bookHref} className="btn btn-primary btn-sm">
            Đặt phòng
          </Link>
        )}
      </div>
    </article>
  );
}
