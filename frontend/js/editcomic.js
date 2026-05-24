/**
 * Trang sửa truyện
 * Hiển thị dữ liệu cũ và lưu thay đổi vào backend/db.json.
 */
let currentComic = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initComponents === 'function') {
    initComponents();
  }

  const form = document.getElementById('edit-comic-form');
  const submitBtn = document.getElementById('btn-save-comic');
  const params = new URLSearchParams(window.location.search);
  const comicId = params.get('id');

  if (!comicId) {
    alert('Không tìm thấy ID truyện');
    window.location.href = 'dashboard.html';
    return;
  }

  try {
    currentComic = await getComicById(comicId);

    if (!currentComic || !currentComic.id) {
      alert('Không tìm thấy truyện');
      window.location.href = 'dashboard.html';
      return;
    }

    fillComicForm(currentComic);
  } catch (err) {
    console.error(err);
    alert('Lỗi tải dữ liệu truyện');
    return;
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('comic-title').value.trim();
    const author = document.getElementById('comic-author').value.trim();
    const artist = document.getElementById('comic-artist').value.trim();
    const description = document.getElementById('comic-description').value.trim();
    const genresText = document.getElementById('comic-genres').value.trim();
    const coverFile = document.getElementById('comic-cover').files[0];
    const chapterFiles = Array.from(document.getElementById('comic-chapters').files || []);

    if (!title) {
      alert('Vui lòng nhập tên truyện!');
      return;
    }

    const now = new Date().toISOString();
    const newChapterCount = chapterFiles.length > 0 ? 1 : 0;

    const updatedComic = {
      ...currentComic,
      title,
      slug: slugify(title),
      description,
      coverImage: coverFile
        ? `assets/images/cover_images/${coverFile.name}`
        : currentComic.coverImage,
      author,
      artist,
      genres: genresText
        ? genresText.split(',').map(g => slugify(g.trim())).filter(Boolean)
        : [],
      totalChapters: (currentComic.totalChapters || 0) + newChapterCount,
      updatedAt: now,
    };

    try {
      if (submitBtn) submitBtn.disabled = true;

      await updateComic(currentComic.id, updatedComic);

      // Nếu chọn thêm ảnh chap, tạo thêm chapter mới trong db.json.
      if (chapterFiles.length > 0) {
        const chapters = await getChaptersByComic(currentComic.id);
        const maxChapterNumber = chapters.length
          ? Math.max(...chapters.map(ch => Number(ch.chapterNumber) || 0))
          : 0;

        await createChapter({
          comicId: currentComic.id,
          chapterNumber: maxChapterNumber + 1,
          title: `Chapter ${maxChapterNumber + 1}`,
          pages: chapterFiles.map(file => `assets/images/chapters/${currentComic.id}/${file.name}`),
          createdAt: now,
        });
      }

      alert('Lưu thay đổi thành công! Dữ liệu đã được cập nhật trong backend/db.json');
      window.location.href = './dashboard.html';
    } catch (err) {
      console.error(err);
      alert('Lưu thay đổi thất bại!');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

function fillComicForm(comic) {
  document.getElementById('comic-id').value = comic.id || '';
  document.getElementById('comic-title').value = comic.title || '';
  document.getElementById('comic-author').value = comic.author || '';
  document.getElementById('comic-artist').value = comic.artist || '';
  document.getElementById('comic-description').value = comic.description || '';
  document.getElementById('comic-genres').value = Array.isArray(comic.genres)
    ? comic.genres.join(', ')
    : '';

  const coverPreview = document.getElementById('comic-cover-preview');
  if (coverPreview && comic.coverImage) {
    coverPreview.src = '../../' + comic.coverImage;
  }
}
