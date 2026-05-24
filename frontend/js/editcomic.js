/**
 * ComicsWeb — Edit Comic
 */

document.addEventListener('DOMContentLoaded', async () => {

  initComponents();

  // Kiểm tra admin
  if (!Auth.isAdmin()) {
    alert('Bạn không có quyền truy cập');
    window.location.href = '../../index.html';
    return;
  }

  // Lấy ID từ URL
  const params = new URLSearchParams(window.location.search);
  const comicId = params.get('id');

  // Không có ID
  if (!comicId) {
    alert('Không tìm thấy ID truyện');
    window.location.href = 'dashboard.html';
    return;
  }

  let currentComic = null;

  // Load dữ liệu truyện
  try {

    currentComic = await getComicById(comicId);

    console.log('Comic:', currentComic);

    // Không tìm thấy truyện
    if (!currentComic || !currentComic.id) {
      alert('Không tìm thấy truyện');
      window.location.href = 'dashboard.html';
      return;
    }

    // Fill dữ liệu vào form
    document.getElementById('comic-id').value =
      currentComic.id || '';

    document.getElementById('comic-title').value =
      currentComic.title || '';

    document.getElementById('comic-author').value =
      currentComic.author || '';

    document.getElementById('comic-artist').value =
      currentComic.artist || '';

    document.getElementById('comic-description').value =
      currentComic.description || '';

    document.getElementById('comic-genres').value =
      Array.isArray(currentComic.genres)
        ? currentComic.genres.join(', ')
        : '';

  } catch (err) {

    console.error(err);
    alert('Lỗi tải dữ liệu truyện');

    return;
  }

  // Submit form
  const form = document.getElementById('edit-comic-form');

  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    try {

      const newId =
        document.getElementById('comic-id').value.trim();

      const updatedComic = {

        id: Number(newId),

        title:
          document.getElementById('comic-title').value.trim(),

        slug:
          document.getElementById('comic-title')
            .value
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-'),

        description:
          document.getElementById('comic-description')
            .value
            .trim(),

        coverImage:
          currentComic.coverImage ||
          'assets/images/placeholder.svg',

        author:
          document.getElementById('comic-author')
            .value
            .trim(),

        artist:
          document.getElementById('comic-artist')
            .value
            .trim(),

        genres:
          document.getElementById('comic-genres')
            .value
            .split(',')
            .map(g => g.trim())
            .filter(g => g !== ''),

        status:
          currentComic.status || 'ongoing',

        rating:
          currentComic.rating || 5,

        views:
          currentComic.views || 0,

        totalChapters:
          currentComic.totalChapters || 0,

        createdAt:
          currentComic.createdAt ||
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()

      };

      // Nếu đổi ID
      if (String(currentComic.id) !== String(newId)) {

        // Xóa truyện cũ
        await deleteComic(currentComic.id);

        // Tạo truyện mới
        await createComic(updatedComic);

      } else {

        // Update bình thường
        await updateComic(currentComic.id, updatedComic);

      }

      alert('Cập nhật truyện thành công');

      window.location.href = 'dashboard.html';

    } catch (err) {

      console.error(err);

      alert('Lỗi cập nhật truyện');

    }

  });

});