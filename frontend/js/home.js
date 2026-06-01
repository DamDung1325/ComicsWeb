/**
 * TLUTRUYEN — Logic Trang chủ
 * Xử lý việc tải các bộ truyện nổi bật và cập nhật mới nhất trên trang đích.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các thành phần dùng chung
  initComponents('home');
  
  // Tải nội dung trang
  loadFeaturedComics();
  loadLatestUpdates();
});

/* ─── Trình tải nội dung trang ───────────────────────────────────────── */

/**
 * Tải và hiển thị các bộ truyện nổi bật (xem nhiều nhất).
 */
async function loadFeaturedComics() {
  const container = document.getElementById('featured-comics');
  if (!container) return;

  try {
    const comics = await getComics({ 
      sort: 'views', 
      order: 'desc', 
      limit: 6, 
      filters: { approved: true } 
    });
    
    container.innerHTML = comics.length > 0
      ? comics.map((comic, index) => renderComicCard(comic, index)).join('')
      : '<p class="text-secondary">Chưa có truyện nổi bật nào.</p>';
      
  } catch (error) {
    console.error('[HOME] Không thể tải truyện nổi bật:', error);
    container.innerHTML = '<p class="text-secondary">Không thể tải danh sách truyện nổi bật.</p>';
  }
}

/**
 * Tải và hiển thị các bộ truyện mới cập nhật nhất.
 */
async function loadLatestUpdates() {
  const container = document.getElementById('latest-comics');
  if (!container) return;

  try {
    const comics = await getComics({ 
      sort: 'updatedAt', 
      order: 'desc', 
      limit: 12, 
      filters: { approved: true } 
    });
    
    container.innerHTML = comics.length > 0
      ? comics.map((comic, index) => renderComicCard(comic, index)).join('')
      : '<p class="text-secondary">Chưa có truyện mới cập nhật.</p>';
      
  } catch (error) {
    console.error('[HOME] Không thể tải truyện mới cập nhật:', error);
    container.innerHTML = '<p class="text-secondary">Không thể tải danh sách truyện mới.</p>';
  }
}
