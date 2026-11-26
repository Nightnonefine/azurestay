import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">AzureStay</div>
            <p className="footer-desc">
              Nền tảng đặt phòng khách sạn và khu nghỉ dưỡng minh bạch giá cả, kiểm tra phòng trống theo
              thời gian thực tại các điểm đến hàng đầu Việt Nam.
            </p>
          </div>

          <div>
            <div className="footer-title">Khám phá</div>
            <ul className="footer-list">
              <li>
                <Link to="/hotels">Danh sách khách sạn</Link>
              </li>
              <li>
                <Link to="/hotels?city=%C4%90%C3%A0%20N%E1%BA%B5ng">Khách sạn Đà Nẵng</Link>
              </li>
              <li>
                <Link to="/hotels?city=H%C3%A0%20N%E1%BB%99i">Khách sạn Hà Nội</Link>
              </li>
              <li>
                <Link to="/hotels?city=Ph%C3%BA%20Qu%E1%BB%91c">Nghỉ dưỡng Phú Quốc</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-title">Khách hàng</div>
            <ul className="footer-list">
              <li>
                <Link to="/account">Thông tin tài khoản</Link>
              </li>
              <li>
                <Link to="/account/bookings">Đơn đặt phòng của tôi</Link>
              </li>
              <li>
                <Link to="/about-us">Về AzureStay</Link>
              </li>
              <li>
                <Link to="/contact">Liên hệ hỗ trợ</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-title">Hỗ trợ 24/7</div>
            <ul className="footer-list">
              <li>Hotline: 1900 6868</li>
              <li>Email: support@azurestay.vn</li>
              <li>97 Man Thiện, TP. Thủ Đức, TP.HCM</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AzureStay. Đồ án Lập trình Web PTIT HCM.</span>
          <span>Giá hiển thị bằng VND • Hỗ trợ tiếng Việt</span>
        </div>
      </div>
    </footer>
  );
}
