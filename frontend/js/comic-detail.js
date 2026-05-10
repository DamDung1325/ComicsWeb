/**
 * ComicsWeb — Chi tiết truyện
 */
document.addEventListener('DOMContentLoaded', () => {
  initComponents('');
  loadComicDetail();
});

async function loadComicDetail() {
  const comicId = getQueryParam('id');
  if (!comicId) {
    document.getElementById('comic-detail-content').innerHTML =
      '<p class="text-center text-secondary py-5">Không tìm thấy truyện.</p>';
    return;
  }

  try {
    const [comic, chapters] = await Promise.all([
      getComicById(comicId),
      getChaptersByComic(comicId),
    ]);

    if (!comic) throw new Error('Không tìm thấy');

    renderDetail(comic, chapters);
  } catch (err) {
    document.getElementById('comic-detail-content').innerHTML =
      '<p class="text-center text-danger py-5">Lỗi tải dữ liệu truyện.</p>';
  }
}

function renderDetail(comic, chapters) {
  const container = document.getElementById('comic-detail-content');
  const genreTags = (comic.genres || []).map(g =>
    `<span class="cw-genre-tag">${g}</span>`
  ).join(' ');

  const chapterList = chapters.map(ch => `
    <a href="reader.html?id=${ch.id}" class="list-group-item list-group-item-action"
       style="background:var(--bg-surface);color:var(--text-primary);border-color:var(--border-color);">
      <div class="d-flex justify-content-between align-items-center">
        <span><i class="bi bi-book"></i> Chương ${ch.chapterNumber}: ${ch.title}</span>
        <small class="text-muted">${timeAgo(ch.createdAt)}</small>
      </div>
    </a>
  `).join('');

  container.innerHTML = `
    <div class="row g-4 anim-fade-in">
      <div class="col-md-4 col-lg-3">
        <img src="../${comic.coverImage}" alt="${comic.title}" class="w-100 rounded-3"
             style="border:2px solid var(--border-color);"
             onerror="this.src='../assets/images/placeholder.svg'">
      </div>
      <div class="col-md-8 col-lg-9">
        <h1 style="font-family:var(--font-heading);font-weight:900;text-transform:uppercase;">
          ${comic.title}
        </h1>
        <div class="d-flex flex-wrap gap-2 mb-3">
          ${genreTags}
          <span class="cw-genre-tag" style="background:rgba(46,204,113,0.15);color:#2ECC71;">
            ${comic.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}
          </span>
        </div>
        <div class="cw-rating mb-3">${renderStars(comic.rating)}</div>
        <p class="text-secondary mb-2"><i class="bi bi-person"></i> <strong>Tác giả:</strong> ${comic.author}</p>
        <p class="text-secondary mb-2"><i class="bi bi-brush"></i> <strong>Hoạ sĩ:</strong> ${comic.artist}</p>
        <p class="text-secondary mb-2"><i class="bi bi-eye"></i> <strong>Lượt xem:</strong> ${formatViews(comic.views)}</p>
        <p class="text-secondary mt-3">${comic.description}</p>
        ${chapters.length > 0 ? `
          <a href="reader.html?id=${chapters[0].id}" class="btn btn-cw-primary mt-2">
            <i class="bi bi-book-half"></i> Đọc ngay
          </a>
        ` : ''}
      </div>
    </div>
    <div class="mt-5">
      <h3 style="font-family:var(--font-heading);border-left:4px solid var(--color-primary);padding-left:1rem;">
        Danh sách chương (${chapters.length})
      </h3>
      <div class="list-group mt-3">${chapterList || '<p class="text-muted">Chưa có chương nào.</p>'}</div>
    </div>
  `;
}
