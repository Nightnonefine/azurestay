import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const FILTER_KEYS = [
  'city',
  'minPrice',
  'maxPrice',
  'stars',
  'amenities',
  'checkIn',
  'checkOut',
  'guests',
  'q',
  'sort',
  'page',
];

// Đồng bộ toàn bộ điều kiện tìm kiếm/lọc/phân trang khách sạn lên query string của URL.
export function useHotelSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const pageNum = Number(searchParams.get('page') || '1');
    return {
      city: searchParams.get('city') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      stars: searchParams.get('stars') || '',
      amenities: searchParams.get('amenities') || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      guests: searchParams.get('guests') || '',
      q: searchParams.get('q') || '',
      sort: searchParams.get('sort') || 'popular',
      page: Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1,
    };
  }, [searchParams]);

  // Cập nhật một hoặc nhiều bộ lọc cùng lúc; khi đổi điều kiện lọc thì tự đưa về trang 1.
  const setFilters = useCallback(
    (patch, options = {}) => {
      const nextParams = new URLSearchParams(searchParams);
      const resetPage = options.resetPage !== false;

      Object.entries(patch).forEach(([key, rawValue]) => {
        if (!FILTER_KEYS.includes(key)) return;
        const val = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim();
        if (!val || (key === 'sort' && val === 'popular') || (key === 'page' && val === '1')) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, val);
        }
      });

      if (resetPage && !('page' in patch)) {
        nextParams.delete('page');
      }

      setSearchParams(nextParams, { replace: Boolean(options.replace) });
    },
    [searchParams, setSearchParams],
  );

  const setFilter = useCallback(
    (key, value, options) => {
      setFilters({ [key]: value }, options);
    },
    [setFilters],
  );

  const setPage = useCallback(
    (nextPage) => {
      setFilters({ page: nextPage > 1 ? String(nextPage) : '' }, { resetPage: false });
    },
    [setFilters],
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: false });
  }, [setSearchParams]);

  return { filters, setFilter, setFilters, setPage, resetFilters };
}
