document.addEventListener('DOMContentLoaded', async () => {
 
  if (typeof initComponents === 'function') {
    initComponents();
  }
 
  const params = new URLSearchParams(window.location.search);
  const comicId = params.get('id');
 
  if (!comicId) {
    alert('Không tìm thấy ID truyện');
    window.location.href = 'dashboard.html';
    return;
  }
 
  try {
    const currentComic = await getComicById(comicId);
 
    if (!currentComic || !currentComic.id) {
      alert('Không tìm thấy truyện');
      window.location.href = 'dashboard.html';
      return;
    }
 
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
 
    const coverPreview = document.getElementById('comic-cover-preview');
 
    if (coverPreview && currentComic.coverImage) {
      coverPreview.src = '../../' + currentComic.coverImage;
    }
 
  } catch (err) {
    console.error(err);
    alert('Lỗi tải dữ liệu truyện');
  }
 
});