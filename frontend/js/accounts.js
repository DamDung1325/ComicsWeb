/**
 * CRUD tài khoản admin
 * Thêm, sửa, xoá, tìm kiếm tài khoản trong backend/db.json.
 */
let accountUsers = [];
let editingAccountId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initComponents === 'function') {
    initComponents('admin');
  }

  if (!Auth.isAdmin()) {
    document.getElementById('admin-account-content').innerHTML = `
      <div class="text-center py-5">
        <h3 class="text-danger"><i class="bi bi-shield-x"></i> Truy cập bị từ chối</h3>
        <p class="text-secondary">Bạn cần đăng nhập bằng tài khoản admin.</p>
        <a href="../login.html" class="btn btn-cw-primary mt-2">Đăng nhập</a>
      </div>
    `;
    return;
  }

  bindAccountEvents();
  await loadAccounts();
});

function bindAccountEvents() {
  const form = document.getElementById('account-form');
  const resetBtn = document.getElementById('btn-reset-account');
  const searchInput = document.getElementById('account-search');

  form.addEventListener('submit', handleSaveAccount);
  resetBtn.addEventListener('click', resetAccountForm);
  searchInput.addEventListener('input', () => renderAccountTable(searchInput.value.trim()));
}

async function loadAccounts() {
  try {
    accountUsers = await getUsers();
    renderAccountStats();
    renderAccountTable();
  } catch (err) {
    console.error(err);
    document.getElementById('account-list').innerHTML = `
      <p class="text-danger p-3">Không thể tải danh sách tài khoản.</p>
    `;
  }
}

function renderAccountStats() {
  const total = accountUsers.length;
  const admins = accountUsers.filter(u => u.role === 'admin').length;
  const normalUsers = total - admins;

  document.getElementById('account-stats').innerHTML = `
    <div class="col-12 col-md-4">
      <div class="cw-admin-stat-card">
        <div class="cw-admin-stat-card__icon"><i class="bi bi-person-lines-fill"></i></div>
        <div>
          <div class="cw-admin-stat-card__label">Tổng tài khoản</div>
          <div class="cw-admin-stat-card__value">${total}</div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-4">
      <div class="cw-admin-stat-card">
        <div class="cw-admin-stat-card__icon"><i class="bi bi-shield-lock-fill"></i></div>
        <div>
          <div class="cw-admin-stat-card__label">Admin</div>
          <div class="cw-admin-stat-card__value">${admins}</div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-4">
      <div class="cw-admin-stat-card">
        <div class="cw-admin-stat-card__icon"><i class="bi bi-person-check-fill"></i></div>
        <div>
          <div class="cw-admin-stat-card__label">Người dùng</div>
          <div class="cw-admin-stat-card__value">${normalUsers}</div>
        </div>
      </div>
    </div>
  `;
}

function renderAccountTable(keyword = '') {
  const q = keyword.toLowerCase();
  const users = accountUsers.filter(user => {
    const text = `${user.displayName || ''} ${user.username || ''} ${user.email || ''} ${user.role || ''}`.toLowerCase();
    return text.includes(q);
  });

  document.getElementById('account-list').innerHTML = `
    <table class="table cw-admin-table align-middle mb-0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Họ tên</th>
          <th>Tên đăng nhập</th>
          <th>Email</th>
          <th>Vai trò</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>

      <tbody>
        ${users.map(user => {
          const roleLabel = user.role === 'admin' ? 'Admin' : 'Người dùng';
          const isLocked = user.status === 'locked';
          const statusLabel = isLocked ? 'Tạm khóa' : 'Đang hoạt động';
          const username = user.username || (user.email ? user.email.split('@')[0] : '');

          return `
            <tr>
              <td>${user.id}</td>
              <td>${user.displayName || ''}</td>
              <td>${username}</td>
              <td>${user.email || ''}</td>
              <td>
                <span class="cw-admin-badge ${user.role === 'admin' ? 'cw-admin-badge--admin' : ''}">${roleLabel}</span>
              </td>
              <td>
                <span class="cw-admin-badge ${isLocked ? 'cw-admin-badge--locked' : 'cw-admin-badge--active'}">${statusLabel}</span>
              </td>
              <td>
                <button class="cw-admin-action-btn" title="Cập nhật" onclick="startEditAccount(${user.id})">
                  <i class="bi bi-pencil"></i>
                </button>

                <button class="cw-admin-action-btn cw-admin-action-btn--delete" title="Xóa" onclick="handleDeleteAccount(${user.id})">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('') || `
          <tr>
            <td colspan="7" class="text-center text-secondary py-4">Không có tài khoản nào.</td>
          </tr>
        `}
      </tbody>
    </table>
  `;
}

async function handleSaveAccount(e) {
  e.preventDefault();

  const displayName = document.getElementById('fullname').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;
  const status = document.getElementById('status').value;

  if (!displayName || !email) {
    alert('Vui lòng nhập họ tên và email!');
    return;
  }

  if (!editingAccountId && !password) {
    alert('Vui lòng nhập mật khẩu cho tài khoản mới!');
    return;
  }

  try {
    if (editingAccountId) {
      await updateUser(editingAccountId, {
        displayName,
        username,
        email,
        role,
        status,
        updatedAt: new Date().toISOString(),
      });

      alert('Cập nhật tài khoản thành công!');
    } else {
      await createUser({
        displayName,
        username,
        email,
        password,
        role,
        status,
        avatar: '',
        createdAt: new Date().toISOString(),
      });

      alert('Thêm tài khoản thành công!');
    }

    resetAccountForm();
    await loadAccounts();
  } catch (err) {
    console.error(err);
    alert('Lưu tài khoản thất bại. Email có thể đã tồn tại hoặc backend chưa chạy.');
  }
}

function startEditAccount(id) {
  const user = accountUsers.find(u => Number(u.id) === Number(id));
  if (!user) return;

  editingAccountId = user.id;

  document.getElementById('account-form-title').innerHTML = '<i class="bi bi-pencil-square"></i> Chỉnh sửa tài khoản';
  document.getElementById('account-id').value = user.id;
  document.getElementById('fullname').value = user.displayName || '';
  document.getElementById('username').value = user.username || (user.email ? user.email.split('@')[0] : '');
  document.getElementById('email').value = user.email || '';
  document.getElementById('password').value = '';
  document.getElementById('password').placeholder = 'Không đổi mật khẩu ở chế độ sửa';
  document.getElementById('password').disabled = true;
  document.getElementById('role').value = user.role || 'user';
  document.getElementById('status').value = user.status || 'active';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetAccountForm() {
  editingAccountId = null;
  document.getElementById('account-form-title').innerHTML = '<i class="bi bi-person-plus-fill"></i> Thêm mới tài khoản';
  document.getElementById('account-form').reset();
  document.getElementById('account-id').value = '';
  document.getElementById('password').disabled = false;
  document.getElementById('password').placeholder = 'Nhập mật khẩu khi thêm mới';
}

async function handleDeleteAccount(id) {
  const currentUser = Auth.getCurrentUser();

  if (currentUser && Number(currentUser.id) === Number(id)) {
    alert('Bạn không nên xoá chính tài khoản đang đăng nhập.');
    return;
  }

  if (!confirm('Bạn có chắc muốn xoá tài khoản này không?')) return;

  try {
    await deleteUser(id);
    alert('Xoá tài khoản thành công!');
    await loadAccounts();
  } catch (err) {
    console.error(err);
    alert('Xoá tài khoản thất bại!');
  }
}
