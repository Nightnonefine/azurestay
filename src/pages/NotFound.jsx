import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container">
      <div className="card not-found-box">
        <div className="not-found-code">404</div>
        <h1>Không tìm thấy trang</h1>
        <p style={{ color: 'var(--muted)', margin: '12px 0 22px' }}>
          Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">
            Về trang chủ
          </Link>
          <Link to="/hotels" className="btn btn-outline">
            Tìm khách sạn
          </Link>
        </div>
      </div>
    </div>
  );
}
