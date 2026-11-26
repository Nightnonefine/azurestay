import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import { ownerApi } from '../../services/api';
import '../../styles/owner.css';
import { addDaysIso, todayIso } from '../../utils/dates';
import { formatDate } from '../../utils/format';
import { fetchAllOwnerHotels, formatOwnerApiError } from '../../utils/portal';

// Xác định lớp màu cho từng ô lịch: đỏ (hết), vàng (còn ít <= 30%), xanh (còn nhiều).
function getCellStatusClass(available, total) {
  if (available <= 0) return 'cal-cell-empty';
  const lowThreshold = Math.max(1, Math.floor(total * 0.3));
  if (available <= lowThreshold) return 'cal-cell-low';
  return 'cal-cell-ok';
}

export default function OwnerCalendar() {
  const { id } = useParams();
  const hotelId = Number(id);
  const navigate = useNavigate();

  const [from, setFrom] = useState(() => todayIso());
  const [to, setTo] = useState(() => addDaysIso(todayIso(), 30));
  const [hotels, setHotels] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCalendar = useCallback(
    async (targetFrom = from, targetTo = to) => {
      setLoading(true);
      setError('');
      try {
        const [allHotels, calData] = await Promise.all([
          fetchAllOwnerHotels(),
          ownerApi.calendar(hotelId, { from: targetFrom, to: targetTo }),
        ]);
        setHotels(allHotels);
        setCalendar(Array.isArray(calData) ? calData : []);
      } catch (err) {
        setError(formatOwnerApiError(err, 'Không tải được lịch phòng trống.'));
      } finally {
        setLoading(false);
      }
    },
    [hotelId, from, to],
  );

  useEffect(() => {
    loadCalendar(from, to);
  }, [hotelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentHotel = useMemo(
    () => hotels.find((h) => h.id === hotelId),
    [hotels, hotelId],
  );

  // Tập hợp danh sách hàng là từng loại phòng từ dữ liệu lịch trả về.
  const roomRows = useMemo(() => {
    const map = new Map();
    calendar.forEach((day) => {
      (day.roomTypes || []).forEach((rt) => {
        if (!map.has(rt.id)) {
          map.set(rt.id, { id: rt.id, name: rt.name, total: rt.total });
        }
      });
    });
    return Array.from(map.values());
  }, [calendar]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    loadCalendar(from, to);
  }

  function applyQuickDays(days) {
    const nextFrom = todayIso();
    const nextTo = addDaysIso(nextFrom, days);
    setFrom(nextFrom);
    setTo(nextTo);
    loadCalendar(nextFrom, nextTo);
  }

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Lịch trống theo ngày</h1>
          <p className="portal-subtitle">
            {currentHotel
              ? `${currentHotel.name} (${currentHotel.city}) — Theo dõi tồn kho từng loại phòng.`
              : 'Theo dõi số phòng còn trống theo từng ngày (tối đa 60 ngày/lần xem).'}
          </p>
        </div>
        <div className="portal-header-actions">
          <Link to={`/owner/hotels/${hotelId}`} className="btn btn-outline btn-sm">
            ← Chi tiết khách sạn
          </Link>
        </div>
      </div>

      <PortalNav area="owner" />

      <form className="toolbar-grid" onSubmit={handleFilterSubmit}>
        {hotels.length > 0 && (
          <div className="form-field">
            <label className="form-label" htmlFor="cal-hotel">
              Khách sạn
            </label>
            <select
              id="cal-hotel"
              className="form-select"
              value={hotelId}
              onChange={(e) => navigate(`/owner/hotels/${e.target.value}/calendar`)}
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="cal-from">
            Từ ngày
          </label>
          <input
            id="cal-from"
            type="date"
            className="form-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="cal-to">
            Đến ngày
          </label>
          <input
            id="cal-to"
            type="date"
            className="form-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="table-actions">
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Đang tải...' : 'Tải lịch'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={loading}
            onClick={() => applyQuickDays(30)}
          >
            30 ngày tới
          </button>
        </div>
      </form>

      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-swatch cal-cell-ok" />
          Còn nhiều phòng
        </span>
        <span className="legend-item">
          <span className="legend-swatch cal-cell-low" />
          Còn ít (≤ 30%)
        </span>
        <span className="legend-item">
          <span className="legend-swatch cal-cell-empty" />
          Hết phòng (0)
        </span>
      </div>

      {loading ? (
        <Spinner text="Đang tính tồn kho phòng theo ngày..." />
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadCalendar(from, to)}
            style={{ marginTop: 10 }}
          >
            Thử lại
          </button>
        </div>
      ) : roomRows.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Chưa có loại phòng để hiển thị lịch"
          description="Hãy thêm loại phòng đang hoạt động cho khách sạn này để theo dõi lịch trống."
          action={
            <Link to={`/owner/hotels/${hotelId}?tab=rooms`} className="btn btn-primary btn-sm">
              Quản lý loại phòng
            </Link>
          }
        />
      ) : (
        <div className="calendar-scroll">
          <table className="calendar-table">
            <thead>
              <tr>
                <th className="cal-sticky-col">Loại phòng (còn / tổng)</th>
                {calendar.map((day) => (
                  <th key={day.date} title={formatDate(day.date)}>
                    {formatDate(day.date).slice(0, 5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roomRows.map((room) => (
                <tr key={room.id}>
                  <th className="cal-sticky-col">
                    <div className="table-title">{room.name}</div>
                    <div className="table-sub">Tổng {room.total} phòng</div>
                  </th>
                  {calendar.map((day) => {
                    const cell = (day.roomTypes || []).find((item) => item.id === room.id);
                    const available = cell?.available ?? 0;
                    const total = cell?.total ?? room.total;
                    return (
                      <td
                        key={`${room.id}-${day.date}`}
                        className={getCellStatusClass(available, total)}
                        title={`${room.name} · ${formatDate(day.date)}: còn ${available}/${total} phòng`}
                      >
                        {available}/{total}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
