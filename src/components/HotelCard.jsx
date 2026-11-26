import { Link } from 'react-router-dom';
import { amenityLabel, formatMoney, resolveImageUrl } from '../utils/format';

export default function HotelCard({ hotel, amenityMap = null, querySuffix = '' }) {
  const imageUrl = resolveImageUrl(hotel.coverImage);
  const starsText = '★'.repeat(Math.max(1, Math.min(5, hotel.starRating || 0)));
  const detailUrl = `/hotels/${hotel.slug}${querySuffix}`;

  return (
    <article className="hotel-card">
      <Link to={detailUrl} className="hotel-card-media">
        {imageUrl ? (
          <img src={imageUrl} alt={hotel.name} loading="lazy" />
        ) : (
          <div className="hotel-card-fallback">{hotel.name}</div>
        )}
        {hotel.featured && <span className="hotel-badge-featured">Nổi bật</span>}
      </Link>

      <div className="hotel-card-body">
        <div className="hotel-card-top">
          <span className="hotel-stars" aria-label={`${hotel.starRating} sao`}>
            {starsText}
          </span>
          <span className="hotel-rating-pill">
            {hotel.reviewCount > 0 ? `${hotel.ratingAverage.toFixed(1)} (${hotel.reviewCount})` : 'Mới'}
          </span>
        </div>

        <Link to={detailUrl} className="hotel-card-title">
          {hotel.name}
        </Link>

        <p className="hotel-card-location">
          {hotel.district}, {hotel.city}
        </p>

        {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
          <div className="amenity-chips">
            {hotel.amenities.slice(0, 3).map((code) => (
              <span key={code} className="amenity-chip">
                {amenityLabel(code, amenityMap)}
              </span>
            ))}
          </div>
        )}

        <div className="hotel-card-footer">
          <div>
            <span className="hotel-price-label">Giá mỗi đêm từ</span>
            <span className="hotel-price-value">{formatMoney(hotel.priceFrom)}</span>
          </div>
          <Link to={detailUrl} className="btn btn-navy btn-sm">
            Xem phòng
          </Link>
        </div>
      </div>
    </article>
  );
}
