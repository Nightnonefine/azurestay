import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import { adminApi, getApiErrorMessage } from '../../services/api';
import '../../styles/owner.css';
import '../../styles/admin.css';
import {
  formatMoney,
  hotelStatusLabel,
  roleLabel,
  statusLabel,
  userStatusLabel,
} from '../../utils/format';
import { fetchAllAdminHotels } from '../../utils/portal';

const ROLES_ORDER = ['Customer', 'Owner', 'Admin'];
const HOTEL_STATUS_ORDER = ['Active', 'Pending', 'Suspended', 'Rejected'];
const BOOKING_STATUS_ORDER = ['Pending', 'Confirmed', 'CheckedIn', 'Completed', 'Cancelled'];

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [allHotels, setAllHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, hotelsRes] = await Promise.all([
        adminApi.stats(),
        fetchAllAdminHotels(),
      ]);
      setStats(statsRes);
      setAllHotels(hotelsRes);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được thống kê hệ thống.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Tổng hợp số lượng khách sạn theo từng thành phố từ danh sách khách sạn thật trên API.
  const hotelsByCity = useMemo(() => {
    const map = new Map();
    allHotels.forEach((h) => {
      const key = h.city || 'Khác';
      const entry = map.get(key) || { city: key, total: 0, active: 0 };
      entry.total += 1;
      if (h.status === 'Active') entry.active += 1;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.city.localeCompare(b.city, 'vi'));
  }, [allHotels]);

  const maxTopRevenue = useMemo(() => {
    const list = stats?.topHotels || [];
    return list.reduce((acc, item) => Math.max(acc, Number(item.revenue || 0)), 0);
  }, [stats]);

  const maxCityCount = useMemo(
    () => hotelsByCity.reduce((acc, item) => Math.max(acc, item.total), 0),
    [hotelsByCity],
  );

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Thống kê toàn hệ thống</h1>
          <p className="portal-subtitle">
            Tổng hợp chi tiết người dùng, khách sạn theo thành phố, đơn đặt phòng và top doanh thu.
          </p>
        </div>
        <div className="portal-header-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={loadStats} disabled={loading}>
            Làm mới số liệu
          </button>
        </div>
      </div>

      <PortalNav area="admin" />

      {loading ? (
        <Spinner text="Đang tổng hợp thống kê hệ thống..." />
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadStats}
            style={{ marginTop: 10 }}
          >
            Thử lại
          </button>
        </div>
      ) : (
        stats && (
          <>
            <section className="kpi-grid">
              <article className="kpi-card">
                <span className="kpi-label">Tổng người dùng</span>
                <span className="kpi-value">{stats.totalUsers}</span>
                <span className="kpi-sub">
                  {userStatusLabel('Active')}: {stats.usersByStatus?.Active ?? 0} ·{' '}
                  {userStatusLabel('Locked')}: {stats.usersByStatus?.Locked ?? 0}
                </span>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Tổng khách sạn</span>
                <span className="kpi-value">{stats.totalHotels}</span>
                <span className="kpi-sub">
                  Hoạt động: {stats.hotelsByStatus?.Active ?? 0} · Chờ duyệt:{' '}
                  {stats.hotelsByStatus?.Pending ?? 0}
                </span>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Tổng doanh thu Paid</span>
                <span className="kpi-value accent">{formatMoney(stats.totalPaidRevenue)}</span>
                <span className="kpi-sub">Thanh toán VNPay đã xác nhận</span>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Tổng đơn đặt phòng</span>
                <span className="kpi-value">{stats.totalBookings}</span>
                <span className="kpi-sub">
                  Hoàn thành: {stats.bookingsByStatus?.Completed ?? 0}
                </span>
              </article>
            </section>

            <div className="stats-two-col">
              <section className="portal-card">
                <div className="portal-card-head">
                  <h2>Số đơn theo trạng thái</h2>
                </div>
                <div className="bar-list">
                  {BOOKING_STATUS_ORDER.map((key) => {
                    const count = stats.bookingsByStatus?.[key] ?? 0;
                    const pct =
                      stats.totalBookings > 0
                        ? Math.round((count / stats.totalBookings) * 100)
                        : 0;
                    return (
                      <div key={key} className="bar-row">
                        <div className="bar-row-head">
                          <span>{statusLabel(key)}</span>
                          <span>
                            {count} đơn ({pct}%)
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className={`progress-fill${key === 'Cancelled' ? ' danger' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="portal-card">
                <div className="portal-card-head">
                  <h2>Người dùng &amp; Khách sạn theo nhóm</h2>
                </div>
                <div className="bar-list">
                  {ROLES_ORDER.map((roleKey) => {
                    const count = stats.usersByRole?.[roleKey] ?? 0;
                    const pct =
                      stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
                    return (
                      <div key={roleKey} className="bar-row">
                        <div className="bar-row-head">
                          <span>Vai trò: {roleLabel(roleKey)}</span>
                          <span>
                            {count} tài khoản ({pct}%)
                          </span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}

                  {HOTEL_STATUS_ORDER.map((statusKey) => {
                    const count = stats.hotelsByStatus?.[statusKey] ?? 0;
                    const pct =
                      stats.totalHotels > 0 ? Math.round((count / stats.totalHotels) * 100) : 0;
                    return (
                      <div key={statusKey} className="bar-row">
                        <div className="bar-row-head">
                          <span>Khách sạn: {hotelStatusLabel(statusKey)}</span>
                          <span>
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className={`progress-fill${
                              statusKey === 'Suspended' || statusKey === 'Rejected'
                                ? ' danger'
                                : ' gold'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <section className="portal-card">
              <div className="portal-card-head">
                <h2>Số khách sạn theo thành phố</h2>
                <span className="table-sub">{hotelsByCity.length} thành phố</span>
              </div>
              {hotelsByCity.length === 0 ? (
                <EmptyState
                  icon="🗺️"
                  title="Chưa có dữ liệu thành phố"
                  description="Chưa có khách sạn nào trong hệ thống."
                />
              ) : (
                <div className="city-bars-grid">
                  {hotelsByCity.map((item) => {
                    const pct =
                      maxCityCount > 0 ? Math.round((item.total / maxCityCount) * 100) : 0;
                    return (
                      <div key={item.city} className="city-stat-box">
                        <div className="city-stat-top">
                          <span>{item.city}</span>
                          <span>{item.total} khách sạn</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="table-sub">{item.active} đang hoạt động</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="portal-card">
              <div className="portal-card-head">
                <h2>Top 5 khách sạn theo doanh thu</h2>
              </div>
              {!stats.topHotels || stats.topHotels.length === 0 ? (
                <EmptyState
                  icon="🏆"
                  title="Chưa có doanh thu thanh toán"
                  description="Bảng xếp hạng sẽ hiển thị khi có giao dịch thanh toán thành công."
                />
              ) : (
                <div className="table-wrap">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Hạng</th>
                        <th>Khách sạn</th>
                        <th>Thành phố</th>
                        <th>Số giao dịch</th>
                        <th>Tỷ trọng</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topHotels.map((item, idx) => {
                        const pct =
                          maxTopRevenue > 0
                            ? Math.round((Number(item.revenue || 0) / maxTopRevenue) * 100)
                            : 0;
                        return (
                          <tr key={item.hotelId}>
                            <td data-label="Hạng">
                              <span className="code-pill">#{idx + 1}</span>
                            </td>
                            <td data-label="Khách sạn">
                              <Link to={`/hotels/${item.slug}`} className="table-title">
                                {item.hotelName}
                              </Link>
                            </td>
                            <td data-label="Thành phố">{item.city}</td>
                            <td data-label="Số giao dịch">{item.bookingCount}</td>
                            <td data-label="Tỷ trọng">
                              <div className="progress-inline">
                                <div className="progress-track">
                                  <div className="progress-fill gold" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </td>
                            <td data-label="Doanh thu">
                              <strong>{formatMoney(item.revenue)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}
