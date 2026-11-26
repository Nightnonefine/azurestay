import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import { validateRegister } from '../utils/validate';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    const validationErrors = validateRegister({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        password,
      });

      const loginQuery = new URLSearchParams({ registered: '1' });
      if (next) loginQuery.set('next', next);
      navigate(`/login?${loginQuery.toString()}`, { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Đăng ký tài khoản thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <h1>Đăng ký tài khoản</h1>
          <p className="auth-subtitle">Tạo tài khoản khách hàng miễn phí trên AzureStay.</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="reg-fullname">
              Họ và tên
            </label>
            <input
              id="reg-fullname"
              type="text"
              className={`form-input${errors.fullName ? ' is-invalid' : ''}`}
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {errors.fullName && <span className="form-error">{errors.fullName}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              className={`form-input${errors.email ? ' is-invalid' : ''}`}
              placeholder="ten@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-phone">
              Số điện thoại (tuỳ chọn)
            </label>
            <input
              id="reg-phone"
              type="tel"
              className={`form-input${errors.phone ? ' is-invalid' : ''}`}
              placeholder="0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-password">
              Mật khẩu
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              className={`form-input${errors.password ? ' is-invalid' : ''}`}
              placeholder="Ít nhất 8 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-confirm">
              Nhập lại mật khẩu
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              className={`form-input${errors.confirmPassword ? ' is-invalid' : ''}`}
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản?{' '}
          <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
