import { NavLink } from 'react-router-dom';

const OWNER_TABS = [
  { to: '/owner', label: 'Tổng quan', end: true },
  { to: '/owner/hotels', label: 'Khách sạn của tôi' },
  { to: '/owner/bookings', label: 'Đơn đặt phòng' },
  { to: '/owner/stats', label: 'Thống kê' },
];

const ADMIN_TABS = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/users', label: 'Người dùng' },
  { to: '/admin/hotels', label: 'Khách sạn' },
  { to: '/admin/stats', label: 'Thống kê' },
];

// Thanh điều hướng phụ dùng chung cho khu vực Owner và Admin.
export default function PortalNav({ area = 'owner' }) {
  const tabs = area === 'admin' ? ADMIN_TABS : OWNER_TABS;
  const label = area === 'admin' ? 'Điều hướng quản trị' : 'Điều hướng chủ khách sạn';

  return (
    <nav className="portal-tabs" aria-label={label}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={Boolean(tab.end)}
          className={({ isActive }) => `portal-tab${isActive ? ' active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
