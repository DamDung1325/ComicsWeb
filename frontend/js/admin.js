/**
 * ComicsWeb — Admin Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
  initComponents('admin');

  // Kiểm tra quyền admin
  if (!Auth.isAdmin()) {
    document.getElementById('admin-content').innerHTML = `
      <div class="text-center py-5">
        <h3 class="text-danger"><i class="bi bi-shield-x"></i> Truy cập bị từ chối</h3>
        <p class="text-secondary">Bạn cần đăng nhập với tài khoản quản trị viên.</p>
        <a href="../login.html" class="btn btn-cw-primary mt-2">Đăng nhập</a>
      </div>
    `;
    return;
  }

  loadAdminStats();
  loadAdminComicList();
});

async function loadAdminStats() {
  const container = document.getElementById('admin-stats');
  if (!container) return;

  try {
    const comics = await getComics({ limit: 999 });
    const totalComics = comics.length;
    const ongoing = comics.filter(c => c.status === 'ongoing').length;
    const totalViews = comics.reduce((sum, c) => sum + (c.views || 0), 0);

    container.innerHTML = `
      <div class="col-md-4 mb-3">
        <div class="p-3 rounded-3" style="background:var(--bg-surface);border:1px solid var(--border-color);">
          <h5 class="text-secondary mb-1">Tổng truyện</h5>
          <h2 style="color:var(--color-primary);font-family:var(--font-heading);">${totalComics}</h2>
        </div>
      </div>
      <div class="col-md-4 mb-3">
        <div class="p-3 rounded-3" style="background:var(--bg-surface);border:1px solid var(--border-color);">
          <h5 class="text-secondary mb-1">Đang ra</h5>
          <h2 style="color:var(--color-accent);font-family:var(--font-heading);">${ongoing}</h2>
        </div>
      </div>
      <div class="col-md-4 mb-3">
        <div class="p-3 rounded-3" style="background:var(--bg-surface);border:1px solid var(--border-color);">
          <h5 class="text-secondary mb-1">Tổng lượt xem</h5>
          <h2 style="color:var(--color-success);font-family:var(--font-heading);">${formatViews(totalViews)}</h2>
        </div>
      </div>
    `;
  } catch (err) { /* silent */ }
}

async function loadAdminComicList() {
  const container = document.getElementById('admin-comic-list');
  if (!container) return;

  try {
    const comics = await getComics({ limit: 999 });
    container.innerHTML = `
      <table class="table table-dark table-hover">
        <thead>
          <tr>
            <th>ID</th><th>Tên truyện</th><th>Tác giả</th>
            <th>Trạng thái</th><th>Lượt xem</th><th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${comics.map(c => `
            <tr>
              <td>${c.id}</td>
              <td>${c.title}</td>
              <td>${c.author}</td>
              <td><span class="cw-genre-tag">${c.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}</span></td>
              <td>${formatViews(c.views)}</td>
              <td>
                <button class="btn btn-sm btn-cw-outline" onclick="alert('TODO: Sửa truyện #${c.id}')">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="alert('TODO: Xoá truyện #${c.id}')">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="text-danger">Lỗi tải danh sách.</p>';
  }
}
