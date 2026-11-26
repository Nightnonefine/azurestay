import { useEffect, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import DateRangeInput from './DateRangeInput';

function parseCsvList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function FilterPanel({
  filters,
  cities = [],
  amenities = [],
  onFiltersChange,
  onReset,
}) {
  const [keyword, setKeyword] = useState(filters.q || '');
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');

  const debouncedKeyword = useDebounce(keyword, 300);

  // Đồng bộ lại ô nhập khi người dùng bấm xoá bộ lọc hoặc mở URL mới.
  useEffect(() => {
    setKeyword(filters.q || '');
  }, [filters.q]);

  useEffect(() => {
    setMinPrice(filters.minPrice || '');
  }, [filters.minPrice]);

  useEffect(() => {
    setMaxPrice(filters.maxPrice || '');
  }, [filters.maxPrice]);

  // Đẩy từ khoá đã debounce 300ms lên URL.
  useEffect(() => {
    if (debouncedKeyword !== (filters.q || '')) {
      onFiltersChange({ q: debouncedKeyword });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  const selectedStars = parseCsvList(filters.stars);
  const selectedAmenities = parseCsvList(filters.amenities);

  function toggleStar(starValue) {
    const str = String(starValue);
    const next = selectedStars.includes(str)
      ? selectedStars.filter((s) => s !== str)
      : [...selectedStars, str];
    onFiltersChange({ stars: next.join(',') });
  }

  function toggleAmenity(code) {
    const next = selectedAmenities.includes(code)
      ? selectedAmenities.filter((c) => c !== code)
      : [...selectedAmenities, code];
    onFiltersChange({ amenities: next.join(',') });
  }

  function applyPrice(e) {
    e.preventDefault();
    onFiltersChange({ minPrice, maxPrice });
  }

  return (
    <aside className="filter-panel" aria-label="Bộ lọc khách sạn">
      <div className="filter-header">
        <h2>Bộ lọc tìm kiếm</h2>
        <button type="button" className="btn btn-outline btn-sm" onClick={onReset}>
          Xoá lọc
        </button>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="filter-q">
          Từ khoá
        </label>
        <input
          id="filter-q"
          type="search"
          className="form-input"
          placeholder="Tên khách sạn, quận, đường..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="filter-city">
          Thành phố
        </label>
        <select
          id="filter-city"
          className="form-select"
          value={filters.city}
          onChange={(e) => onFiltersChange({ city: e.target.value })}
        >
          <option value="">Tất cả thành phố</option>
          {cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} ({c.hotelCount})
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-group-title">Ngày lưu trú & Số khách</span>
        <DateRangeInput
          checkIn={filters.checkIn}
          checkOut={filters.checkOut}
          onChange={({ checkIn, checkOut }) => {
            if (!checkIn && !checkOut) {
              onFiltersChange({ checkIn: '', checkOut: '' });
            } else if (checkIn && checkOut && checkOut > checkIn) {
              onFiltersChange({ checkIn, checkOut });
            } else {
              onFiltersChange({ checkIn, checkOut });
            }
          }}
        />
        <div className="form-field">
          <label className="form-label" htmlFor="filter-guests">
            Số khách tối thiểu
          </label>
          <input
            id="filter-guests"
            type="number"
            className="form-input"
            min={1}
            max={20}
            placeholder="Ví dụ: 2"
            value={filters.guests}
            onChange={(e) => onFiltersChange({ guests: e.target.value })}
          />
        </div>
      </div>

      <form className="filter-group" onSubmit={applyPrice}>
        <span className="filter-group-title">Khoảng giá / đêm (VND)</span>
        <div className="filter-price-row">
          <input
            type="number"
            className="form-input"
            min={0}
            step={100000}
            placeholder="Từ"
            aria-label="Giá tối thiểu"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            className="form-input"
            min={0}
            step={100000}
            placeholder="Đến"
            aria-label="Giá tối đa"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-outline btn-sm">
          Áp dụng giá
        </button>
      </form>

      <div className="filter-group">
        <span className="filter-group-title">Hạng sao</span>
        <div className="check-list">
          {[5, 4, 3, 2, 1].map((star) => (
            <label key={star} className="check-item">
              <input
                type="checkbox"
                checked={selectedStars.includes(String(star))}
                onChange={() => toggleStar(star)}
              />
              <span>{star} sao</span>
            </label>
          ))}
        </div>
      </div>

      {amenities.length > 0 && (
        <div className="filter-group">
          <span className="filter-group-title">Tiện ích</span>
          <div className="check-list">
            {amenities.map((item) => (
              <label key={item.code} className="check-item">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(item.code)}
                  onChange={() => toggleAmenity(item.code)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
