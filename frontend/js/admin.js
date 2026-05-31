/**
 * ComicsWeb — Admin Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {

  initComponents('admin');

  // Kiểm tra quyền admin
  if (!Auth.isAdmin()) {

    document.getElementById('admin-content').innerHTML = `
      <div class="text-center py-5">
        <h3 class="text-danger">
          <i class="bi bi-shield-x"></i> Truy cập bị từ chối
        </h3>

        <p class="text-secondary">
          Bạn cần đăng nhập với tài khoản quản trị viên.
        </p>

        <a href="../login.html" class="btn btn-cw-primary mt-2">
          Đăng nhập
        </a>
      </div>
    `;

    return;
  }

  loadAdminStats();
  loadAdminComicList();
  loadPendingComicList();

});


/* ===============================
   LOAD STATS
================================ */

async function loadAdminStats() {

  const container = document.getElementById('admin-stats');

  if (!container) return;

  try {

    const comics = await getComics({ limit: 999 });

    const totalComics = comics.length;

    const ongoing = comics.filter(
      c => c.status === 'ongoing' && c.approved !== false
    ).length;

    const pending = comics.filter(
      c => c.approved === false
    ).length;

    const totalViews = comics.reduce(
      (sum, c) => sum + (c.views || 0),
      0
    );

    container.innerHTML = `
      <div class="col-md-3 mb-3">
        <div class="p-3 rounded-3"
          style="
            background:var(--bg-surface);
            border:1px solid var(--border-color);
          "
        >
          <h5 class="text-secondary mb-1">
            Tổng truyện
          </h5>

          <h2 style="
            color:var(--color-primary);
            font-family:var(--font-heading);
          ">
            ${totalComics}
          </h2>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="p-3 rounded-3"
          style="
            background:var(--bg-surface);
            border:1px solid var(--border-color);
          "
        >
          <h5 class="text-secondary mb-1">
            Đang ra
          </h5>

          <h2 style="
            color:var(--color-accent);
            font-family:var(--font-heading);
          ">
            ${ongoing}
          </h2>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="p-3 rounded-3"
          style="
            background:var(--bg-surface);
            border:1px solid var(--border-color);
          "
        >
          <h5 class="text-secondary mb-1">
            Chờ duyệt
          </h5>

          <h2 style="
            color:#ffc107; /* text-warning */
            font-family:var(--font-heading);
          ">
            ${pending}
          </h2>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="p-3 rounded-3"
          style="
            background:var(--bg-surface);
            border:1px solid var(--border-color);
          "
        >
          <h5 class="text-secondary mb-1">
            Tổng lượt xem
          </h5>

          <h2 style="
            color:var(--color-success);
            font-family:var(--font-heading);
          ">
            ${formatViews(totalViews)}
          </h2>
        </div>
      </div>
    `;

  } catch (err) {

    console.error(err);

  }

}


/* ===============================
   LOAD COMIC LIST
================================ */

async function loadAdminComicList() {

  const container = document.getElementById('admin-comic-list');

  if (!container) return;

  try {

    const comics = await getComics({ limit: 999 });

    container.innerHTML = `
      <table class="table table-dark table-hover">

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

        <tbody>

          ${comics.map(c => `

            <tr>

              <td>${c.id}</td>

              <td>${c.title}</td>

              <td>${c.author}</td>

              <td>
                ${c.approved === false 
                  ? '<span class="badge bg-warning text-dark px-2 py-1">Chờ duyệt</span>'
                  : `<span class="cw-genre-tag">${c.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}</span>`
                }
              </td>

              <td>${formatViews(c.views || 0)}</td>

              <td>

                <!-- EDIT -->
               <button
                 class="btn btn-sm btn-cw-outline"
                 onclick="window.location.href='editcomic.html?id=${c.id}'"
                 title="Sửa">
                  <i class="bi bi-pencil"></i>
                </button>

                <!-- PREVIEW -->
                <button
                  class="btn btn-sm btn-outline-info ms-1"
                  onclick="window.open('../comic-detail.html?id=${c.id}', '_blank')"
                  title="Xem trước"
                >
                  <i class="bi bi-eye"></i>
                </button>

                <!-- APPROVE -->
                ${c.approved === false ? `
                <button
                  class="btn btn-sm btn-outline-success ms-1"
                  onclick="handleApproveComic(${c.id})"
                  title="Duyệt truyện"
                >
                  <i class="bi bi-check-circle"></i>
                </button>
                ` : ''}

                <!-- DELETE -->
                <button
                  class="btn btn-sm btn-outline-danger ms-1"
                  onclick="handleDeleteComic(${c.id})"
                  title="Xoá truyện"
                >
                  <i class="bi bi-trash"></i>
                </button>

              </td>

            </tr>

          `).join('')}

        </tbody>

      </table>
    `;

  } catch (err) {

    console.error(err);

    container.innerHTML = `
      <p class="text-danger">
        Lỗi tải danh sách truyện.
      </p>
    `;

  }

}


