import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi, getApiErrorMessage } from '../../services/api';
import { formatDateTime } from '../../utils/format';
import { validatePasswordChange, validateProfile } from '../../utils/validate';

export default function Profile() {
  const { user, updateUserState } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileErrors, setProfileErrors] = useState({});
  const [profileServerError, setProfileServerError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState({});
  const [pwServerError, setPwServerError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
  }, [user?.fullName, user?.phone]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileServerError('');
    setProfileSuccess('');

    const errors = validateProfile({ fullName, phone });
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setProfileSaving(true);
    try {
      const updated = await authApi.updateMe({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      });
      updateUserState(updated);
      setProfileSuccess('Đã cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      setProfileServerError(getApiErrorMessage(err, 'Không thể cập nhật hồ sơ.'));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwServerError('');
    setPwSuccess('');

    const errors = validatePasswordChange({ currentPassword, newPassword, confirmPassword });
    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPwSaving(true);
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      setPwSuccess(res?.message || 'Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwServerError(getApiErrorMessage(err, 'Không thể đổi mật khẩu.'));
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="container account-page">
      <div>
        <h1 style={{ color: 'var(--navy)' }}>Tài khoản của tôi</h1>
        <p style={{ color: 'var(--muted)' }}>
          Quản lý thông tin liên hệ và bảo mật tài khoản AzureStay.
        </p>
      </div>

      <nav className="account-tabs" aria-label="Điều hướng tài khoản">
        <NavLink to="/account" end className={({ isActive }) => `account-tab${isActive ? ' active' : ''}`}>
          Thông tin cá nhân
        </NavLink>
        <NavLink to="/account/bookings" className={({ isActive }) => `account-tab${isActive ? ' active' : ''}`}>
          Đơn đặt phòng của tôi
        </NavLink>
      </nav>

      <div className="account-grid">
        <form className="account-card" onSubmit={handleSaveProfile} noValidate>
          <h2>Thông tin cá nhân</h2>

          {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}
          {profileServerError && <div className="alert alert-error">{profileServerError}</div>}

          <div className="form-field">
            <label className="form-label" htmlFor="profile-email">
              Email đăng nhập
            </label>
            <input
              id="profile-email"
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-role">
              Vai trò & Ngày tham gia
            </label>
            <input
              id="profile-role"
              type="text"
              className="form-input"
              value={`${user?.role || ''} • Tham gia ${formatDateTime(user?.createdAt)}`}
              disabled
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-fullname">
              Họ và tên
            </label>
            <input
              id="profile-fullname"
              type="text"
              className={`form-input${profileErrors.fullName ? ' is-invalid' : ''}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {profileErrors.fullName && <span className="form-error">{profileErrors.fullName}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-phone">
              Số điện thoại
            </label>
            <input
              id="profile-phone"
              type="tel"
              className={`form-input${profileErrors.phone ? ' is-invalid' : ''}`}
              placeholder="0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {profileErrors.phone && <span className="form-error">{profileErrors.phone}</span>}
          </div>

          <div>
            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
              {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>

        <form className="account-card" onSubmit={handleChangePassword} noValidate>
          <h2>Đổi mật khẩu</h2>

          {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
          {pwServerError && <div className="alert alert-error">{pwServerError}</div>}

          <div className="form-field">
            <label className="form-label" htmlFor="pw-current">
              Mật khẩu hiện tại
            </label>
            <input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              className={`form-input${pwErrors.currentPassword ? ' is-invalid' : ''}`}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            {pwErrors.currentPassword && (
              <span className="form-error">{pwErrors.currentPassword}</span>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pw-new">
              Mật khẩu mới
            </label>
            <input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              className={`form-input${pwErrors.newPassword ? ' is-invalid' : ''}`}
              placeholder="Ít nhất 8 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {pwErrors.newPassword && <span className="form-error">{pwErrors.newPassword}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pw-confirm">
              Nhập lại mật khẩu mới
            </label>
            <input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              className={`form-input${pwErrors.confirmPassword ? ' is-invalid' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {pwErrors.confirmPassword && (
              <span className="form-error">{pwErrors.confirmPassword}</span>
            )}
          </div>

          <div>
            <button type="submit" className="btn btn-navy" disabled={pwSaving}>
              {pwSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
