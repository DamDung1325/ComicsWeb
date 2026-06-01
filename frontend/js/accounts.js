/**
 * TLUTRUYEN — Quản lý Tài khoản Quản trị
 * Xử lý các thao tác CRUD cho tài khoản người dùng và quản lý vai trò.
 */

// Trạng thái cục bộ cho danh sách tài khoản
let accountUsersCache = [];
let currentEditingAccountId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các thành phần dùng chung
  initComponents('admin');

  // Kiểm tra bảo mật: Quyền truy cập Admin
  if (!Auth.isAdmin()) {
    _renderAccessDenied();
    return;
  }

  // Khởi tạo trang
  initAccountsPage();
});

/* ─── Khởi tạo trang ────────────────────────────────────────── */

/**
 * Khởi tạo chính cho trang quản lý tài khoản.
 */
async function initAccountsPage() {
  _bindEventHandlers();
  await loadAccounts();
}

/** @private */
function _renderAccessDenied() {
  document.getElementById('admin-account-content').innerHTML = `
    <div class="text-center py-5">
      <h3 class="text-danger"><i class="bi bi-shield-x"></i> Truy cập bị từ chối</h3>
      <p class="text-secondary">Bạn cần đăng nhập bằng tài khoản quản trị viên.</p>
      <a href="../login.html" class="btn btn-cw-primary mt-2">Đăng nhập</a>
    </div>
  `;
}

/** @private */
function _bindEventHandlers() {
  const form = document.getElementById('account-form');
  const resetBtn = document.getElementById('btn-reset-account');
  const searchInput = document.getElementById('account-search');

  if (form) form.addEventListener('submit', handleSaveAccount);
  if (resetBtn) resetBtn.addEventListener('click', resetAccountForm);
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      renderAccountTable(searchInput.value.trim());
    }, CONFIG.DEBOUNCE_DELAY));
  }
}

/* ─── Tải dữ liệu & Hiển thị ───────────────────────────────────── */

/**
 * Lấy và hiển thị tất cả các tài khoản người dùng.
 */
async function loadAccounts() {
  try {
    accountUsersCache = await getUsers();
    _renderAccountStats();
    renderAccountTable();
  } catch (error) {
    console.error('[ADMIN ACCOUNTS] Tải thất bại:', error);
    document.getElementById('account-list').innerHTML = '<p class="text-danger p-3">Không thể tải danh sách tài khoản.</p>';
  }
}

