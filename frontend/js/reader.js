/**
 * ComicsWeb — Trang đọc truyện (Reader)
 */
document.addEventListener('DOMContentLoaded', () => {
  initComponents('');
  loadReader();
});

async function loadReader() {
  const chapterId = getQueryParam('id');
  if (!chapterId) return;

  try {
    const chapter = await getChapterById(chapterId);
    if (!chapter) throw new Error('Không tìm thấy chương');

    const comic = await getComicById(chapter.comicId);
    const allChapters = await getChaptersByComic(chapter.comicId);

    renderReader(comic, chapter, allChapters);
  } catch (err) {
    document.getElementById('reader-content').innerHTML =
      '<p class="text-center text-danger py-5">Lỗi tải chương truyện.</p>';
  }
}

function renderReader(comic, chapter, allChapters) {
  const container = document.getElementById('reader-content');
  const currentIdx = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  const pagesHTML = (chapter.pages || []).map((src, i) => `
    <img src="../${src}" alt="Trang ${i + 1}" class="cw-reader__page"
         onerror="this.src='../assets/images/placeholder.svg'">
  `).join('');

  container.innerHTML = `
    <div class="text-center py-3">
      <a href="comic-detail.html?id=${comic.id}" class="text-decoration-none">
        <h5 style="color:var(--color-primary);font-family:var(--font-heading);">${comic.title}</h5>
      </a>
      <h6 class="text-secondary">Chương ${chapter.chapterNumber}: ${chapter.title}</h6>
    </div>
    <div class="cw-reader">${pagesHTML}</div>
    <div class="cw-reader__nav container" style="max-width:800px;">
      ${prevChapter
        ? `<a href="reader.html?id=${prevChapter.id}" class="btn btn-cw-outline btn-sm">
            <i class="bi bi-chevron-left"></i> Chương trước
           </a>`
        : '<span></span>'}
      <a href="comic-detail.html?id=${comic.id}" class="btn btn-sm" style="color:var(--text-secondary);">
        <i class="bi bi-list-ul"></i> Mục lục
      </a>
      ${nextChapter
        ? `<a href="reader.html?id=${nextChapter.id}" class="btn btn-cw-primary btn-sm">
            Chương sau <i class="bi bi-chevron-right"></i>
           </a>`
        : '<span></span>'}
    </div>
  `;
}
