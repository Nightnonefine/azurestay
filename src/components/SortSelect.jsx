export default function SortSelect({ value, onChange }) {
  return (
    <div className="sort-select-wrap">
      <label htmlFor="sort-hotels" className="form-label">
        Sắp xếp:
      </label>
      <select
        id="sort-hotels"
        className="form-select"
        value={value || 'popular'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="popular">Phổ biến nhất</option>
        <option value="price-asc">Giá thấp đến cao</option>
        <option value="price-desc">Giá cao đến thấp</option>
        <option value="rating">Đánh giá cao nhất</option>
      </select>
    </div>
  );
}
