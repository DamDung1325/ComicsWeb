/**
 * TLUTRUYEN — Logic Trang tìm kiếm
 * Xử lý việc lọc truyện theo thể loại và tìm kiếm trực tiếp.
 */

// Trạng thái toàn cục để lọc cục bộ
let allComicsCache = [];

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các thành phần dùng chung
  initComponents('search');
  
  // Tải dữ liệu trang
  loadGenreFilters();
  loadInitialComics();
  
  // Thiết lập các thành phần tương tác
  setupSearchInput();
});

/* ─── Tải dữ liệu ───────────────────────────────────────────────── */

/**
 * Lấy và hiển thị các nút lọc thể loại.
 */
async function loadGenreFilters() {
  const container = document.getElementById('genre-filters');
  if (!container) return;

  try {
    const genres = await getGenres();
    
    container.innerHTML = `
      <button class="btn btn-sm cw-genre-tag active" data-genre="all" style="cursor:pointer;">Tất cả</button>
      ${genres.map(genre => `
        <button class="btn btn-sm cw-genre-tag" data-genre="${genre.slug}" style="cursor:pointer;">${genre.name}</button>
      `).join('')}
    `;
    
    _attachGenreClickHandlers(container);
    
  } catch (error) {
    console.error('[SEARCH] Không thể tải thể loại:', error);
  }
}

/**
 * Tải danh sách truyện ban đầu để tìm kiếm.
 */
async function loadInitialComics() {
  const container = document.getElementById('search-results');
  if (!container) return;

  try {
    const comics = await getComics({ 
      limit: CONFIG.MAX_SEARCH_RESULTS, 
      filters: { approved: true } 
    });
    
    allComicsCache = comics;
    _renderResults(comics);
    
  } catch (error) {
    console.error('[SEARCH] Không thể tải truyện:', error);
    container.innerHTML = '<p class="text-secondary">Không thể tải dữ liệu truyện.</p>';
  }
}

/* ─── Trình xử lý sự kiện ─────────────────────────────────────────────── */

/**
 * Thiết lập tìm kiếm trực tiếp với chống rung (debounce).
 */
function setupSearchInput() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', debounce((event) => {
    const query = event.target.value.toLowerCase().trim();
    _performLocalSearch(query);
  }, CONFIG.DEBOUNCE_DELAY));
}

/**
 * Lọc danh sách truyện đã lưu trong cache theo thể loại.
 * @param {string} genreSlug - Slug của thể loại cần lọc.
 */
function filterByGenre(genreSlug) {
  const filtered = genreSlug === 'all'
    ? allComicsCache
    : allComicsCache.filter(comic => (comic.genres || []).includes(genreSlug));

  _renderResults(filtered, 'Không có truyện nào thuộc thể loại này.');
}

/* ─── Trợ giúp Riêng tư ───────────────────────────────────────────── */

/** @private */
function _attachGenreClickHandlers(container) {
  container.querySelectorAll('[data-genre]').forEach(button => {
    button.addEventListener('click', () => {
      container.querySelectorAll('[data-genre]').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      filterByGenre(button.dataset.genre);
    });
  });
}

/** @private */
function _performLocalSearch(query) {
  const filtered = allComicsCache.filter(comic =>
    comic.title.toLowerCase().includes(query) || 
    comic.author.toLowerCase().includes(query)
  );
  
  _renderResults(filtered, 'Không tìm thấy kết quả phù hợp.');
}

/** @private */
function _renderResults(comics, emptyMessage = 'Không tìm thấy kết quả.') {
  const container = document.getElementById('search-results');
  if (!container) return;

  container.innerHTML = comics.length > 0
    ? comics.map((comic, index) => renderComicCard(comic, index)).join('')
    : `<p class="text-secondary text-center py-4">${emptyMessage}</p>`;
}
