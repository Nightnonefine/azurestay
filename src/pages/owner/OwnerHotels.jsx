import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { useDebounce } from '../../hooks/useDebounce';
import { useList } from '../../hooks/useList';
import { ownerApi } from '../../services/api';
import '../../styles/owner.css';
import { formatDate, hotelStatusLabel } from '../../utils/format';

const PAGE_SIZE = 10;

export default function OwnerHotels() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const debouncedQ = useDebounce(search, 300);

  const { items, total, loading, error, page, setPage, reload } = useList(
    ({ page: p, pageSize }) =>
      ownerApi.hotels({
        q: debouncedQ,
        status,
        sort,
        page: p,
        pageSize,
      }),
    [debouncedQ, status, sort],
    { pageSize: PAGE_SIZE },
  );

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatus(value);
    setPage(1);
  }

  function handleSortChange(value) {
    setSort(value);
    setPage(1);
  }

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Khách sạn của tôi</h1>
          <p className="portal-subtitle">
            Quản lý thông tin, hình ảnh, loại phòng và theo dõi trạng thái duyệt của từng khách sạn.
          </p>
        </div>
        <div className="portal-header-actions">
          <Link to="/owner/hotels/new" className="btn btn-primary btn-sm">
            + Tạo khách sạn mới
          </Link>
        </div>
      </div>

      <PortalNav area="owner" />

      <div className="toolbar-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="owner-hotel-search">
            Tìm kiếm
          </label>
          <input
            id="owner-hotel-search"
            type="search"
            className="form-input"
            placeholder="Tên khách sạn, thành phố, quận..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="owner-hotel-status">
            Trạng thái duyệt
          </label>
          <select
            id="owner-hotel-status"
            className="form-select"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Suspended">Tạm ngưng</option>
            <option value="Rejected">Từ chối</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="owner-hotel-sort">
            Sắp xếp
          </label>
          <select
            id="owner-hotel-sort"
            className="form-select"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Tên A → Z</option>
            <option value="name-desc">Tên Z → A</option>
          </select>
        </div>
      </div>

      <div className="toolbar-meta">
        <span>{loading ? 'Đang tải...' : `Tổng ${total} khách sạn`}</span>
        {(search || status) && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearch('');
              setStatus('');
              setSort('newest');
              setPage(1);
            }}
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <Spinner text="Đang tải danh sách khách sạn..." />
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={reload}
            style={{ marginTop: 10 }}
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🏨"
          title="Chưa có khách sạn phù hợp"
          description={
            search || status
              ? 'Không tìm thấy khách sạn nào khớp bộ lọc hiện tại.'
              : 'Bạn chưa tạo khách sạn nào. Hãy tạo khách sạn đầu tiên để gửi duyệt.'
          }
          action={
            <Link to="/owner/hotels/new" className="btn btn-primary btn-sm">
              + Tạo khách sạn mới
            </Link>
          }
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Tên khách sạn</th>
                  <th>Thành phố</th>
                  <th>Hạng sao</th>
                  <th>Trạng thái duyệt</th>
                  <th>Số loại phòng</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((hotel) => (
                  <tr key={hotel.id}>
                    <td data-label="Tên khách sạn">
                      <Link to={`/owner/hotels/${hotel.id}`} className="table-title">
                        {hotel.name}
                      </Link>
                      <div className="table-sub">
                        {hotel.district}, {hotel.address}
                      </div>
                    </td>
                    <td data-label="Thành phố">{hotel.city}</td>
                    <td data-label="Hạng sao">
                      <span className="hotel-stars" title={`${hotel.starRating} sao`}>
                        {'★'.repeat(hotel.starRating || 0)}
                      </span>{' '}
                      ({hotel.starRating}★)
                    </td>
                    <td data-label="Trạng thái duyệt">
                      <StatusBadge status={hotel.status} label={hotelStatusLabel(hotel.status)} />
                    </td>
                    <td data-label="Số loại phòng">{hotel.roomTypeCount}</td>
                    <td data-label="Ngày tạo">{formatDate(hotel.createdAt)}</td>
                    <td data-label="Thao tác">
                      <div className="table-actions">
                        <Link to={`/owner/hotels/${hotel.id}/edit`} className="btn btn-outline btn-sm">
                          Sửa
                        </Link>
                        <Link
                          to={`/owner/hotels/${hotel.id}/calendar`}
                          className="btn btn-outline btn-sm"
                        >
                          Xem lịch
                        </Link>
                        <Link
                          to={`/owner/hotels/${hotel.id}?tab=rooms&create=1`}
                          className="btn btn-primary btn-sm"
                        >
                          + Loại phòng
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
