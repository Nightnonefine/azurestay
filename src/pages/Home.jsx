import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import HotelCard from '../components/HotelCard';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage, hotelApi, metaApi } from '../services/api';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      hotelApi.search({ sort: 'popular', pageSize: 6 }),
      metaApi.cities().catch(() => []),
      metaApi.amenities().catch(() => []),
    ])
      .then(([hotelRes, cityList, amenityList]) => {
        if (!active) return;
        setHotels(Array.isArray(hotelRes?.items) ? hotelRes.items : []);
        setCities(Array.isArray(cityList) ? cityList : []);
        setAmenities(Array.isArray(amenityList) ? amenityList : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Không tải được danh sách khách sạn nổi bật.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const amenityMap = useMemo(() => {
    const map = {};
    amenities.forEach((a) => {
      map[a.code] = a.label;
    });
    return map;
  }, [amenities]);

  return (
    <div>
      <section className="hero-section">
        <div className="container">
          <span className="hero-eyebrow">Đặt phòng trực tuyến toàn quốc</span>
          <h1 className="hero-title">Tìm nơi lưu trú lý tưởng cho mọi chuyến đi cùng AzureStay</h1>
          <p className="hero-subtitle">
            Kiểm tra phòng trống theo thời gian thực, so sánh hạng sao và tiện ích rõ ràng, giá niêm
            yết minh bạch bằng VND.
          </p>

          <div className="hero-search-wrap">
            <SearchBar cities={cities} />
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Khách sạn nổi bật</h2>
              <p>Những điểm dừng chân được đánh giá cao và nhiều du khách lựa chọn nhất.</p>
            </div>
            <Link to="/hotels" className="btn btn-outline btn-sm">
              Xem tất cả khách sạn →
            </Link>
          </div>

          {loading ? (
            <Spinner text="Đang tải danh sách khách sạn nổi bật..." />
          ) : error ? (
            <div className="alert alert-error">
              <p>{error}</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setReloadKey((k) => k + 1)}
                style={{ marginTop: 10 }}
              >
                Thử tải lại
              </button>
            </div>
          ) : hotels.length === 0 ? (
            <EmptyState
              title="Chưa có khách sạn nổi bật"
              description="Hệ thống hiện chưa có khách sạn đang mở bán. Vui lòng quay lại sau."
            />
          ) : (
            <div className="hotel-grid">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} amenityMap={amenityMap} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Vì sao chọn AzureStay?</h2>
              <p>Trải nghiệm đặt phòng đơn giản, chính xác từ lúc tìm kiếm đến khi nhận phòng.</p>
            </div>
          </div>

          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-icon">1</div>
              <h3>Tồn kho phòng theo ngày thực</h3>
              <p>
                Số lượng phòng trống được tính trực tiếp từ lịch đặt hiện hành, hạn chế tình trạng hết
                phòng sau khi xác nhận.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">2</div>
              <h3>Giá hiển thị rõ ràng</h3>
              <p>
                Giá từng đêm được niêm yết đầy đủ theo loại phòng, giúp bạn dễ dàng ước tính tổng chi
                phí trước khi đặt.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">3</div>
              <h3>Quản lý đơn linh hoạt</h3>
              <p>
                Theo dõi mã đặt phòng, kiểm tra trạng thái xác nhận và chủ động huỷ đơn trực tuyến khi
                kế hoạch thay đổi.
              </p>
            </article>
          </div>

          <div className="cta-banner">
            <div>
              <h2>Sẵn sàng cho kỳ nghỉ tiếp theo?</h2>
              <p>
                {isAuthenticated
                  ? 'Khám phá ngay hàng loạt khách sạn trên toàn quốc hoặc xem lại lịch sử đặt phòng của bạn.'
                  : 'Tạo tài khoản AzureStay miễn phí để đặt phòng nhanh hơn và quản lý toàn bộ đơn đặt tại một nơi.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <>
                  <Link to="/hotels" className="btn btn-primary">
                    Tìm khách sạn ngay
                  </Link>
                  <Link to="/account/bookings" className="btn btn-navy">
                    Đơn của tôi
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    Đăng ký tài khoản
                  </Link>
                  <Link to="/hotels" className="btn btn-outline">
                    Khám phá phòng
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
