import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div>
      <section className="page-banner">
        <div className="container">
          <h1>Về AzureStay</h1>
          <p>Nền tảng đặt phòng khách sạn trực tuyến minh bạch, nhanh chóng và đáng tin cậy.</p>
        </div>
      </section>

      <div className="container static-page">
        <div className="detail-section-card">
          <h2>Sứ mệnh của chúng tôi</h2>
          <p style={{ marginTop: 8 }}>
            AzureStay kết nối du khách với các khách sạn và khu nghỉ dưỡng chất lượng tại Đà Nẵng,
            Hà Nội, TP.HCM, Đà Lạt, Nha Trang và Phú Quốc. Mọi thông tin loại phòng, sức chứa, tiện
            ích và số phòng trống đều được đồng bộ trực tiếp từ hệ thống quản lý của đối tác lưu trú.
          </p>
        </div>

        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon">✓</div>
            <h3>Tồn kho chính xác</h3>
            <p>
              Số phòng trống được tính theo từng ngày dựa trên lượng đơn hiện có, đảm bảo giữ phòng
              ngay khi bạn hoàn tất đặt chỗ.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">₫</div>
            <h3>Giá cả minh bạch</h3>
            <p>
              Đơn giá mỗi đêm được hiển thị rõ ràng theo từng hạng phòng, không phát sinh chi phí ẩn
              khi nhận phòng.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">★</div>
            <h3>Đánh giá thực tế</h3>
            <p>
              Chỉ những khách hàng đã hoàn tất lưu trú mới có thể gửi nhận xét, giúp bạn tham khảo
              khách quan trước khi chọn phòng.
            </p>
          </article>
        </div>

        <div>
          <Link to="/hotels" className="btn btn-primary">
            Khám phá danh sách khách sạn
          </Link>
        </div>
      </div>
    </div>
  );
}
