import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { ownerApi } from '../../services/api';
import '../../styles/owner.css';
import { addDaysIso, todayIso } from '../../utils/dates';
import { formatDate, formatMoney, hotelStatusLabel } from '../../utils/format';
import {
  calculateAverageOccupancy,
  fetchAllOwnerHotels,
  formatOwnerApiError,
} from '../../utils/portal';

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotels, setHotels] = useState([]);
  const [stats, setStats] = useState(null);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const today = todayIso();
      const tomorrow = addDaysIso(today, 1);

      const [allHotels, statsRes, todayBookingsRes, recentRes] = await Promise.all([
        fetchAllOwnerHotels(),
        ownerApi.stats(),
        ownerApi.bookings({ from: today, to: tomorrow, page: 1, pageSize: 1 }),
        ownerApi.bookings({ page: 1, pageSize: 5, sort: 'newest' }),
      ]);

      setHotels(allHotels);
      setStats(statsRes);
      setTodayBookingsCount(todayBookingsRes?.total || 0);
      setRecentBookings(recentRes?.items || []);
    } catch (err) {
      setError(formatOwnerApiError(err, 'Không tải được dữ liệu tổng quan chủ khách sạn.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const pendingHotels = hotels.filter((h) => h.status === 'Pending');
  const activeCount = hotels.filter((h) => h.status === 'Active').length;
  const avgOccupancy = calculateAverageOccupancy(stats?.roomTypeOccupancy);

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Kênh chủ khách sạn</h1>
          <p className="portal-subtitle">
            Theo dõi nhanh tình hình kinh doanh, đơn đặt phòng và trạng thái duyệt khách sạn của bạn.
          </p>
        </div>
        <div className="portal-header-actions">
          <Link to="/owner/hotels/new" className="btn btn-primary btn-sm">
            + Thêm khách sạn
          </Link>
          <Link to="/owner/bookings" className="btn btn-outline btn-sm">
            Quản lý đơn đặt
          </Link>
        </div>
      </div>

      <PortalNav area="owner" />

      {loading ? (
        <Spinner text="Đang tải tổng quan kênh chủ khách sạn..." />
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadDashboard}
            style={{ marginTop: 10 }}
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {pendingHotels.length > 0 && (
            <div className="alert alert-warning">
              <strong>Thông báo duyệt khách sạn:</strong> Bạn đang có{' '}
              <strong>{pendingHotels.length}</strong> khách sạn ở trạng thái{' '}
              <strong>Chờ duyệt</strong> ({pendingHotels.map((h) => h.name).join(', ')}). Khách sạn
              chỉ hiển thị công khai sau khi quản trị viên phê duyệt.
            </div>
          )}

          <section className="kpi-grid" aria-label="Chỉ số nổi bật">
            <article className="kpi-card">
              <span className="kpi-label">Khách sạn của tôi</span>
              <span className="kpi-value">{hotels.length}</span>
              <span className="kpi-sub">
                {activeCount} đang hoạt động · {pendingHotels.length} chờ duyệt
              </span>
            </article>

            <article className="kpi-card">
              <span className="kpi-label">Đơn lưu trú hôm nay</span>
              <span className="kpi-value">{todayBookingsCount}</span>
              <span className="kpi-sub">
                Tổng 30 ngày: {stats?.totalBookings ?? 0} đơn
              </span>
            </article>

            <article className="kpi-card">
              <span className="kpi-label">Doanh thu 30 ngày</span>
              <span className="kpi-value accent">{formatMoney(stats?.totalRevenue || 0)}</span>
              <span className="kpi-sub">
                {stats?.soldRoomNights ?? 0} đêm phòng đã bán
              </span>
            </article>

            <article className="kpi-card">
              <span className="kpi-label">Công suất trung bình</span>
              <span className="kpi-value">{avgOccupancy}%</span>
              <span className="kpi-sub">Tính trên loại phòng đang mở bán</span>
            </article>
          </section>

          <section className="portal-card">
            <div className="portal-card-head">
              <h2>5 đơn đặt phòng mới nhất</h2>
              <Link to="/owner/bookings" className="btn btn-outline btn-sm">
                Xem tất cả đơn
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <EmptyState
                icon="📋"
                title="Chưa có đơn đặt phòng nào"
                description="Khi khách đặt phòng tại khách sạn của bạn, 5 đơn mới nhất sẽ hiển thị tại đây."
              />
            ) : (
              <div className="table-wrap">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Khách sạn / Phòng</th>
                      <th>Ngày lưu trú</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td data-label="Mã đơn">
                          <span className="code-pill">#{b.code}</span>
                        </td>
                        <td data-label="Khách hàng">
                          <div className="table-title">{b.guestName}</div>
                          <div className="table-sub">{b.guestPhone}</div>
                        </td>
                        <td data-label="Khách sạn / Phòng">
                          <div className="table-title">{b.hotelName}</div>
                          <div className="table-sub">
                            {b.roomTypeName} · {b.rooms} phòng
                          </div>
                        </td>
                        <td data-label="Ngày lưu trú">
                          {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                          <div className="table-sub">{b.nights} đêm</div>
                        </td>
                        <td data-label="Tổng tiền">
                          <strong>{formatMoney(b.totalAmount)}</strong>
                        </td>
                        <td data-label="Trạng thái">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {hotels.length > 0 && (
            <section className="portal-card">
              <div className="portal-card-head">
                <h2>Khách sạn đang quản lý</h2>
                <Link to="/owner/hotels" className="btn btn-outline btn-sm">
                  Quản lý danh sách
                </Link>
              </div>
              <div className="table-wrap">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Khách sạn</th>
                      <th>Thành phố</th>
                      <th>Loại phòng</th>
                      <th>Trạng thái duyệt</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotels.slice(0, 5).map((h) => (
                      <tr key={h.id}>
                        <td data-label="Khách sạn">
                          <div className="table-title">{h.name}</div>
                          <div className="table-sub">{h.district}</div>
                        </td>
                        <td data-label="Thành phố">{h.city}</td>
                        <td data-label="Loại phòng">{h.roomTypeCount} loại</td>
                        <td data-label="Trạng thái duyệt">
                          <StatusBadge status={h.status} label={hotelStatusLabel(h.status)} />
                        </td>
                        <td data-label="Thao tác">
                          <div className="table-actions">
                            <Link to={`/owner/hotels/${h.id}`} className="btn btn-outline btn-sm">
                              Chi tiết
                            </Link>
                            <Link
                              to={`/owner/hotels/${h.id}/calendar`}
                              className="btn btn-outline btn-sm"
                            >
                              Xem lịch
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
