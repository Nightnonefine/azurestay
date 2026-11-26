import { useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useList } from '../../hooks/useList';
import { adminApi, getApiErrorMessage } from '../../services/api';
import '../../styles/owner.css';
import '../../styles/admin.css';
import { formatDate, roleLabel, userStatusLabel } from '../../utils/format';
import { validateProfile } from '../../utils/validate';

const PAGE_SIZE = 10;
const ROLES = ['Customer', 'Owner', 'Admin'];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const debouncedQ = useDebounce(search, 300);

  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Modal sửa thông tin người dùng (họ tên, SĐT)
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
  const [editErrors, setEditErrors] = useState({});
  const [editServerError, setEditServerError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Xác nhận đổi role
  const [roleTarget, setRoleTarget] = useState(null);
  const [savingRole, setSavingRole] = useState(false);

  // Xác nhận khoá / mở khoá tài khoản
  const [lockTarget, setLockTarget] = useState(null);
  const [savingLock, setSavingLock] = useState(false);

  const { items, total, loading, error, page, setPage, reload } = useList(
    ({ page: p, pageSize }) =>
      adminApi.users({
        q: debouncedQ,
        role: roleFilter,
        status: statusFilter,
        sort,
        page: p,
        pageSize,
      }),
    [debouncedQ, roleFilter, statusFilter, sort],
    { pageSize: PAGE_SIZE },
  );

  function openEditModal(u) {
    setEditTarget(u);
    setEditForm({ fullName: u.fullName || '', phone: u.phone || '' });
    setEditErrors({});
    setEditServerError('');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editTarget) return;
    setEditServerError('');

    const validation = validateProfile(editForm);
    setEditErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSavingEdit(true);
    try {
      await adminApi.updateUser(editTarget.id, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim() || null,
        status: editTarget.status,
      });
      setFeedback({
        type: 'success',
        text: `Đã cập nhật thông tin tài khoản ${editTarget.email}.`,
      });
      setEditTarget(null);
      reload();
    } catch (err) {
      setEditServerError(getApiErrorMessage(err, 'Không thể cập nhật thông tin người dùng.'));
    } finally {
      setSavingEdit(false);
    }
  }

  function handleRoleSelect(targetUser, nextRole) {
    if (nextRole === targetUser.role) return;
    setFeedback({ type: '', text: '' });

    // Chặn tự hạ quyền của chính quản trị viên đang đăng nhập ngay ở client (server cũng chặn).
    if (targetUser.id === currentUser?.id && nextRole !== 'Admin') {
      setFeedback({
        type: 'error',
        text: 'Không thể tự hạ quyền của chính mình.',
      });
      return;
    }

    setRoleTarget({ user: targetUser, nextRole });
  }

  async function confirmRoleChange() {
    if (!roleTarget) return;
    setSavingRole(true);
    setFeedback({ type: '', text: '' });
    try {
      await adminApi.updateUserRole(roleTarget.user.id, { role: roleTarget.nextRole });
      setFeedback({
        type: 'success',
        text: `Đã đổi vai trò của ${roleTarget.user.email} thành ${roleLabel(roleTarget.nextRole)}.`,
      });
      setRoleTarget(null);
      reload();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Không thể đổi vai trò người dùng.'),
      });
      setRoleTarget(null);
    } finally {
      setSavingRole(false);
    }
  }

  function handleToggleLock(targetUser) {
    setFeedback({ type: '', text: '' });
    if (targetUser.id === currentUser?.id && targetUser.status === 'Active') {
      setFeedback({
        type: 'error',
        text: 'Không thể tự khoá tài khoản đang đăng nhập của chính bạn.',
      });
      return;
    }
    const nextStatus = targetUser.status === 'Active' ? 'Locked' : 'Active';
    setLockTarget({ user: targetUser, nextStatus });
  }

  async function confirmToggleLock() {
    if (!lockTarget) return;
    setSavingLock(true);
    setFeedback({ type: '', text: '' });
    try {
      await adminApi.updateUser(lockTarget.user.id, {
        fullName: lockTarget.user.fullName,
        phone: lockTarget.user.phone || null,
        status: lockTarget.nextStatus,
      });
      setFeedback({
        type: 'success',
        text:
          lockTarget.nextStatus === 'Locked'
            ? `Đã khoá tài khoản ${lockTarget.user.email}.`
            : `Đã mở khoá tài khoản ${lockTarget.user.email}.`,
      });
      setLockTarget(null);
      reload();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'),
      });
    } finally {
      setSavingLock(false);
    }
  }

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p className="portal-subtitle">
            Tìm kiếm tài khoản, cập nhật thông tin, nâng/hạ vai trò và khoá hoặc mở khoá người dùng.
          </p>
        </div>
      </div>

      <PortalNav area="admin" />

      <div className="toolbar-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="au-search">
            Tìm kiếm
          </label>
          <input
            id="au-search"
            type="search"
            className="form-input"
            placeholder="Email, họ tên hoặc SĐT..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="au-role">
            Vai trò
          </label>
          <select
            id="au-role"
            className="form-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="Customer">Khách hàng</option>
            <option value="Owner">Chủ khách sạn</option>
            <option value="Admin">Quản trị viên</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="au-status">
            Trạng thái
          </label>
          <select
            id="au-status"
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Hoạt động</option>
            <option value="Locked">Đã khoá</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="au-sort">
            Sắp xếp
          </label>
          <select
            id="au-sort"
            className="form-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Họ tên A → Z</option>
            <option value="email">Email A → Z</option>
          </select>
        </div>
      </div>

      <div className="toolbar-meta">
        <span>{loading ? 'Đang tải...' : `Tổng ${total} tài khoản`}</span>
        {(search || roleFilter || statusFilter) && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
              setSort('newest');
              setPage(1);
            }}
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {feedback.text && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <Spinner text="Đang tải danh sách người dùng..." />
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
          icon="👤"
          title="Không tìm thấy người dùng"
          description="Không có tài khoản nào khớp từ khoá hoặc bộ lọc hiện tại."
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td data-label="Họ tên">
                        <div className="table-title">
                          {u.fullName} {isSelf && <span className="table-sub">(Bạn)</span>}
                        </div>
                      </td>
                      <td data-label="Email">{u.email}</td>
                      <td data-label="SĐT">{u.phone || '—'}</td>
                      <td data-label="Vai trò">
                        <select
                          aria-label={`Đổi vai trò của ${u.email}`}
                          className="form-select role-select-inline"
                          value={u.role}
                          disabled={isSelf}
                          title={isSelf ? 'Không thể tự đổi vai trò của chính mình' : 'Chọn vai trò'}
                          onChange={(e) => handleRoleSelect(u, e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Trạng thái">
                        <StatusBadge status={u.status} label={userStatusLabel(u.status)} />
                      </td>
                      <td data-label="Ngày tạo">{formatDate(u.createdAt)}</td>
                      <td data-label="Thao tác">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => openEditModal(u)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              u.status === 'Active' ? 'btn-danger' : 'btn-primary'
                            }`}
                            disabled={isSelf && u.status === 'Active'}
                            onClick={() => handleToggleLock(u)}
                          >
                            {u.status === 'Active' ? 'Khoá' : 'Mở khoá'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Modal sửa họ tên & số điện thoại */}
      {editTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
          <div className="modal-card">
            <h3 id="edit-user-title">Sửa thông tin: {editTarget.email}</h3>
            {editServerError && <div className="alert alert-error">{editServerError}</div>}

            <form onSubmit={handleSaveEdit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-field">
                <label className="form-label" htmlFor="eu-name">
                  Họ và tên *
                </label>
                <input
                  id="eu-name"
                  type="text"
                  className={`form-input${editErrors.fullName ? ' is-invalid' : ''}`}
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                />
                {editErrors.fullName && <span className="form-error">{editErrors.fullName}</span>}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="eu-phone">
                  Số điện thoại
                </label>
                <input
                  id="eu-phone"
                  type="tel"
                  className={`form-input${editErrors.phone ? ' is-invalid' : ''}`}
                  placeholder="090xxxxxxx"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
                {editErrors.phone && <span className="form-error">{editErrors.phone}</span>}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={savingEdit}
                  onClick={() => setEditTarget(null)}
                >
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={savingEdit}>
                  {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(roleTarget)}
        title="Xác nhận đổi vai trò"
        message={
          roleTarget
            ? `Đổi vai trò của "${roleTarget.user.email}" từ ${roleLabel(roleTarget.user.role)} sang ${roleLabel(roleTarget.nextRole)}?`
            : ''
        }
        confirmLabel="Đổi vai trò"
        loading={savingRole}
        onConfirm={confirmRoleChange}
        onCancel={() => setRoleTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(lockTarget)}
        title={
          lockTarget?.nextStatus === 'Locked' ? 'Khoá tài khoản' : 'Mở khoá tài khoản'
        }
        message={
          lockTarget
            ? lockTarget.nextStatus === 'Locked'
              ? `Bạn có chắc chắn muốn khoá tài khoản "${lockTarget.user.email}"? Người dùng sẽ không thể đăng nhập.`
              : `Mở khoá lại tài khoản "${lockTarget.user.email}"?`
            : ''
        }
        confirmLabel={lockTarget?.nextStatus === 'Locked' ? 'Khoá tài khoản' : 'Mở khoá'}
        danger={lockTarget?.nextStatus === 'Locked'}
        loading={savingLock}
        onConfirm={confirmToggleLock}
        onCancel={() => setLockTarget(null)}
      />
    </div>
  );
}
