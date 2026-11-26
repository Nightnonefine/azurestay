import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { adminApi, getApiErrorMessage } from '../../services/api';
import '../../styles/owner.css';
import '../../styles/admin.css';
import { formatDate, formatMoney, hotelStatusLabel } from '../../utils/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingHotels, setPendingHotels] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [decisionTarget, setDecisionTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, pendingRes] = await Promise.all([
        adminApi.stats(),
        adminApi.hotels({ status: 'Pending', sort: 'oldest', page: 1, pageSize: 10 }),
      ]);
      setStats(statsRes);
      setPendingHotels(pendingRes?.items || []);
      setPendingTotal(pendingRes?.total || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được dữ liệu quản trị hệ thống.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function confirmDecision() {
    if (!decisionTarget) return;
    setSubmitting(true);
    setFeedback({ type: '', text: '' });
    try {
      await adminApi.updateHotelStatus(decisionTarget.hotel.id, {
        status: decisionTarget.status,
      });
      setFeedback({
        type: 'success',
        text: `Đã ${decisionTarget.status === 'Active' ? 'duyệt' : 'từ chối'} khách sạn "${decisionTarget.hotel.name}".`,
      });
      setDecisionTarget(null);
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Không thể cập nhật trạng thái khách sạn.'),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Quản trị hệ thống AzureStay</h1>
          <p className="portal-subtitle">
            Giám sát người dùng, phê duyệt khách sạn mới và theo dõi doanh thu toàn nền tảng.
          </p>
        </div>
        <div className="portal-header-actions">
          <Link to="/admin/hotels" className="btn btn-primary btn-sm">
            Quản lý khách sạn
          </Link>
          <Link to="/admin/users" className="btn btn-outline btn-sm">
            Quản lý người dùng
          </Link>
        </div>
      </div>

      <PortalNav area="admin" />

      {feedback.text && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <Spinner text="Đang tải tổng quan quản trị..." />
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadData}
            style={{ marginTop: 10 }}
          >
            Thử lại
          </button>
        </div>
      ) : (
        stats && (
          <>
            <section className="kpi-grid" aria-label="Số liệu hệ thống">
              <article className="kpi-card">
                <span className="kpi-label">Người dùng</span>
                <span className="kpi-value">{stats.totalUsers}</span>
                <div className="admin-stat-pills">
                  <span className="admin-stat-pill">
                    Khách: {stats.usersByRole?.Customer ?? 0}
                  </span>
                  <span className="admin-stat-pill">
                    Owner: {stats.usersByRole?.Owner ?? 0}
                  </span>
                  <span className="admin-stat-pill">
                    Admin: {stats.usersByRole?.Admin ?? 0}
                  </span>
                </div>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Khách sạn</span>
                <span className="kpi-value">{stats.totalHotels}</span>
                <div className="admin-stat-pills">
                  <span className="admin-stat-pill">
                    Hoạt động: {stats.hotelsByStatus?.Active ?? 0}
                  </span>
                  <span className="admin-stat-pill">
                    Chờ duyệt: {stats.hotelsByStatus?.Pending ?? 0}
                  </span>
                  <span className="admin-stat-pill">
                    Tạm ngưng: {stats.hotelsByStatus?.Suspended ?? 0}
                  </span>
                </div>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Tổng doanh thu đã thanh toán</span>
                <span className="kpi-value accent">{formatMoney(stats.totalPaidRevenue)}</span>
                <span className="kpi-sub">Tính từ giao dịch VNPay thành công</span>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Tổng đơn đặt phòng</span>
                <span className="kpi-value">{stats.totalBookings}</span>
                <span className="kpi-sub">
                  Hoàn thành: {stats.bookingsByStatus?.Completed ?? 0} · Đã xác nhận:{' '}
                  {stats.bookingsByStatus?.Confirmed ?? 0}
                </span>
              </article>
            </section>

            <section className="portal-card">
              <div className="portal-card-head">
                <h2>Khách sạn đang chờ duyệt ({pendingTotal})</h2>
                <Link to="/admin/hotels?status=Pending" className="btn btn-outline btn-sm">
                  Xem toàn bộ danh sách
                </Link>
              </div>

              {pendingHotels.length === 0 ? (
                <EmptyState
                  icon="✅"
                  title="Không còn khách sạn chờ duyệt"
                  description="Tất cả khách sạn mới gửi lên đều đã được xử lý."
                />
              ) : (
                <div className="table-wrap">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Khách sạn</th>
                        <th>Chủ sở hữu</th>
                        <th>Thành phố</th>
                        <th>Loại phòng</th>
                        <th>Trạng thái</th>
                        <th>Ngày gửi</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingHotels.map((hotel) => (
                        <tr key={hotel.id}>
                          <td data-label="Khách sạn">
                            <div className="table-title">{hotel.name}</div>
                            <div className="table-sub">
                              {hotel.starRating}★ · {hotel.district}, {hotel.address}
                            </div>
                          </td>
                          <td data-label="Chủ sở hữu">
                            <div className="table-title">{hotel.ownerName}</div>
                            <div className="table-sub">{hotel.ownerEmail}</div>
                          </td>
                          <td data-label="Thành phố">{hotel.city}</td>
                          <td data-label="Loại phòng">{hotel.roomTypeCount}</td>
                          <td data-label="Trạng thái">
                            <StatusBadge
                              status={hotel.status}
                              label={hotelStatusLabel(hotel.status)}
                            />
                          </td>
                          <td data-label="Ngày gửi">{formatDate(hotel.createdAt)}</td>
                          <td data-label="Thao tác">
                            <div className="table-actions">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => setDecisionTarget({ hotel, status: 'Active' })}
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => setDecisionTarget({ hotel, status: 'Rejected' })}
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )
      )}

      <ConfirmDialog
        open={Boolean(decisionTarget)}
        title={
          decisionTarget?.status === 'Active' ? 'Duyệt khách sạn' : 'Từ chối khách sạn'
        }
        message={
          decisionTarget
            ? decisionTarget.status === 'Active'
              ? `Phê duyệt khách sạn "${decisionTarget.hotel.name}" để hiển thị công khai cho khách đặt phòng?`
              : `Từ chối phê duyệt khách sạn "${decisionTarget.hotel.name}"?`
            : ''
        }
        confirmLabel={decisionTarget?.status === 'Active' ? 'Duyệt ngay' : 'Từ chối'}
        danger={decisionTarget?.status === 'Rejected'}
        loading={submitting}
        onConfirm={confirmDecision}
        onCancel={() => setDecisionTarget(null)}
      />
    </div>
  );
}