/* ===============================
   DELETE COMIC
================================ */

async function handleDeleteComic(id) {

  const confirmDelete = confirm(
    'Bạn có chắc muốn xoá truyện này không?'
  );

  if (!confirmDelete) return;

  try {

    // Xóa toàn bộ chapter thuộc truyện trước
    const chapters = await getChaptersByComic(id);

    for (const chapter of chapters) {
      await deleteChapter(chapter.id);
    }

    // Xóa comic
    await deleteComic(id);

    // Reload lại bảng
    await loadAdminComicList();
    await loadPendingComicList();

    // Reload stats
    await loadAdminStats();

    alert('Xóa truyện thành công!');

  } catch (err) {

    console.error(err);

    alert('Xóa truyện thất bại!');

  }

}

/* ===============================
   APPROVE COMIC
================================ */

async function handleApproveComic(id) {
  const confirmApprove = confirm('Bạn có muốn duyệt cho phép hiển thị truyện này không?');
  if (!confirmApprove) return;

  try {
    await patchComic(id, { approved: true });
    
    // Reload lại bảng và stats
    await loadAdminComicList();
    await loadPendingComicList();
    await loadAdminStats();
    
    alert('Duyệt truyện thành công!');
  } catch (err) {
    console.error(err);
    alert('Duyệt truyện thất bại!');
  }
}

/* ===============================
   PENDING COMICS LIST
================================ */

async function loadPendingComicList() {
  const container = document.getElementById('admin-pending-comic-list');
  if (!container) return;

  try {
    const comics = await getComics({ limit: 999 });
    const pending = comics.filter(c => c.approved === false);

    if (pending.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-secondary">
          <i class="bi bi-check-circle" style="font-size:2rem;"></i>
          <p class="mt-2">Không có truyện nào đang chờ duyệt.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="table table-dark table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ảnh bìa</th>
            <th>Tên truyện</th>
            <th>Tác giả</th>
            <th>Người đăng</th>
            <th>Thời gian</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${await Promise.all(pending.map(async c => {
            // Lấy thông tin uploader
            let uploaderName = 'Không rõ';
            if (c.uploaderId) {
              try {
                const uploader = await fetchAPI(`/users/${c.uploaderId}`);
                uploaderName = uploader?.displayName || uploader?.email || c.uploaderId;
              } catch(e) { /* silent */ }
            }
            return `
              <tr>
                <td>${c.id}</td>
                <td>
                  <img src="../../${c.coverImage}" style="width:40px;height:55px;object-fit:cover;border-radius:4px;" onerror="this.src='../../assets/images/placeholder.svg'">
                </td>
                <td><strong>${c.title}</strong><br><small class="text-secondary">${(c.genres||[]).join(', ')}</small></td>
                <td>${c.author}</td>
                <td>${uploaderName}</td>
                <td><small class="text-muted">${formatDate(c.createdAt)}</small></td>
                <td>
                  <button class="btn btn-sm btn-outline-info me-1"
                    onclick="window.open('../comic-detail.html?id=${c.id}', '_blank')"
                    title="Xem trước">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-success me-1"
                    onclick="handleApproveComic(${c.id})"
                    title="Duyệt">
                    <i class="bi bi-check-circle"></i> Duyệt
                  </button>
                  <button class="btn btn-sm btn-outline-danger"
                    onclick="handleDeleteComic(${c.id})"
                    title="Từ chối & Xoá">
                    <i class="bi bi-x-circle"></i> Từ chối
                  </button>
                </td>
              </tr>
            `;
          })).then(rows => rows.join(''))}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-danger p-3">Lỗi tải danh sách chờ duyệt.</p>`;
  }
}