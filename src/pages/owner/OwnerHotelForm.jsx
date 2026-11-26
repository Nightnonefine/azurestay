import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import { metaApi, ownerApi } from '../../services/api';
import '../../styles/owner.css';
import { fetchAllOwnerHotels, formatOwnerApiError } from '../../utils/portal';
import { validateHotel } from '../../utils/validate';

const INITIAL_FORM = {
  name: '',
  city: '',
  district: '',
  address: '',
  starRating: 4,
  amenities: [],
  description: '',
};

export default function OwnerHotelForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [cities, setCities] = useState([]);
  const [amenitiesMeta, setAmenitiesMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setServerError('');

    Promise.all([
      metaApi.cities(),
      metaApi.amenities(),
      isEdit ? fetchAllOwnerHotels() : Promise.resolve([]),
    ])
      .then(([citiesData, amenitiesData, ownerHotels]) => {
        if (!active) return;
        const cityNames = Array.isArray(citiesData) ? citiesData.map((c) => c.city) : [];

        if (isEdit) {
          const target = ownerHotels.find((h) => h.id === Number(id));
          if (!target) {
            setServerError('Không tìm thấy khách sạn thuộc quyền quản lý của bạn.');
          } else {
            if (target.city && !cityNames.includes(target.city)) {
              cityNames.push(target.city);
            }
            setForm({
              name: target.name || '',
              city: target.city || '',
              district: target.district || '',
              address: target.address || '',
              starRating: target.starRating || 4,
              amenities: Array.isArray(target.amenities) ? target.amenities : [],
              description: target.description || '',
            });
          }
        } else if (cityNames.length > 0) {
          setForm((prev) => ({ ...prev, city: prev.city || cityNames[0] }));
        }

        setCities(cityNames);
        setAmenitiesMeta(Array.isArray(amenitiesData) ? amenitiesData : []);
      })
      .catch((err) => {
        if (!active) return;
        setServerError(formatOwnerApiError(err, 'Không tải được dữ liệu biểu mẫu khách sạn.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEdit]);

  function toggleAmenity(code) {
    setForm((prev) => {
      const exists = prev.amenities.includes(code);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((item) => item !== code)
          : [...prev.amenities, code],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');

    const validationErrors = validateHotel(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      address: form.address.trim(),
      starRating: Number(form.starRating),
      amenities: form.amenities.join(','),
      description: form.description.trim(),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await ownerApi.updateHotel(id, payload);
        setSuccessMsg('Đã cập nhật thông tin khách sạn thành công.');
      } else {
        const created = await ownerApi.createHotel(payload);
        setSuccessMsg('Đã gửi duyệt! Đang chuyển sang trang quản lý ảnh và loại phòng...');
        navigate(`/owner/hotels/${created.id}?created=1`, { replace: true });
      }
    } catch (err) {
      setServerError(formatOwnerApiError(err, 'Không thể lưu thông tin khách sạn.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>{isEdit ? 'Chỉnh sửa khách sạn' : 'Tạo khách sạn mới'}</h1>
          <p className="portal-subtitle">
            {isEdit
              ? 'Cập nhật thông tin hiển thị của khách sạn (trạng thái duyệt do quản trị viên quyết định).'
              : 'Khách sạn mới tạo sẽ ở trạng thái Chờ duyệt cho đến khi quản trị viên phê duyệt.'}
          </p>
        </div>
        <div className="portal-header-actions">
          <Link to={isEdit ? `/owner/hotels/${id}` : '/owner/hotels'} className="btn btn-outline btn-sm">
            ← Quay lại
          </Link>
        </div>
      </div>

      <PortalNav area="owner" />

      {loading ? (
        <Spinner text="Đang tải dữ liệu biểu mẫu..." />
      ) : (
        <div className="portal-card">
          {serverError && <div className="alert alert-error">{serverError}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="portal-form-grid">
              <div className="form-field portal-form-full">
                <label className="form-label" htmlFor="hotel-name">
                  Tên khách sạn *
                </label>
                <input
                  id="hotel-name"
                  type="text"
                  className={`form-input${errors.name ? ' is-invalid' : ''}`}
                  placeholder="Ví dụ: Azure Bay Resort Đà Nẵng"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="hotel-city">
                  Thành phố *
                </label>
                <select
                  id="hotel-city"
                  className={`form-select${errors.city ? ' is-invalid' : ''}`}
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                >
                  <option value="">-- Chọn thành phố --</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.city && <span className="form-error">{errors.city}</span>}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="hotel-district">
                  Quận / Huyện *
                </label>
                <input
                  id="hotel-district"
                  type="text"
                  className={`form-input${errors.district ? ' is-invalid' : ''}`}
                  placeholder="Ví dụ: Sơn Trà"
                  value={form.district}
                  onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                />
                {errors.district && <span className="form-error">{errors.district}</span>}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="hotel-address">
                  Địa chỉ chi tiết *
                </label>
                <input
                  id="hotel-address"
                  type="text"
                  className={`form-input${errors.address ? ' is-invalid' : ''}`}
                  placeholder="Số nhà, tên đường, phường..."
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
                {errors.address && <span className="form-error">{errors.address}</span>}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="hotel-stars">
                  Hạng sao (1 - 5) *
                </label>
                <select
                  id="hotel-stars"
                  className={`form-select${errors.starRating ? ' is-invalid' : ''}`}
                  value={form.starRating}
                  onChange={(e) => setForm((p) => ({ ...p, starRating: Number(e.target.value) }))}
                >
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>
                      {s} sao ({'★'.repeat(s)})
                    </option>
                  ))}
                </select>
                {errors.starRating && <span className="form-error">{errors.starRating}</span>}
              </div>

              <div className="form-field portal-form-full">
                <span className="form-label">Tiện ích khách sạn</span>
                <div className="amenities-check-grid">
                  {amenitiesMeta.map((am) => (
                    <label key={am.code} className="check-item">
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(am.code)}
                        onChange={() => toggleAmenity(am.code)}
                      />
                      <span>{am.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-field portal-form-full">
                <label className="form-label" htmlFor="hotel-desc">
                  Mô tả khách sạn
                </label>
                <textarea
                  id="hotel-desc"
                  rows={5}
                  className={`form-textarea${errors.description ? ' is-invalid' : ''}`}
                  placeholder="Giới thiệu nổi bật về vị trí, dịch vụ, không gian nghỉ dưỡng..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
                {errors.description && <span className="form-error">{errors.description}</span>}
              </div>

              <div className="form-actions-row portal-form-full">
                <Link
                  to={isEdit ? `/owner/hotels/${id}` : '/owner/hotels'}
                  className="btn btn-outline"
                >
                  Huỷ
                </Link>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting
                    ? 'Đang lưu...'
                    : isEdit
                      ? 'Lưu thay đổi'
                      : 'Tạo & gửi duyệt'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
