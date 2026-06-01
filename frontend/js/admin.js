/**
 * TLUTRUYEN — Logic Bảng điều khiển Quản trị
 * Xử lý thống kê toàn cục, quản lý truyện và quy trình phê duyệt.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các thành phần dùng chung
  initComponents('admin');

  // Kiểm tra bảo mật: Quyền truy cập Admin
  if (!Auth.isAdmin()) {
    _renderAccessDenied();
    return;
  }

  // Tải dữ liệu Bảng điều khiển
  initAdminDashboard();
});

/* ─── Khởi tạo trang ────────────────────────────────────────── */

/**
 * Khởi tạo chính cho bảng điều khiển quản trị.
 */
async function initAdminDashboard() {
  loadAdminStats();
  loadAdminComicList();
  loadAdminAccountList();
  loadPendingComicList();
}

/** @private */
function _renderAccessDenied() {
  document.getElementById('admin-content').innerHTML = `
    <div class="text-center py-5">
      <h3 class="text-danger"><i class="bi bi-shield-x"></i> Truy cập bị từ chối</h3>
      <p class="text-secondary">Bạn cần đăng nhập với tài khoản quản trị viên.</p>
      <a href="../login.html" class="btn btn-cw-primary mt-2">Đăng nhập</a>
    </div>
  `;
}

/* ─── Thống kê ─────────────────────────────────────────────────── */

/**
 * Tải và hiển thị thống kê quản trị toàn cục.
 */
async function loadAdminStats() {
  const container = document.getElementById('admin-stats');
  if (!container) return;

  try {
    const comics = await getComics({ limit: 999 });
    
    const stats = {
      total: comics.length,
      ongoing: comics.filter(c => c.status === 'ongoing' && c.approved !== false).length,
      pending: comics.filter(c => c.approved === false).length,
      views: comics.reduce((sum, c) => sum + (c.views || 0), 0)
    };

    container.innerHTML = _renderStatsHTML(stats);
    
  } catch (error) {
    console.error('[ADMIN] Lỗi tải thống kê:', error);
  }
}

/** @private */
function _renderStatsHTML(stats) {
  return `
    <div class="col-md-3 mb-3">
      <div class="p-3 rounded-3 bg-surface border">
        <h5 class="text-secondary mb-1">Tổng truyện</h5>
        <h2 class="text-primary font-heading">${stats.total}</h2>
      </div>
    </div>
    <div class="col-md-3 mb-3">
      <div class="p-3 rounded-3 bg-surface border">
        <h5 class="text-secondary mb-1">Đang ra</h5>
        <h2 class="text-accent font-heading">${stats.ongoing}</h2>
      </div>
    </div>
    <div class="col-md-3 mb-3">
      <div class="p-3 rounded-3 bg-surface border">
        <h5 class="text-secondary mb-1">Chờ duyệt</h5>
        <h2 class="text-warning font-heading">${stats.pending}</h2>
      </div>
    </div>
    <div class="col-md-3 mb-3">
      <div class="p-3 rounded-3 bg-surface border">
        <h5 class="text-secondary mb-1">Lượt xem</h5>
        <h2 class="text-success font-heading">${formatViews(stats.views)}</h2>
      </div>
    </div>
  `;
}

/* ─── Quản lý truyện ───────────────────────────────────────────── */

/**
 * Tải và hiển thị danh sách đầy đủ các bộ truyện để quản lý.
 */
async function loadAdminComicList() {
  const container = document.getElementById('admin-comic-list');
  if (!container) return;

  try {
    const comics = await getComics({ limit: 999 });
    container.innerHTML = _renderComicTable(comics);
    
  } catch (error) {
    console.error('[ADMIN] Lỗi tải danh sách truyện:', error);
    container.innerHTML = '<p class="text-danger">Lỗi tải danh sách truyện.</p>';
  }
}

