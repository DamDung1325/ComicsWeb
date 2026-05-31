/**
 * Trang thêm truyện
 * Lưu dữ liệu truyện mới vào backend/db.json thông qua json-server.
 * Lưu ý: trình duyệt không thể tự copy file ảnh vào thư mục assets.
 * Code bên dưới sẽ lưu đường dẫn dự kiến dựa theo tên file đã chọn.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-comic-form');
  const submitBtn = document.getElementById('btn-add-comic');

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

    const comic = {
      // Không truyền id: json-server sẽ tự tăng id và lưu vào db.json
      title,
      slug: slugify(title),
      description,
      coverImage: coverFile
        ? `assets/images/cover_images/${coverFile.name}`
        : 'assets/images/placeholder.svg',
      author,
      artist,
      genres: genresText
        ? genresText.split(',').map(g => slugify(g.trim())).filter(Boolean)
        : [],
      status: 'ongoing',
      rating: 5,
      views: 0,
      totalChapters: chapterFiles.length > 0 ? 1 : 0,
      approved: true,        // Admin thêm thì tự động duyệt
      uploaderId: null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (submitBtn) submitBtn.disabled = true;

      const newComic = await createComic(comic);

      // Nếu có chọn ảnh chap, tạo sẵn 1 chapter trong db.json.
      // Các đường dẫn này sẽ hoạt động khi bạn copy ảnh thật vào đúng thư mục assets/images/chapters/<comicId>/
      if (chapterFiles.length > 0 && newComic && newComic.id) {
        await createChapter({
          comicId: newComic.id,
          chapterNumber: 1,
          title: 'Chapter 1',
          pages: chapterFiles.map(file => `assets/images/chapters/${newComic.id}/${file.name}`),
          createdAt: now,
        });
      }

      alert('Thêm truyện thành công! Dữ liệu đã được lưu vào backend/db.json');
      window.location.href = './dashboard.html';
    } catch (err) {
      console.error(err);
      alert('Không thể thêm truyện. Hãy kiểm tra backend đã chạy chưa và tài khoản admin đã đăng nhập chưa.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
