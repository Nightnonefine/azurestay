import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Tự động đóng menu khi chuyển trang.
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname, location.search]);

  // Đóng dropdown tài khoản khi bấm ra ngoài.
  useEffect(() => {
    function handleOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate('/');
  }

  const isOwner = user?.role === 'Owner';
  const isAdmin = user?.role === 'Admin';
  // Phân quyền hiển thị menu khu vực Owner/Admin dựa trên role lấy từ /auth/me.
  const canAccessOwner = isOwner || isAdmin;

  const initials = (user?.fullName || user?.email || 'K')
    .trim()
    .split(/\s+/)
    .slice(-1)[0]
    .charAt(0)
    .toUpperCase();

  return (
    <header className="site-header">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo" aria-label="AzureStay Trang chủ">
          <span className="brand-mark">A</span>
          <span>
            Azure<span className="brand-accent">Stay</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Điều hướng chính">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/hotels" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Khách sạn
          </NavLink>
          <NavLink to="/about-us" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Giới thiệu
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Liên hệ
          </NavLink>
          {canAccessOwner && (
            <NavLink to="/owner" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Kênh chủ khách sạn
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Quản trị
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="user-menu-trigger"
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <span className="user-avatar">{initials}</span>
                <span className="user-name-text">{user.fullName || user.email}</span>
                <span aria-hidden="true">▾</span>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="user-dropdown-meta">
                    <strong>{user.fullName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/account" className="user-dropdown-item" role="menuitem">
                    Tài khoản
                  </Link>
                  <Link to="/account/bookings" className="user-dropdown-item" role="menuitem">
                    Đơn của tôi
                  </Link>
                  {canAccessOwner && (
                    <Link to="/owner" className="user-dropdown-item" role="menuitem">
                      Kênh chủ khách sạn
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="user-dropdown-item" role="menuitem">
                      Quản trị hệ thống
                    </Link>
                  )}
                  <button
                    type="button"
                    className="user-dropdown-item danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Đăng ký
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="mobile-toggle"
          aria-label="Mở menu điều hướng"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-drawer" role="dialog" aria-label="Menu di động">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/hotels" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Khách sạn
          </NavLink>
          <NavLink to="/about-us" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Giới thiệu
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Liên hệ
          </NavLink>
          {canAccessOwner && (
            <NavLink to="/owner" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Kênh chủ khách sạn
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Quản trị
            </NavLink>
          )}

          <div className="mobile-drawer-actions">
            {isAuthenticated ? (
              <>
                <Link to="/account" className="btn btn-outline btn-sm">
                  Tài khoản ({user.fullName})
                </Link>
                <Link to="/account/bookings" className="btn btn-outline btn-sm">
                  Đơn của tôi
                </Link>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
