import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function RequireRole({ roles = [], children }) {
  const { user, isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <Spinner text="Đang kiểm tra quyền truy cập..." />;
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="container">
        <div className="card not-found-box">
          <div className="not-found-code">403</div>
          <h1>Bạn không có quyền truy cập trang này</h1>
          <p style={{ color: 'var(--muted)', margin: '12px 0 22px' }}>
            Tài khoản hiện tại không thuộc nhóm quyền được phép mở khu vực này.
          </p>
          <Link to="/" className="btn btn-primary">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return children || <Outlet />;
}
