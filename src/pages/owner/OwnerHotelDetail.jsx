import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import PortalNav from '../../components/PortalNav';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { metaApi, ownerApi, uploadApi } from '../../services/api';
import '../../styles/owner.css';
import {
  amenityLabel,
  formatDateTime,
  formatMoney,
  hotelStatusLabel,
  resolveImageUrl,
} from '../../utils/format';
import {
  fetchAllOwnerHotels,
  formatOwnerApiError,
  validateImageFile,
} from '../../utils/portal';
import { validateRoomType } from '../../utils/validate';

const ROOM_PAGE_SIZE = 8;

const EMPTY_ROOM_FORM = {
  name: '',
  bedType: '',
  viewType: '',
  hasBathtub: false,
  maxAdults: 2,
  maxChildren: 1,
  sizeM2: 28,
  pricePerNight: 1200000,
  totalRooms: 5,
  isActive: true,
  amenities: [],
  description: '',
};

export default function OwnerHotelDetail() {
  const { id } = useParams();
  const hotelId = Number(id);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'rooms' ? 'rooms' : 'info';
  const justCreated = searchParams.get('created') === '1';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [amenitiesMeta, setAmenitiesMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Trạng thái thao tác ảnh khách sạn
  const hotelFileRef = useRef(null);
  const [uploadingHotelImg, setUploadingHotelImg] = useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);
  const [deleteHotelImgTarget, setDeleteHotelImgTarget] = useState(null);
  const [deletingHotelImg, setDeletingHotelImg] = useState(false);

  // Lọc / tìm / sắp xếp / phân trang bảng loại phòng
  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('');
  const [roomSort, setRoomSort] = useState('price-asc');
  const [roomPage, setRoomPage] = useState(1);

  // Modal thêm/sửa loại phòng
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM_FORM);
  const [roomErrors, setRoomErrors] = useState({});
  const [roomModalError, setRoomModalError] = useState('');
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomImages, setRoomImages] = useState([]);
  const [pendingRoomFiles, setPendingRoomFiles] = useState([]);
  const [uploadingRoomImg, setUploadingRoomImg] = useState(false);

  // Xoá loại phòng
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allHotels, roomList, amenitiesData] = await Promise.all([
        fetchAllOwnerHotels(),
        ownerApi.roomTypes(hotelId),
        metaApi.amenities(),
      ]);
      const found = allHotels.find((h) => h.id === hotelId);
      if (!found) {
        setError('Không tìm thấy khách sạn thuộc quyền quản lý của bạn.');
      } else {
        setHotel(found);
        setRoomTypes(Array.isArray(roomList) ? roomList : []);
        setAmenitiesMeta(Array.isArray(amenitiesData) ? amenitiesData : []);
      }
    } catch (err) {
      setError(formatOwnerApiError(err, 'Không tải được chi tiết khách sạn.'));
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tự mở modal tạo loại phòng khi đi từ nút "+ Loại phòng" ở danh sách khách sạn.
  useEffect(() => {
    if (searchParams.get('create') === '1' && hotel) {
      setActiveTab('rooms');
      openCreateRoomModal();
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  }, [hotel, searchParams, setSearchParams]);

  const amenityMap = useMemo(() => {
    const map = {};
    amenitiesMeta.forEach((item) => {
      map[item.code] = item.label;
    });
    return map;
  }, [amenitiesMeta]);

  const sortedHotelImages = useMemo(() => {
    const list = Array.isArray(hotel?.images) ? [...hotel.images] : [];
    return list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }, [hotel]);

  // Lọc, tìm kiếm, sắp xếp và phân trang danh sách loại phòng đọc từ API.
  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    let list = roomTypes.filter((rt) => {
      if (roomStatusFilter === 'active' && !rt.isActive) return false;
      if (roomStatusFilter === 'inactive' && rt.isActive) return false;
      if (q) {
        const hay = `${rt.name} ${rt.bedType} ${rt.viewType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (roomSort) {
        case 'price-desc':
          return b.pricePerNight - a.pricePerNight;
        case 'name':
          return a.name.localeCompare(b.name, 'vi');
        case 'rooms-desc':
          return b.totalRooms - a.totalRooms;
        default:
          return a.pricePerNight - b.pricePerNight;
      }
    });

    return list;
  }, [roomTypes, roomSearch, roomStatusFilter, roomSort]);

  const pagedRooms = useMemo(() => {
    const start = (roomPage - 1) * ROOM_PAGE_SIZE;
    return filteredRooms.slice(start, start + ROOM_PAGE_SIZE);
  }, [filteredRooms, roomPage]);

  function switchTab(nextTab) {
    setActiveTab(nextTab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    setSearchParams(next, { replace: true });
  }

  async function handleHotelImageUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !hotel) return;

    const validationMsg = validateImageFile(file);
    if (validationMsg) {
      setFeedback({ type: 'error', text: validationMsg });
      return;
    }

    setUploadingHotelImg(true);
    setFeedback({ type: '', text: '' });
    try {
      const uploaded = await uploadApi.image(file);
      const maxOrder = sortedHotelImages.reduce((acc, img) => Math.max(acc, img.sortOrder), -1);
      const nextOrder = sortedHotelImages.length === 0 ? 0 : maxOrder + 1;
      await ownerApi.addHotelImage(hotel.id, { url: uploaded.url, sortOrder: nextOrder });
      setFeedback({ type: 'success', text: 'Đã tải lên và gắn ảnh khách sạn thành công.' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: formatOwnerApiError(err, 'Không thể tải ảnh lên.') });
    } finally {
      setUploadingHotelImg(false);
    }
  }

  // Đặt ảnh làm ảnh chính (SortOrder = 0) bằng cách thêm lại với SortOrder 0 và đẩy các ảnh từng giữ SortOrder <= 0 xuống sau.
  async function handleSetPrimaryImage(targetImage) {
    if (!hotel || !targetImage) return;
    setSettingPrimaryId(targetImage.id);
    setFeedback({ type: '', text: '' });
    try {
      const maxOrder = sortedHotelImages.reduce((acc, img) => Math.max(acc, img.sortOrder), 0);
      await ownerApi.addHotelImage(hotel.id, { url: targetImage.url, sortOrder: 0 });
      await ownerApi.deleteHotelImage(hotel.id, targetImage.id);

      const conflicts = sortedHotelImages.filter(
        (img) => img.id !== targetImage.id && img.sortOrder <= 0,
      );
      for (let i = 0; i < conflicts.length; i += 1) {
        const img = conflicts[i];
        await ownerApi.addHotelImage(hotel.id, {
          url: img.url,
          sortOrder: maxOrder + i + 1,
        });
        await ownerApi.deleteHotelImage(hotel.id, img.id);
      }

      setFeedback({ type: 'success', text: 'Đã đặt ảnh chính cho khách sạn.' });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: formatOwnerApiError(err, 'Không thể đặt ảnh chính.'),
      });
    } finally {
      setSettingPrimaryId(null);
    }
  }

  async function confirmDeleteHotelImage() {
    if (!hotel || !deleteHotelImgTarget) return;
    setDeletingHotelImg(true);
    try {
      await ownerApi.deleteHotelImage(hotel.id, deleteHotelImgTarget.id);
      setDeleteHotelImgTarget(null);
      setFeedback({ type: 'success', text: 'Đã xoá ảnh khách sạn.' });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: formatOwnerApiError(err, 'Không thể xoá ảnh khách sạn.'),
      });
    } finally {
      setDeletingHotelImg(false);
    }
  }

  function openCreateRoomModal() {
    setEditingRoom(null);
    setRoomForm(EMPTY_ROOM_FORM);
    setRoomErrors({});
    setRoomModalError('');
    setRoomImages([]);
    setPendingRoomFiles([]);
    setRoomModalOpen(true);
  }

  function openEditRoomModal(rt) {
    setEditingRoom(rt);
    setRoomForm({
      name: rt.name || '',
      bedType: rt.bedType || '',
      viewType: rt.viewType || '',
      hasBathtub: Boolean(rt.hasBathtub),
      maxAdults: rt.maxAdults ?? 2,
      maxChildren: rt.maxChildren ?? 1,
      sizeM2: rt.sizeM2 ?? 25,
      pricePerNight: rt.pricePerNight ?? 1000000,
      totalRooms: rt.totalRooms ?? 1,
      isActive: Boolean(rt.isActive),
      amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
      description: rt.description || '',
    });
    setRoomErrors({});
    setRoomModalError('');
    setRoomImages(Array.isArray(rt.images) ? rt.images : []);
    setPendingRoomFiles([]);
    setRoomModalOpen(true);
  }

  function toggleRoomAmenity(code) {
    setRoomForm((prev) => {
      const exists = prev.amenities.includes(code);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((item) => item !== code)
          : [...prev.amenities, code],
      };
    });
  }

  async function handleRoomImagePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const msg = validateImageFile(file);
    if (msg) {
      setRoomModalError(msg);
      return;
    }

    if (!editingRoom) {
      const previewUrl = URL.createObjectURL(file);
      setPendingRoomFiles((prev) => [...prev, { file, previewUrl }]);
      return;
    }

    setUploadingRoomImg(true);
    setRoomModalError('');
    try {
      const uploaded = await uploadApi.image(file);
      const nextOrder =
        roomImages.reduce((acc, img) => Math.max(acc, img.sortOrder), -1) + 1;
      const added = await ownerApi.addRoomTypeImage(editingRoom.id, {
        url: uploaded.url,
        sortOrder: nextOrder,
      });
      setRoomImages((prev) => [...prev, added]);
      await loadData();
    } catch (err) {
      setRoomModalError(formatOwnerApiError(err, 'Không thể tải ảnh loại phòng lên.'));
    } finally {
      setUploadingRoomImg(false);
    }
  }

  async function handleRemoveRoomImage(img) {
    if (!editingRoom) return;
    setRoomModalError('');
    try {
      await ownerApi.deleteRoomTypeImage(editingRoom.id, img.id);
      setRoomImages((prev) => prev.filter((item) => item.id !== img.id));
      await loadData();
    } catch (err) {
      setRoomModalError(formatOwnerApiError(err, 'Không thể xoá ảnh loại phòng.'));
    }
  }

  function handleRemovePendingRoomFile(index) {
    setPendingRoomFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  }

  async function handleSaveRoom(e) {
    e.preventDefault();
    setRoomModalError('');

    const validation = validateRoomType(roomForm);
    setRoomErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const payload = {
      name: roomForm.name.trim(),
      bedType: roomForm.bedType.trim(),
      viewType: roomForm.viewType.trim(),
      hasBathtub: Boolean(roomForm.hasBathtub),
      maxAdults: Number(roomForm.maxAdults),
      maxChildren: Number(roomForm.maxChildren),
      sizeM2: Number(roomForm.sizeM2),
      pricePerNight: Number(roomForm.pricePerNight),
      totalRooms: Number(roomForm.totalRooms),
      description: roomForm.description.trim(),
      amenities: roomForm.amenities.join(','),
      isActive: Boolean(roomForm.isActive),
    };

    setSavingRoom(true);
    try {
      if (editingRoom) {
        await ownerApi.updateRoomType(editingRoom.id, payload);
        setFeedback({ type: 'success', text: 'Đã cập nhật loại phòng thành công.' });
      } else {
        const created = await ownerApi.createRoomType(hotelId, payload);
        // Nếu người dùng đã chọn sẵn ảnh lúc tạo loại phòng mới thì tải ảnh lên ngay sau khi tạo.
        for (let i = 0; i < pendingRoomFiles.length; i += 1) {
          const uploaded = await uploadApi.image(pendingRoomFiles[i].file);
          await ownerApi.addRoomTypeImage(created.id, {
            url: uploaded.url,
            sortOrder: i,
          });
          if (pendingRoomFiles[i].previewUrl) {
            URL.revokeObjectURL(pendingRoomFiles[i].previewUrl);
          }
        }
        setFeedback({ type: 'success', text: 'Đã thêm loại phòng mới thành công.' });
      }
      setRoomModalOpen(false);
      await loadData();
    } catch (err) {
      setRoomModalError(formatOwnerApiError(err, 'Không thể lưu loại phòng.'));
    } finally {
      setSavingRoom(false);
    }
  }

  async function confirmDeleteRoom() {
    if (!deleteRoomTarget) return;
    setDeletingRoom(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await ownerApi.deleteRoomType(deleteRoomTarget.id);
      setDeleteRoomTarget(null);
      setFeedback({
        type: 'success',
        text: res?.message || 'Đã xử lý xoá loại phòng.',
      });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: formatOwnerApiError(err, 'Không thể xoá loại phòng.'),
      });
    } finally {
      setDeletingRoom(false);
    }
  }

  return (
    <div className="container portal-page">
      <div className="portal-header">
        <div>
          <h1>{hotel ? hotel.name : 'Chi tiết khách sạn'}</h1>
          {hotel && (
            <p className="portal-subtitle">
              {hotel.city} · {hotel.district} · {'★'.repeat(hotel.starRating || 0)}
            </p>
          )}
        </div>
        <div className="portal-header-actions">
          <Link to="/owner/hotels" className="btn btn-outline btn-sm">
            ← Danh sách
          </Link>
          {hotel && (
            <>
              <Link to={`/owner/hotels/${hotel.id}/edit`} className="btn btn-outline btn-sm">
                Sửa thông tin
              </Link>
              <Link to={`/owner/hotels/${hotel.id}/calendar`} className="btn btn-primary btn-sm">
                Xem lịch trống
              </Link>
            </>
          )}
        </div>
      </div>

      <PortalNav area="owner" />

      {justCreated && (
        <div className="alert alert-success">
          <strong>Đã gửi duyệt!</strong> Khách sạn của bạn đang ở trạng thái Chờ duyệt. Hãy tải ảnh
          và thêm loại phòng ngay để sẵn sàng đón khách sau khi được duyệt.
        </div>
      )}

      {feedback.text && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <Spinner text="Đang tải chi tiết khách sạn..." />
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadData}
            style={{ marginTop: 10 }}
          >
            Thử lại
          </button>
        </div>
      ) : (
        hotel && (
          <>
            <div className="portal-tabs" role="tablist" aria-label="Chi tiết khách sạn">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'info'}
                className={`portal-tab${activeTab === 'info' ? ' active' : ''}`}
                onClick={() => switchTab('info')}
              >
                Thông tin &amp; ảnh ({sortedHotelImages.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'rooms'}
                className={`portal-tab${activeTab === 'rooms' ? ' active' : ''}`}
                onClick={() => switchTab('rooms')}
              >
                Loại phòng ({roomTypes.length})
              </button>
            </div>

            {activeTab === 'info' ? (
              <>
                <section className="portal-card">
                  <div className="portal-card-head">
                    <h2>Thông tin khách sạn</h2>
                    <StatusBadge status={hotel.status} label={hotelStatusLabel(hotel.status)} />
                  </div>

                  <dl className="hotel-info-dl">
                    <dt>Tên khách sạn</dt>
                    <dd>{hotel.name}</dd>
                    <dt>Địa chỉ</dt>
                    <dd>
                      {hotel.address}, {hotel.district}, {hotel.city}
                    </dd>
                    <dt>Hạng sao</dt>
                    <dd>{hotel.starRating} sao</dd>
                    <dt>Tiện ích</dt>
                    <dd>
                      {hotel.amenities?.length > 0 ? (
                        <div className="amenity-chips">
                          {hotel.amenities.map((code) => (
                            <span key={code} className="amenity-chip">
                              {amenityLabel(code, amenityMap)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        'Chưa cập nhật'
                      )}
                    </dd>
                    <dt>Mô tả</dt>
                    <dd>{hotel.description || 'Chưa có mô tả.'}</dd>
                    <dt>Cập nhật gần nhất</dt>
                    <dd>{formatDateTime(hotel.updatedAt)}</dd>
                  </dl>
                </section>

                <section className="portal-card">
                  <div className="portal-card-head">
                    <h2>Thư viện ảnh khách sạn</h2>
                  </div>

                  <div className="image-upload-bar">
                    <div>
                      <strong>Tải ảnh lên (JPG, PNG, WebP · tối đa 5 MB)</strong>
                      <div className="table-sub">
                        Ảnh có thứ tự đầu tiên (SortOrder 0) sẽ được dùng làm ảnh bìa đại diện.
                      </div>
                    </div>
                    <div>
                      <input
                        ref={hotelFileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        onChange={handleHotelImageUpload}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={uploadingHotelImg}
                        onClick={() => hotelFileRef.current?.click()}
                      >
                        {uploadingHotelImg ? 'Đang tải ảnh lên...' : '+ Tải ảnh lên'}
                      </button>
                    </div>
                  </div>

                  {sortedHotelImages.length === 0 ? (
                    <EmptyState
                      icon="🖼️"
                      title="Chưa có ảnh khách sạn"
                      description="Hãy tải lên ít nhất 1 ảnh đẹp để thu hút khách đặt phòng."
                    />
                  ) : (
                    <div className="image-gallery-grid">
                      {sortedHotelImages.map((img, idx) => {
                        const isPrimary = idx === 0;
                        return (
                          <article key={img.id} className="image-tile">
                            <div className="image-tile-media">
                              <img
                                src={resolveImageUrl(img.url)}
                                alt={`${hotel.name} - ảnh ${idx + 1}`}
                                loading="lazy"
                              />
                              {isPrimary && <span className="image-primary-badge">Ảnh chính</span>}
                            </div>
                            <div className="image-tile-actions">
                              {!isPrimary ? (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  disabled={settingPrimaryId === img.id}
                                  onClick={() => handleSetPrimaryImage(img)}
                                >
                                  {settingPrimaryId === img.id ? 'Đang đặt...' : 'Đặt ảnh chính'}
                                </button>
                              ) : (
                                <span className="table-sub">Thứ tự #0</span>
                              )}
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeleteHotelImgTarget(img)}
                              >
                                Xoá
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <>
                <div className="toolbar-grid">
                  <div className="form-field">
                    <label className="form-label" htmlFor="room-search">
                      Tìm loại phòng
                    </label>
                    <input
                      id="room-search"
                      type="search"
                      className="form-input"
                      placeholder="Tên phòng, giường, hướng..."
                      value={roomSearch}
                      onChange={(e) => {
                        setRoomSearch(e.target.value);
                        setRoomPage(1);
                      }}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="room-status-filter">
                      Trạng thái bán
                    </label>
                    <select
                      id="room-status-filter"
                      className="form-select"
                      value={roomStatusFilter}
                      onChange={(e) => {
                        setRoomStatusFilter(e.target.value);
                        setRoomPage(1);
                      }}
                    >
                      <option value="">Tất cả</option>
                      <option value="active">Đang bán</option>
                      <option value="inactive">Ngừng bán</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="room-sort">
                      Sắp xếp
                    </label>
                    <select
                      id="room-sort"
                      className="form-select"
                      value={roomSort}
                      onChange={(e) => {
                        setRoomSort(e.target.value);
                        setRoomPage(1);
                      }}
                    >
                      <option value="price-asc">Giá thấp → cao</option>
                      <option value="price-desc">Giá cao → thấp</option>
                      <option value="name">Tên A → Z</option>
                      <option value="rooms-desc">Nhiều phòng nhất</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={openCreateRoomModal}
                    >
                      + Thêm loại phòng
                    </button>
                  </div>
                </div>

                {filteredRooms.length === 0 ? (
                  <EmptyState
                    icon="🛏️"
                    title="Chưa có loại phòng nào"
                    description="Thêm loại phòng với giá, sức chứa và số lượng phòng để bắt đầu mở bán."
                    action={
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={openCreateRoomModal}
                      >
                        + Thêm loại phòng
                      </button>
                    }
                  />
                ) : (
                  <>
                    <div className="table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Tên loại phòng</th>
                            <th>Giường &amp; hướng</th>
                            <th>Sức chứa</th>
                            <th>Diện tích</th>
                            <th>Giá / đêm</th>
                            <th>Tổng phòng</th>
                            <th>Đang bán</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRooms.map((rt) => (
                            <tr key={rt.id}>
                              <td data-label="Tên loại phòng">
                                <div className="table-title">{rt.name}</div>
                                <div className="table-sub">
                                  {rt.hasBathtub ? 'Có bồn tắm' : 'Vòi sen'} ·{' '}
                                  {rt.images?.length || 0} ảnh
                                </div>
                              </td>
                              <td data-label="Giường & hướng">
                                <div>{rt.bedType}</div>
                                <div className="table-sub">{rt.viewType || 'Tiêu chuẩn'}</div>
                              </td>
                              <td data-label="Sức chứa">
                                {rt.maxAdults} lớn, {rt.maxChildren} trẻ em
                              </td>
                              <td data-label="Diện tích">{rt.sizeM2} m²</td>
                              <td data-label="Giá / đêm">
                                <strong>{formatMoney(rt.pricePerNight)}</strong>
                              </td>
                              <td data-label="Tổng phòng">
                                {rt.totalRooms}
                                <div className="table-sub">Còn hôm nay: {rt.available}</div>
                              </td>
                              <td data-label="Đang bán">
                                <StatusBadge
                                  status={rt.isActive ? 'Active' : 'Suspended'}
                                  label={rt.isActive ? 'Đang bán' : 'Ngừng bán'}
                                />
                              </td>
                              <td data-label="Thao tác">
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => openEditRoomModal(rt)}
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => setDeleteRoomTarget(rt)}
                                  >
                                    Xoá
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Pagination
                      page={roomPage}
                      pageSize={ROOM_PAGE_SIZE}
                      total={filteredRooms.length}
                      onPageChange={setRoomPage}
                    />
                  </>
                )}
              </>
            )}
          </>
        )
      )}

      {/* Modal thêm / sửa loại phòng */}
      {roomModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">
          <div className="modal-card modal-card-lg">
            <h3 id="room-modal-title">
              {editingRoom ? `Sửa loại phòng: ${editingRoom.name}` : 'Thêm loại phòng mới'}
            </h3>

            {roomModalError && <div className="alert alert-error">{roomModalError}</div>}

            <form onSubmit={handleSaveRoom} noValidate>
              <div className="portal-form-grid">
                <div className="form-field portal-form-full">
                  <label className="form-label" htmlFor="rt-name">
                    Tên loại phòng *
                  </label>
                  <input
                    id="rt-name"
                    type="text"
                    className={`form-input${roomErrors.name ? ' is-invalid' : ''}`}
                    value={roomForm.name}
                    onChange={(e) => setRoomForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  {roomErrors.name && <span className="form-error">{roomErrors.name}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="rt-bed">
                    Loại giường *
                  </label>
                  <input
                    id="rt-bed"
                    type="text"
                    className={`form-input${roomErrors.bedType ? ' is-invalid' : ''}`}
                    placeholder="Ví dụ: 1 giường King"
                    value={roomForm.bedType}
                    onChange={(e) => setRoomForm((p) => ({ ...p, bedType: e.target.value }))}
                  />
                  {roomErrors.bedType && <span className="form-error">{roomErrors.bedType}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="rt-view">
                    Hướng nhìn
                  </label>
                  <input
                    id="rt-view"
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Hướng biển / Hướng phố"
                    value={roomForm.viewType}
                    onChange={(e) => setRoomForm((p) => ({ ...p, viewType: e.target.value }))}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="rt-adults">
                    Người lớn tối đa *
                  </label>
                  <input
                    id="rt-adults"
                    type="number"
                    min="1"
                    max="20"
                    className={`form-input${roomErrors.maxAdults ? ' is-invalid' : ''}`}
                    value={roomForm.maxAdults}
                    onChange={(e) => setRoomForm((p) => ({ ...p, maxAdults: e.target.value }))}
                  />
                  {roomErrors.maxAdults && <span className="form-error">{roomErrors.maxAdults}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="rt-children">
                    Trẻ em tối đa *
                  </label>
                  <input
                    id="rt-children"
                    type="number"
                    min="0"
                    max="20"
                    className={`form-input${roomErrors.maxChildren ? ' is-invalid' : ''}`}
                    value={roomForm.maxChildren}
                    onChange={(e) => setRoomForm((p) => ({ ...p, maxChildren: e.target.value }))}
                  />
                  {roomErrors.maxChildren && (
                    <span className="form-error">{roomErrors.maxChildren}</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="rt-size">
                    Diện tích (m²) *
                  </label>
                  <input
                    id="rt-size"
                    type="number"
                    min="5"
                    max="1000"
                    className={`form-input${roomErrors.sizeM2 ? ' is-invalid' : ''}`}
                    value={roomForm.sizeM2}
                    onChange={(e) => setRoomForm((p) => ({ ...p, sizeM2: e.target.value }))}
                  />
                  {roomErrors.sizeM2 && <span className="form-error">{roomErrors.sizeM2}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="rt-price">
                    Giá mỗi đêm (VNĐ) *
                  </label>
                  <input
                    id="rt-price"
                    type="number"
                    min="1000"
                    step="10000"
                    className={`form-input${roomErrors.pricePerNight ? ' is-invalid' : ''}`}
                    value={roomForm.pricePerNight}
                    onChange={(e) =>
                      setRoomForm((p) => ({ ...p, pricePerNight: e.target.value }))
                    }
                  />
                  {roomErrors.pricePerNight && (
                    <span className="form-error">{roomErrors.pricePerNight}</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="rt-total">
                    Tổng số phòng *
                  </label>
                  <input
                    id="rt-total"
                    type="number"
                    min="1"
                    max="1000"
                    className={`form-input${roomErrors.totalRooms ? ' is-invalid' : ''}`}
                    value={roomForm.totalRooms}
                    onChange={(e) => setRoomForm((p) => ({ ...p, totalRooms: e.target.value }))}
                  />
                  {roomErrors.totalRooms && (
                    <span className="form-error">{roomErrors.totalRooms}</span>
                  )}
                </div>

                <div className="form-field" style={{ justifyContent: 'center', gap: 10 }}>
                  <label className="check-item">
                    <input
                      type="checkbox"
                      checked={roomForm.hasBathtub}
                      onChange={(e) =>
                        setRoomForm((p) => ({ ...p, hasBathtub: e.target.checked }))
                      }
                    />
                    <span>Có bồn tắm</span>
                  </label>
                  <label className="check-item">
                    <input
                      type="checkbox"
                      checked={roomForm.isActive}
                      onChange={(e) =>
                        setRoomForm((p) => ({ ...p, isActive: e.target.checked }))
                      }
                    />
                    <span>Đang mở bán</span>
                  </label>
                </div>

                <div className="form-field portal-form-full">
                  <span className="form-label">Tiện ích phòng</span>
                  <div className="amenities-check-grid">
                    {amenitiesMeta.map((am) => (
                      <label key={am.code} className="check-item">
                        <input
                          type="checkbox"
                          checked={roomForm.amenities.includes(am.code)}
                          onChange={() => toggleRoomAmenity(am.code)}
                        />
                        <span>{am.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-field portal-form-full">
                  <label className="form-label" htmlFor="rt-desc">
                    Mô tả loại phòng
                  </label>
                  <textarea
                    id="rt-desc"
                    rows={3}
                    className="form-textarea"
                    value={roomForm.description}
                    onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="form-field portal-form-full">
                  <span className="form-label">Ảnh loại phòng</span>
                  <div className="room-modal-images">
                    {editingRoom
                      ? roomImages.map((img) => (
                          <div key={img.id} className="room-modal-thumb">
                            <img src={resolveImageUrl(img.url)} alt="Ảnh phòng" />
                            <button
                              type="button"
                              title="Xoá ảnh"
                              onClick={() => handleRemoveRoomImage(img)}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      : pendingRoomFiles.map((item, idx) => (
                          <div key={item.previewUrl} className="room-modal-thumb">
                            <img src={item.previewUrl} alt="Ảnh chờ tải" />
                            <button
                              type="button"
                              title="Bỏ ảnh"
                              onClick={() => handleRemovePendingRoomFile(idx)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingRoomImg || savingRoom}
                      onChange={handleRoomImagePick}
                    />
                    {uploadingRoomImg && <span className="table-sub">Đang tải ảnh lên...</span>}
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={savingRoom}
                  onClick={() => setRoomModalOpen(false)}
                >
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={savingRoom}>
                  {savingRoom ? 'Đang lưu...' : editingRoom ? 'Lưu cập nhật' : 'Tạo loại phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteHotelImgTarget)}
        title="Xoá ảnh khách sạn"
        message="Bạn có chắc chắn muốn xoá ảnh này khỏi thư viện khách sạn?"
        confirmLabel="Xoá ảnh"
        danger
        loading={deletingHotelImg}
        onConfirm={confirmDeleteHotelImage}
        onCancel={() => setDeleteHotelImgTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteRoomTarget)}
        title="Xoá loại phòng"
        message={
          deleteRoomTarget
            ? `Xoá loại phòng "${deleteRoomTarget.name}"? Nếu loại phòng đã có đơn đặt, hệ thống sẽ chuyển sang trạng thái ngừng hoạt động (xoá mềm).`
            : ''
        }
        confirmLabel="Xác nhận xoá"
        danger
        loading={deletingRoom}
        onConfirm={confirmDeleteRoom}
        onCancel={() => setDeleteRoomTarget(null)}
      />
    </div>
  );
}