/** @private */
function _renderAccountStats() {
  const total = accountUsersCache.length;
  const admins = accountUsersCache.filter(u => u.role === 'admin').length;
  const users = total - admins;

  document.getElementById('account-stats').innerHTML = `
    <div class="col-12 col-md-4 mb-3">
      <div class="cw-admin-stat-card">
        <div class="cw-admin-stat-card__icon"><i class="bi bi-person-lines-fill"></i></div>
        <div>
          <div class="cw-admin-stat-card__label">Tổng tài khoản</div>
          <div class="cw-admin-stat-card__value">${total}</div>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-4 mb-3">
      <div class="cw-admin-stat-card">
        <div class="cw-admin-stat-card__icon"><i class="bi bi-shield-lock-fill"></i></div>
        <div>
          <div class="cw-admin-stat-card__label">Quản trị viên</div>
          <div class="cw-admin-stat-card__value">${admins}</div>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-4 mb-3">
      <div class="cw-admin-stat-card">
        <div class="cw-admin-stat-card__icon"><i class="bi bi-person-check-fill"></i></div>
        <div>
          <div class="cw-admin-stat-card__label">Người dùng</div>
          <div class="cw-admin-stat-card__value">${users}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Hiển thị bảng tài khoản, tùy chọn lọc theo từ khóa.
 * @param {string} keyword - Từ khóa tìm kiếm.
 */
function renderAccountTable(keyword = '') {
  const query = keyword.toLowerCase();
  const filteredUsers = accountUsersCache.filter(user => {
    const searchString = `${user.displayName} ${user.username || ''} ${user.email} ${user.role}`.toLowerCase();
    return searchString.includes(query);
  });

  const rowsHTML = filteredUsers.map(user => {
    const roleLabel = user.role === 'admin' ? 'Admin' : 'Người dùng';
    const isLocked = user.status === 'locked';
    const statusLabel = isLocked ? 'Tạm khóa' : 'Hoạt động';
    const username = user.username || user.email.split('@')[0];

    return `
      <tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.displayName || '')}</td>
        <td>${escapeHtml(username)}</td>
        <td>${escapeHtml(user.email || '')}</td>
        <td><span class="cw-admin-badge ${user.role === 'admin' ? 'cw-admin-badge--admin' : ''}">${roleLabel}</span></td>
        <td><span class="cw-admin-badge ${isLocked ? 'cw-admin-badge--locked' : 'cw-admin-badge--active'}">${statusLabel}</span></td>
        <td>
          <button class="cw-admin-action-btn" title="Sửa" onclick="startEditAccount(${user.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="cw-admin-action-btn cw-admin-action-btn--delete" title="Xóa" onclick="handleDeleteAccount(${user.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('account-list').innerHTML = `
    <table class="table cw-admin-table align-middle mb-0">
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
      <tbody>
        ${rowsHTML || '<tr><td colspan="7" class="text-center text-secondary py-4">Không tìm thấy tài khoản nào.</td></tr>'}
      </tbody>
    </table>
  `;
}

/* ─── Hành động Tài khoản ────────────────────────────────────────────── */

/**
 * Xử lý gửi biểu mẫu để lưu (tạo mới hoặc cập nhật) một tài khoản.
 */
async function handleSaveAccount(e) {
  e.preventDefault();

  const data = {
    displayName: document.getElementById('fullname').value.trim(),
    username: document.getElementById('username').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value.trim(),
    role: document.getElementById('role').value,
    status: document.getElementById('status').value,
  };

  if (!data.displayName || !data.email) {
    showToast('Vui lòng nhập đầy đủ họ tên và email!', 'warning');
    return;
  }

  if (!currentEditingAccountId && !data.password) {
    showToast('Vui lòng nhập mật khẩu cho tài khoản mới!', 'warning');
    return;
  }

  try {
    if (currentEditingAccountId) {
      // Chế độ Cập nhật: Thay đổi mật khẩu được xử lý riêng hoặc bị vô hiệu hóa trong UI này
      const { password, ...updateData } = data;
      await updateUser(currentEditingAccountId, { ...updateData, updatedAt: new Date().toISOString() });
      showToast('Cập nhật tài khoản thành công!', 'success');
    } else {
      // Chế độ Tạo mới
      await createUser({ ...data, avatar: '', createdAt: new Date().toISOString() });
      showToast('Thêm tài khoản thành công!', 'success');
    }

    resetAccountForm();
    await loadAccounts();
    
  } catch (error) {
    console.error('[ADMIN ACCOUNTS] Lỗi lưu:', error);
    showToast('Lưu tài khoản thất bại. Email có thể đã tồn tại.', 'error');
  }
}

/**
 * Vào chế độ chỉnh sửa cho một tài khoản cụ thể.
 */
function startEditAccount(id) {
  const user = accountUsersCache.find(u => Number(u.id) === Number(id));
  if (!user) return;

  currentEditingAccountId = user.id;

  document.getElementById('account-form-title').innerHTML = '<i class="bi bi-pencil-square"></i> Chỉnh sửa tài khoản';
  document.getElementById('account-id').value = user.id;
  document.getElementById('fullname').value = user.displayName || '';
  document.getElementById('username').value = user.username || user.email.split('@')[0];
  document.getElementById('email').value = user.email || '';
  
  // Vô hiệu hóa trường mật khẩu trong chế độ chỉnh sửa cho giao diện đơn giản này
  const passwordField = document.getElementById('password');
  passwordField.value = '';
  passwordField.placeholder = '(Không thay đổi mật khẩu tại đây)';
  passwordField.disabled = true;
  
  document.getElementById('role').value = user.role || 'user';
  document.getElementById('status').value = user.status || 'active';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Đặt lại biểu mẫu tài khoản về chế độ tạo mới.
 */
function resetAccountForm() {
  currentEditingAccountId = null;
  document.getElementById('account-form-title').innerHTML = '<i class="bi bi-person-plus-fill"></i> Thêm mới tài khoản';
  document.getElementById('account-form').reset();
  document.getElementById('account-id').value = '';
  
  const passwordField = document.getElementById('password');
  passwordField.disabled = false;
  passwordField.placeholder = 'Nhập mật khẩu khi thêm mới';
}

/**
 * Xử lý xoá tài khoản.
 */
async function handleDeleteAccount(id) {
  const currentUser = Auth.getCurrentUser();
  if (currentUser && Number(currentUser.id) === Number(id)) {
    showToast('Không thể xoá chính tài khoản đang đăng nhập!', 'warning');
    return;
  }

  if (!confirm('Bạn có chắc muốn xoá tài khoản này không?')) return;

  try {
    await deleteUser(id);
    showToast('Xoá tài khoản thành công!', 'info');
    await loadAccounts();
  } catch (error) {
    showToast('Xoá tài khoản thất bại!', 'error');
  }
}
