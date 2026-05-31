/**
 * ComicsWeb — API Module
 * Fetch wrapper + CRUD helpers cho json-server
 */

/**
 * Gọi API chung — tự gắn JWT token nếu có
 * @param {string} endpoint - Đường dẫn API (vd: '/comics')
 * @param {object} options  - fetch options (method, body, ...)
 * @returns {Promise<any>}
 */
async function fetchAPI(endpoint, options = {}) {
  const url = CONFIG.API_BASE_URL + endpoint;
  const token = localStorage.getItem(CONFIG.JWT_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      Auth.logout();
      const base = typeof getBasePath === 'function' ? getBasePath() : '/';
      window.location.href = base + 'pages/login.html';
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Lỗi ${response.status}`);
    }

    // DELETE thường trả về 200 với body rỗng
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.error(`[API] ${options.method || 'GET'} ${endpoint}:`, err);
    showToast(err.message || 'Đã xảy ra lỗi kết nối', 'error');
    throw err;
  }
}

/* ─── Comics ────────────────────────────────────────────── */

/** Lấy danh sách truyện (có phân trang, sắp xếp) */
async function getComics(params = {}) {
  const query = new URLSearchParams({
    _page: params.page || 1,
    _limit: params.limit || CONFIG.ITEMS_PER_PAGE,
    _sort: params.sort || 'updatedAt',
    _order: params.order || 'desc',
    ...params.filters,
  }).toString();
  return fetchAPI(`/comics?${query}`);
}

/** Lấy chi tiết 1 truyện theo ID */
async function getComicById(id) {
  return fetchAPI(`/comics/${id}`);
}

/** Tìm kiếm truyện theo tên */
async function searchComics(query) {
  return fetchAPI(`/comics?q=${encodeURIComponent(query)}`);
}

/** Thêm truyện mới (admin) */
async function createComic(data) {
  return fetchAPI('/comics', { method: 'POST', body: JSON.stringify(data) });
}

/** Thêm truyện mới bởi user */
async function createComicByUser(data) {
  const user = Auth.getCurrentUser();
  if (!user) throw new Error('Vui lòng đăng nhập');
  
  const payload = {
    ...data,
    uploaderId: user.id,
    approved: false, // Chờ admin duyệt
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return fetchAPI('/comics', { method: 'POST', body: JSON.stringify(payload) });
}

/** Cập nhật truyện (admin) */
async function updateComic(id, data) {
  return fetchAPI(`/comics/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

/** Cập nhật 1 phần thông tin truyện (admin) */
async function patchComic(id, data) {
  return fetchAPI(`/comics/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

/** Xoá truyện (admin) */
async function deleteComic(id) {
  return fetchAPI(`/comics/${id}`, { method: 'DELETE' });
}

/* ─── Chapters ──────────────────────────────────────────── */

/** Lấy danh sách chương theo comicId */
async function getChaptersByComic(comicId) {
  return fetchAPI(`/chapters?comicId=${comicId}&_sort=chapterNumber&_order=asc`);
}

/** Lấy chi tiết 1 chương */
async function getChapterById(id) {
  return fetchAPI(`/chapters/${id}`);
}

/** Thêm chương mới (admin) */
async function createChapter(data) {
  return fetchAPI('/chapters', { method: 'POST', body: JSON.stringify(data) });
}

/** Xoá chương */
async function deleteChapter(id) {
  return fetchAPI(`/chapters/${id}`, { method: 'DELETE' });
}

/* ─── Genres ────────────────────────────────────────────── */

/** Lấy danh sách thể loại */
async function getGenres() {
  return fetchAPI('/genres');
}


/* ─── Users / Accounts ─────────────────────────────────── */

/** Lấy danh sách tài khoản */
async function getUsers() {
  return fetchAPI('/users');
}

/** Thêm tài khoản mới */
async function createUser(data) {
  return fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) });
}

/** Cập nhật tài khoản */
async function updateUser(id, data) {
  return fetchAPI(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

/** Xoá tài khoản */
async function deleteUser(id) {
  return fetchAPI(`/users/${id}`, { method: 'DELETE' });
}

/* ─── Bookmarks ─────────────────────────────────────────── */

/** Lấy bookmarks của user */
async function getBookmarks(userId) {
  return fetchAPI(`/bookmarks?userId=${userId}`);
}

/** Thêm bookmark */
async function addBookmark(userId, comicId) {
  return fetchAPI('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ userId, comicId, createdAt: new Date().toISOString() }),
  });
}

/** Xoá bookmark */
async function removeBookmark(bookmarkId) {
  return fetchAPI(`/bookmarks/${bookmarkId}`, { method: 'DELETE' });
}

/* ─── Reading History ───────────────────────────────────── */

/** Cập nhật lịch sử đọc */
async function updateReadingHistory(userId, comicId, chapterId, lastPage) {
  // Kiểm tra xem đã có record chưa
  const existing = await fetchAPI(`/readingHistory?userId=${userId}&comicId=${comicId}`);
  const data = { userId, comicId, chapterId, lastPage, updatedAt: new Date().toISOString() };

  if (existing && existing.length > 0) {
    return fetchAPI(`/readingHistory/${existing[0].id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  return fetchAPI('/readingHistory', { method: 'POST', body: JSON.stringify(data) });
}

/* ─── Comments ──────────────────────────────────────────── */

/** Lấy bình luận của 1 truyện */
async function getCommentsByComic(comicId) {
  return fetchAPI(`/comments?comicId=${comicId}&_sort=createdAt&_order=desc`);
}

/** Thêm bình luận */
async function addComment(comicId, content) {
  const user = Auth.getCurrentUser();
  if (!user) throw new Error('Vui lòng đăng nhập');
  const data = {
    comicId: parseInt(comicId),
    userId: user.id,
    userDisplayName: user.displayName,
    userAvatar: user.avatar,
    content,
    createdAt: new Date().toISOString()
  };
  return fetchAPI('/comments', { method: 'POST', body: JSON.stringify(data) });
}

/** Xóa bình luận */
async function deleteComment(id) {
  return fetchAPI(`/comments/${id}`, { method: 'DELETE' });
}

/* ─── Purchases & Cart ──────────────────────────────────── */

/** Lấy lịch sử mua */
async function getPurchases(userId) {
  return fetchAPI(`/purchases?userId=${userId}`);
}

/** Mua chương */
async function createPurchase(userId, comicId, chapterId, price) {
  const data = { userId, comicId: parseInt(comicId), chapterId: parseInt(chapterId), price, createdAt: new Date().toISOString() };
  return fetchAPI('/purchases', { method: 'POST', body: JSON.stringify(data) });
}

/** Lấy giỏ hàng */
async function getCart(userId) {
  return fetchAPI(`/cart?userId=${userId}`);
}

/** Thêm vào giỏ hàng */
async function addToCart(userId, comicId, chapterId, price) {
  const data = { userId, comicId: parseInt(comicId), chapterId: parseInt(chapterId), price, createdAt: new Date().toISOString() };
  return fetchAPI('/cart', { method: 'POST', body: JSON.stringify(data) });
}

/** Xoá khỏi giỏ hàng */
async function removeFromCart(cartId) {
  return fetchAPI(`/cart/${cartId}`, { method: 'DELETE' });
}

/* ─── Coins ─────────────────────────────────────────────── */

/** Cập nhật xu */
async function updateUserCoins(userId, coins) {
  const user = await fetchAPI(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ coins }) });
  
  // Update auth local state
  const currentUser = Auth.getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    currentUser.coins = coins;
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(currentUser));
  }
  return user;
}
