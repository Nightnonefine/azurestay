import { addDaysIso, todayIso } from '../utils/dates';

export default function DateRangeInput({
  checkIn,
  checkOut,
  onChange,
  checkInLabel = 'Nhận phòng',
  checkOutLabel = 'Trả phòng',
}) {
  const today = todayIso();
  const minCheckOut = checkIn && checkIn >= today ? addDaysIso(checkIn, 1) : addDaysIso(today, 1);

  function handleCheckInChange(e) {
    const nextCheckIn = e.target.value;
    let nextCheckOut = checkOut;
    // Nếu ngày trả phòng hiện tại <= ngày nhận phòng mới thì tự đẩy lên +1 ngày.
    if (nextCheckIn && nextCheckOut && nextCheckOut <= nextCheckIn) {
      nextCheckOut = addDaysIso(nextCheckIn, 1);
    }
    onChange({ checkIn: nextCheckIn, checkOut: nextCheckOut });
  }

  function handleCheckOutChange(e) {
    onChange({ checkIn, checkOut: e.target.value });
  }

  return (
    <div className="date-range-group">
      <div className="form-field">
        <label className="form-label" htmlFor="date-checkin">
          {checkInLabel}
        </label>
        <input
          id="date-checkin"
          type="date"
          className="form-input"
          min={today}
          value={checkIn || ''}
          onChange={handleCheckInChange}
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="date-checkout">
          {checkOutLabel}
        </label>
        <input
          id="date-checkout"
          type="date"
          className="form-input"
          min={minCheckOut}
          value={checkOut || ''}
          onChange={handleCheckOutChange}
        />
      </div>
    </div>
  );
}
