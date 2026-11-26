import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DateRangeInput from './DateRangeInput';
import { validateDateRange } from '../utils/dates';

export default function SearchBar({
  cities = [],
  initialValues = {},
  onSearch,
  compact = false,
}) {
  const navigate = useNavigate();
  const [city, setCity] = useState(initialValues.city || '');
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || '');
  const [guests, setGuests] = useState(initialValues.guests || '2');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      setError('Vui lòng chọn cả ngày nhận phòng và ngày trả phòng.');
      return;
    }

    if (checkIn && checkOut) {
      const check = validateDateRange(checkIn, checkOut);
      if (!check.valid) {
        setError(check.error);
        return;
      }
    }

    const payload = {
      city: city.trim(),
      checkIn,
      checkOut,
      guests: guests ? String(guests) : '',
    };

    if (onSearch) {
      onSearch(payload);
      return;
    }

    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    navigate(`/hotels?${params.toString()}`);
  }

  return (
    <form className={`search-bar${compact ? ' search-bar-compact' : ''}`} onSubmit={handleSubmit}>
      <div className="form-field">
        <label className="form-label" htmlFor="search-city">
          Điểm đến
        </label>
        {cities.length > 0 ? (
          <select
            id="search-city"
            className="form-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">Tất cả thành phố</option>
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city} ({c.hotelCount})
              </option>
            ))}
          </select>
        ) : (
          <input
            id="search-city"
            type="text"
            className="form-input"
            placeholder="Đà Nẵng, Hà Nội, Phú Quốc..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        )}
      </div>

      <DateRangeInput
        checkIn={checkIn}
        checkOut={checkOut}
        onChange={({ checkIn: ci, checkOut: co }) => {
          setCheckIn(ci);
          setCheckOut(co);
        }}
      />

      <div className="form-field">
        <label className="form-label" htmlFor="search-guests">
          Số khách
        </label>
        <input
          id="search-guests"
          type="number"
          className="form-input"
          min={1}
          max={20}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary btn-lg search-bar-submit">
        Tìm phòng
      </button>

      {error && (
        <div className="form-error" style={{ gridColumn: '1 / -1' }}>
          {error}
        </div>
      )}
    </form>
  );
}
