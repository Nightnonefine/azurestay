import { useCallback, useEffect, useMemo, useState } from 'react';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import { ownerApi } from '../../services/api';
import '../../styles/owner.css';
import { addDaysIso, todayIso } from '../../utils/dates';
import { formatDate, formatMoney, statusLabel } from '../../utils/format';
import {
  calculateAverageOccupancy,
  fetchAllOwnerHotels,
  formatOwnerApiError,
} from '../../utils/portal';

const OCC_PAGE_SIZE = 8;
const BOOKING_STATUS_ORDER = ['Pending', 'Confirmed', 'CheckedIn', 'Completed', 'Cancelled'];

export default function OwnerStats() {
  const [from, setFrom] = useState(() => addDaysIso(todayIso(), -29));
  const [to, setTo] = useState(() => addDaysIso(todayIso(), 1));
  const [hotelId, setHotelId] = useState('');
  const [hotels, setHotels] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tìm kiếm, sắp xếp và phân trang bảng công suất theo loại phòng
  const [occSearch, setOccSearch] = useState('');
  const [occSort, setOccSort] = useState('revenue-desc');
  const [occPage, setOccPage] = useState(1);

  const loadStats = useCallback(
    async (targetFrom = from, targetTo = to, targetHotelId = hotelId) => {
      setLoading(true);
      setError('');
      try {
        const [allHotels, statsRes] = await Promise.all([
          fetchAllOwnerHotels(),
          ownerApi.stats({
            from: targetFrom,
            to: targetTo,
            hotelId: targetHotelId ? Number(targetHotelId) : undefined,
          }),
        ]);
        setHotels(allHotels);
        setStats(statsRes);
        setOccPage(1);
      } catch (err) {
        setError(formatOwnerApiError(err, 'Không tải được dữ liệu thống kê chủ khách sạn.'));
      } finally {
        setLoading(false);
      }
    },
    [from, to, hotelId],
  );

  useEffect(() => {
    loadStats(from, to, hotelId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterSubmit(e) {
    e.preventDefault();
    loadStats(from, to, hotelId);
  }

  const avgOccupancy = calculateAverageOccupancy(stats?.roomTypeOccupancy);
  const maxTopRevenue = useMemo(() => {
    const top = stats?.topRoomTypes || [];
    return top.reduce((acc, item) => Math.max(acc, Number(item.revenue || 0)), 0);
  }, [stats]);

  const filteredOccupancy = useMemo(() => {
    const rows = Array.isArray(stats?.roomTypeOccupancy) ? stats.roomTypeOccupancy : [];
    const q = occSearch.trim().toLowerCase();
    const matched = q
      ? rows.filter((r) => `${r.hotelName} ${r.roomTypeName}`.toLowerCase().includes(q))
      : rows;

    return [...matched].sort((a, b) => {
      switch (occSort) {
        case 'occupancy-desc':
          return b.occupancyRate - a.occupancyRate;
        case 'sold-desc':
          return b.soldNights - a.soldNights;
        case 'name':
          return a.roomTypeName.localeCompare(b.roomTypeName, 'vi');
        default:
          return b.revenue - a.revenue;
      }
    });
  }, [stats, occSearch, occSort]);

  const pagedOccupancy = useMemo(() => {
    const start = (occPage - 1) * OCC_PAGE_SIZE;
    return filteredOccupancy.slice(start, start + OCC_PAGE_SIZE);
  }, [filteredOccupancy, occPage]);

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Thống kê doanh thu &amp; công suất</h1>
          <p className="portal-subtitle">
            Phân tích doanh thu, số đêm phòng đã bán, tỷ lệ lấp đầy và top loại phòng hiệu quả nhất.
          </p>
        </div>
      </div>

      <PortalNav area="owner" />

      <form className="toolbar-grid" onSubmit={handleFilterSubmit}>
        <div className="form-field">
          <label className="form-label" htmlFor="os-from">
            Từ ngày
          </label>
          <input
            id="os-from"
            type="date"
            className="form-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="os-to">
            Đến ngày
          </label>
          <input
            id="os-to"
            type="date"
            className="form-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="os-hotel">
            Khách sạn
          </label>
          <select
            id="os-hotel"
            className="form-select"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
          >
            <option value="">Tất cả khách sạn</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Đang tính...' : 'Xem thống kê'}
          </button>
        </div>
      </form>

      {loading ? (
        <Spinner text="Đang tổng hợp thống kê..." />
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadStats(from, to, hotelId)}
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
                <span className="kpi-label">Tổng doanh thu</span>
                <span className="kpi-value accent">{formatMoney(stats.totalRevenue)}</span>
                <span className="kpi-sub">
                  {formatDate(stats.from)} → {formatDate(stats.to)} ({stats.rangeNights} đêm)
                </span>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Tổng đơn phát sinh</span>
                <span className="kpi-value">{stats.totalBookings}</span>
                <span className="kpi-sub">Tính cả đơn chờ và đã huỷ</span>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Số đêm phòng đã bán</span>
                <span className="kpi-value">{stats.soldRoomNights}</span>
                <span className="kpi-sub">Đơn Confirmed / CheckedIn / Completed</span>
              </article>

              <article className="kpi-card">
                <span className="kpi-label">Công suất trung bình</span>
                <span className="kpi-value">{avgOccupancy}%</span>
                <span className="kpi-sub">Trên toàn bộ loại phòng đang mở bán</span>
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
                  <h2>Top 5 loại phòng doanh thu cao nhất</h2>
                </div>
                {!stats.topRoomTypes || stats.topRoomTypes.length === 0 ? (
                  <EmptyState
                    icon="📊"
                    title="Chưa có dữ liệu doanh thu"
                    description="Chưa có đêm phòng nào được bán trong khoảng thời gian đã chọn."
                  />
                ) : (
                  <div className="bar-list">
                    {stats.topRoomTypes.map((rt, idx) => {
                      const pct =
                        maxTopRevenue > 0
                          ? Math.round((Number(rt.revenue || 0) / maxTopRevenue) * 100)
                          : 0;
                      return (
                        <div key={rt.roomTypeId} className="bar-row">
                          <div className="bar-row-head">
                            <span>
                              #{idx + 1} {rt.roomTypeName} · {rt.hotelName}
                            </span>
                            <span>{formatMoney(rt.revenue)}</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill gold" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <section className="portal-card">
              <div className="portal-card-head">
                <h2>Công suất theo loại phòng</h2>
                <div className="table-actions">
                  <input
                    type="search"
                    className="form-input"
                    style={{ width: 220 }}
                    placeholder="Lọc theo tên phòng..."
                    value={occSearch}
                    onChange={(e) => {
                      setOccSearch(e.target.value);
                      setOccPage(1);
                    }}
                  />
                  <select
                    className="form-select"
                    style={{ width: 190 }}
                    value={occSort}
                    onChange={(e) => {
                      setOccSort(e.target.value);
                      setOccPage(1);
                    }}
                  >
                    <option value="revenue-desc">Doanh thu cao nhất</option>
                    <option value="occupancy-desc">Công suất cao nhất</option>
                    <option value="sold-desc">Đêm bán nhiều nhất</option>
                    <option value="name">Tên loại phòng A → Z</option>
                  </select>
                </div>
              </div>

              {filteredOccupancy.length === 0 ? (
                <EmptyState
                  icon="📉"
                  title="Chưa có loại phòng thống kê"
                  description="Không tìm thấy loại phòng phù hợp trong phạm vi lọc."
                />
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Loại phòng</th>
                          <th>Khách sạn</th>
                          <th>Tổng phòng</th>
                          <th>Đêm đã bán / Tối đa</th>
                          <th>Công suất</th>
                          <th>Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedOccupancy.map((row) => {
                          const pct = Math.min(100, Math.round((row.occupancyRate || 0) * 1000) / 10);
                          return (
                            <tr key={row.roomTypeId}>
                              <td data-label="Loại phòng">
                                <span className="table-title">{row.roomTypeName}</span>
                              </td>
                              <td data-label="Khách sạn">{row.hotelName}</td>
                              <td data-label="Tổng phòng">{row.totalRooms}</td>
                              <td data-label="Đêm đã bán / Tối đa">
                                {row.soldNights} / {row.capacityNights}
                              </td>
                              <td data-label="Công suất">
                                <div className="progress-inline">
                                  <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                                  </div>
                                  <strong>{pct}%</strong>
                                </div>
                              </td>
                              <td data-label="Doanh thu">
                                <strong>{formatMoney(row.revenue)}</strong>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    page={occPage}
                    pageSize={OCC_PAGE_SIZE}
                    total={filteredOccupancy.length}
                    onPageChange={setOccPage}
                  />
                </>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}