/** @private */
function _renderComicTable(comics) {
  const rowsHTML = comics.map(comic => `
    <tr>
      <td>${comic.id}</td>
      <td><strong>${escapeHtml(comic.title)}</strong></td>
      <td>${escapeHtml(comic.author)}</td>
      <td>
        ${comic.approved === false 
          ? '<span class="badge bg-warning text-dark">Chờ duyệt</span>'
          : `<span class="cw-genre-tag">${comic.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}</span>`
        }
      </td>
      <td>${formatViews(comic.views || 0)}</td>
      <td>
        <button class="btn btn-sm btn-cw-outline" onclick="window.location.href='editcomic.html?id=${comic.id}'" title="Sửa">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-info ms-1" onclick="window.open('../comic-detail.html?id=${comic.id}', '_blank')" title="Xem">
          <i class="bi bi-eye"></i>
        </button>
        ${comic.approved === false ? `
          <button class="btn btn-sm btn-outline-success ms-1" onclick="handleApproveComic(${comic.id})" title="Duyệt">
            <i class="bi bi-check-circle"></i>
          </button>
        ` : ''}
        <button class="btn btn-sm btn-outline-danger ms-1" onclick="handleDeleteComic(${comic.id})" title="Xoá">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  return `
    <table class="table table-light table-hover">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên truyện</th>
          <th>Tác giả</th>
          <th>Trạng thái</th>
          <th>Lượt xem</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  `;
}

/* ─── Phê duyệt đang chờ ──────────────────────────────────────────── */

/**
 * Tải và hiển thị các bộ truyện đang chờ phê duyệt.
 */
async function loadPendingComicList() {
  const container = document.getElementById('admin-pending-comic-list');
  if (!container) return;

  try {
    const comics = await getComics({ limit: 999 });
    const pending = comics.filter(c => c.approved === false);

    if (pending.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-secondary">
          <i class="bi bi-check-circle fs-2"></i>
          <p class="mt-2">Không có truyện nào đang chờ duyệt.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = await _renderPendingTable(pending);
    
  } catch (error) {
    console.error('[ADMIN] Lỗi tải danh sách chờ:', error);
    container.innerHTML = '<p class="text-danger p-3">Lỗi tải danh sách chờ duyệt.</p>';
  }
}

/** @private */
async function _renderPendingTable(pending) {
  const rows = await Promise.all(pending.map(async comic => {
    let uploaderName = 'Ẩn danh';
    if (comic.uploaderId) {
      try {
        const uploader = await fetchAPI(`/users/${comic.uploaderId}`);
        uploaderName = uploader?.displayName || uploader?.email || comic.uploaderId;
      } catch(e) {}
    }

    return `
      <tr>
        <td>${comic.id}</td>
        <td>
          <img src="${getComicImageSrc(comic.coverImage, '../../')}" class="admin-thumb" onerror="this.src='../../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
        </td>
        <td><strong>${escapeHtml(comic.title)}</strong><br><small class="text-secondary">${(comic.genres||[]).join(', ')}</small></td>
        <td>${escapeHtml(comic.author)}</td>
        <td>${escapeHtml(uploaderName)}</td>
        <td><small class="text-muted">${formatDate(comic.createdAt)}</small></td>
        <td>
          <button class="btn btn-sm btn-outline-info me-1" onclick="window.open('../comic-detail.html?id=${comic.id}', '_blank')" title="Xem">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-success me-1" onclick="handleApproveComic(${comic.id})" title="Duyệt">
            <i class="bi bi-check-circle"></i> Duyệt
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="handleDeleteComic(${comic.id})" title="Từ chối">
            <i class="bi bi-x-circle"></i> Từ chối
          </button>
        </td>
      </tr>
    `;
  }));

  return `
    <table class="table table-dark table-hover">
      <thead>
        <tr>
          <th>ID</th>
          <th>Ảnh</th>
          <th>Tên truyện</th>
          <th>Tác giả</th>
          <th>Người đăng</th>
          <th>Thời gian</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  `;
}

/* ─── Quản lý tài khoản ─────────────────────────────────────────── */

/**
 * Tải và hiển thị bảng quản lý tài khoản.
 */
async function loadAdminAccountList() {
  const container = document.getElementById('admin-account-list');
  if (!container) return;

  try {
    const users = await getUsers();
    container.innerHTML = _renderAccountTable(users);
    
  } catch (error) {
    console.error('[ADMIN] Lỗi tải danh sách tài khoản:', error);
    container.innerHTML = '<p class="text-danger">Lỗi tải danh sách tài khoản.</p>';
  }
}

/** @private */
function _renderAccountTable(users) {
  const rowsHTML = users.map(user => {
    const username = user.username || user.email?.split('@')[0] || 'Unknown';
    const isLocked = user.status === 'locked';
    
    return `
      <tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.displayName || '')}</td>
        <td>${escapeHtml(username)}</td>
        <td>${escapeHtml(user.email || '')}</td>
        <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role === 'admin' ? 'Admin' : 'User'}</span></td>
        <td><span class="badge ${isLocked ? 'bg-warning text-dark' : 'bg-success'}">${isLocked ? 'Tạm khóa' : 'Hoạt động'}</span></td>
        <td>
          <button class="btn btn-sm btn-cw-outline" onclick="window.location.href='accounts.html?edit=${user.id}'" title="Sửa">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger ms-1" onclick="handleDeleteUserDashboard(${user.id})" title="Xoá">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table class="table table-light table-hover">
      <thead>
        <tr>
          <th>ID</th>
          <th>Họ tên</th>
          <th>Username</th>
          <th>Email</th>
          <th>Vai trò</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  `;
}

/* ─── Hành động Admin ──────────────────────────────────────────────── */

/**
 * Phê duyệt một bộ truyện đang chờ.
 */
async function handleApproveComic(id) {
  if (!confirm('Bạn có muốn duyệt cho phép hiển thị truyện này không?')) return;

  try {
    await patchComic(id, { approved: true });
    showToast('Duyệt truyện thành công!', 'success');
    initAdminDashboard();
    
  } catch (error) {
    showToast('Lỗi duyệt truyện!', 'error');
  }
}

/**
 * Xóa một bộ truyện và các chương liên quan.
 */
async function handleDeleteComic(id) {
  if (!confirm('Xoá truyện này sẽ xoá vĩnh viễn tất cả ảnh bìa và chương truyện. Tiếp tục?')) return;

  try {
    const chapters = await getChaptersByComic(id);
    for (const chapter of chapters) {
      await deleteChapter(chapter.id);
    }

    await deleteComic(id);
    showToast('Xoá truyện thành công!', 'info');
    initAdminDashboard();
    
  } catch (error) {
    showToast('Xoá truyện thất bại!', 'error');
  }
}

/**
 * Xóa tài khoản người dùng từ bảng điều khiển.
 */
async function handleDeleteUserDashboard(id) {
  const currentUser = Auth.getCurrentUser();
  if (currentUser && Number(currentUser.id) === Number(id)) {
    showToast('Bạn không thể xóa chính mình!', 'warning');
    return;
  }

  if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;

  try {
    await deleteUser(id);
    showToast('Xóa tài khoản thành công!', 'success');
    loadAdminAccountList();
    
  } catch (error) {
    showToast('Xóa tài khoản thất bại!', 'error');
  }
}
