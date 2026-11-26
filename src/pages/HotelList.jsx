import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import FilterPanel from '../components/FilterPanel';
import HotelCard from '../components/HotelCard';
import Pagination from '../components/Pagination';
import SortSelect from '../components/SortSelect';
import { useHotelSearch } from '../hooks/useHotelSearch';
import { useList } from '../hooks/useList';
import { hotelApi, metaApi } from '../services/api';

const PAGE_SIZE = 8;

function HotelListSkeleton() {
  return (
    <div className="hotel-list-grid" aria-label="Đang tải danh sách khách sạn">
      {[1, 2, 3, 4].map((idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-box skeleton-img" />
          <div className="skeleton-box skeleton-line short" />
          <div className="skeleton-box skeleton-line" />
          <div className="skeleton-box skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export default function HotelList() {
  const { filters, setFilter, setFilters, setPage, resetFilters } = useHotelSearch();
  const [cities, setCities] = useState([]);
  const [amenities, setAmenities] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([metaApi.cities().catch(() => []), metaApi.amenities().catch(() => [])]).then(
      ([cityList, amenityList]) => {
        if (!active) return;
        setCities(Array.isArray(cityList) ? cityList : []);
        setAmenities(Array.isArray(amenityList) ? amenityList : []);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const amenityMap = useMemo(() => {
    const map = {};
    amenities.forEach((a) => {
      map[a.code] = a.label;
    });
    return map;
  }, [amenities]);

  // Kiểm tra cặp ngày hợp lệ trước khi gửi lên /api/hotels (tránh 400 khi mới chọn 1 đầu ngày).
  const hasValidDatePair = Boolean(
    filters.checkIn && filters.checkOut && filters.checkOut > filters.checkIn,
  );
  const queryKey = JSON.stringify(filters);

  const { items, total, loading, error, reload } = useList(
    () =>
      hotelApi.search({
        city: filters.city,
        q: filters.q,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        stars: filters.stars,
        amenities: filters.amenities,
        checkIn: hasValidDatePair ? filters.checkIn : '',
        checkOut: hasValidDatePair ? filters.checkOut : '',
        guests: filters.guests,
        sort: filters.sort,
        page: filters.page,
        pageSize: PAGE_SIZE,
      }),
    [queryKey],
    { pageSize: PAGE_SIZE },
  );

  // Giữ ngày đang chọn khi người dùng mở trang chi tiết khách sạn.
  const detailQuerySuffix = useMemo(() => {
    if (!hasValidDatePair) return '';
    const p = new URLSearchParams();
    p.set('checkIn', filters.checkIn);
    p.set('checkOut', filters.checkOut);
    return `?${p.toString()}`;
  }, [hasValidDatePair, filters.checkIn, filters.checkOut]);

  return (
    <div>
      <section className="page-banner">
        <div className="container">
          <h1>Tìm kiếm khách sạn</h1>
          <p>Lọc theo điểm đến, khoảng giá, hạng sao, tiện ích và ngày nhận trả phòng.</p>
        </div>
      </section>

      <div className="container hotel-list-layout">
        <FilterPanel
          filters={filters}
          cities={cities}
          amenities={amenities}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />

        <section>
          <div className="list-toolbar">
            <span className="list-count">
              {loading ? 'Đang tìm khách sạn...' : `${total} khách sạn`}
            </span>
            <SortSelect value={filters.sort} onChange={(nextSort) => setFilter('sort', nextSort)} />
          </div>

          {Boolean(filters.checkIn) !== Boolean(filters.checkOut) && (
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              Vui lòng chọn đầy đủ cả ngày nhận phòng và ngày trả phòng để lọc theo phòng trống.
            </div>
          )}

          {loading ? (
            <HotelListSkeleton />
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
              icon="⌂"
              title="Không tìm thấy khách sạn phù hợp"
              description="Thử nới rộng khoảng giá, bỏ bớt tiện ích hoặc thay đổi ngày lưu trú."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={resetFilters}>
                  Xoá toàn bộ bộ lọc
                </button>
              }
            />
          ) : (
            <>
              <div className="hotel-list-grid">
                {items.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    amenityMap={amenityMap}
                    querySuffix={detailQuerySuffix}
                  />
                ))}
              </div>

              <Pagination
                page={filters.page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
