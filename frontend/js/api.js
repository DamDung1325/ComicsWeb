/**
 * TLUTRUYEN — Module API
 * Bao bọc API fetch với các hàm hỗ trợ chuyên biệt cho backend giả lập.
 */

/* ─── Trình xử lý API cốt lõi ────────────────────────────────────────────── */

/**
 * Hàm bao bọc fetch cốt lõi với việc tự động đính kèm JWT.
 * @param {string} endpoint - Điểm cuối API (vd: '/comics').
 * @param {object} options - Tùy chọn fetch.
 * @returns {Promise<any>} Dữ liệu phản hồi.
 */
async function fetchAPI(endpoint, options = {}) {
  const url = CONFIG.API_BASE_URL + endpoint;
  const token = Auth.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      _handleUnauthorized();
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi API: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error(`[LỖI API] ${options.method || 'GET'} ${endpoint}:`, error);
    showToast(error.message || 'Lỗi kết nối máy chủ', 'error');
    throw error;
  }
}

/** @private */
function _handleUnauthorized() {
  Auth.logout();
  const base = getBasePath();
  window.location.href = base + 'pages/login.html';
}

/* ─── Tài nguyên Truyện (Comic) ─────────────────────────────────────────────── */

/**
 * Lấy danh sách truyện với các bộ lọc và phân trang tùy chọn.
 */
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

/**
 * Lấy một truyện duy nhất theo ID.
 */
async function getComicById(id) {
  return fetchAPI(`/comics/${id}`);
}

/**
 * Tìm kiếm truyện theo tiêu đề hoặc tác giả.
 */
async function searchComics(keyword) {
  return fetchAPI(`/comics?q=${encodeURIComponent(keyword)}`);
}

/**
 * Tạo truyện mới (Chỉ Admin).
 */
async function createComic(comicData) {
  return fetchAPI('/comics', { 
    method: 'POST', 
    body: JSON.stringify(comicData) 
  });
}

/**
 * Tạo truyện mới do người dùng gửi (cần phê duyệt).
 */
async function createComicByUser(comicData) {
  const user = Auth.getCurrentUser();
  if (!user) throw new Error('Yêu cầu đăng nhập');
  
  const payload = {
    ...comicData,
    uploaderId: user.id,
    approved: false,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return fetchAPI('/comics', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

/**
 * Cập nhật toàn bộ bản ghi truyện (Chỉ Admin).
 */
async function updateComic(id, comicData) {
  return fetchAPI(`/comics/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(comicData) 
  });
}

/**
 * Cập nhật một phần bản ghi truyện (Chỉ Admin).
 */
async function patchComic(id, partialData) {
  return fetchAPI(`/comics/${id}`, { 
    method: 'PATCH', 
    body: JSON.stringify(partialData) 
  });
}

/**
 * Xóa bản ghi truyện (Chỉ Admin).
 */
async function deleteComic(id) {
  return fetchAPI(`/comics/${id}`, { method: 'DELETE' });
}

/* ─── Tài nguyên Chương (Chapter) ───────────────────────────────────────────── */

/**
 * Lấy tất cả các chương của một bộ truyện cụ thể.
 */
async function getChaptersByComic(comicId) {
  return fetchAPI(`/chapters?comicId=${comicId}&_sort=chapterNumber&_order=asc`);
}

/**
 * Lấy một chương duy nhất theo ID.
 */
async function getChapterById(id) {
  return fetchAPI(`/chapters/${id}`);
}

/**
 * Tạo chương mới cho truyện (Chỉ Admin).
 */
async function createChapter(chapterData) {
  return fetchAPI('/chapters', { 
    method: 'POST', 
    body: JSON.stringify(chapterData) 
  });
}

/**
 * Cập nhật bản ghi chương (Chỉ Admin).
 */
async function updateChapter(id, chapterData) {
  return fetchAPI(`/chapters/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(chapterData) 
  });
}

/**
 * Xóa bản ghi chương (Chỉ Admin).
 */
async function deleteChapter(id) {
  return fetchAPI(`/chapters/${id}`, { method: 'DELETE' });
}

/* ─── Tài nguyên Thể loại (Genre) ─────────────────────────────────────────────── */

/**
 * Lấy danh sách các thể loại truyện hiện có.
 */
async function getGenres() {
  return fetchAPI('/genres');
}

/* ─── Tài nguyên Người dùng & Tài khoản ────────────────────────────────────── */

/**
 * Lấy tất cả người dùng đã đăng ký (Chỉ Admin).
 */
async function getUsers() {
  return fetchAPI('/users');
}

/**
 * Tạo tài khoản người dùng mới (Chỉ Admin).
 */
async function createUser(userData) {
  return fetchAPI('/users', { 
    method: 'POST', 
    body: JSON.stringify(userData) 
  });
}

/**
 * Cập nhật dữ liệu tài khoản người dùng.
 */
async function updateUser(id, userData) {
  return fetchAPI(`/users/${id}`, { 
    method: 'PATCH', 
    body: JSON.stringify(userData) 
  });
}

/**
 * Xóa tài khoản người dùng (Chỉ Admin).
 */
async function deleteUser(id) {
  return fetchAPI(`/users/${id}`, { method: 'DELETE' });
}

/* ─── Tài nguyên Dấu trang (Bookmark) ──────────────────────────────────────────── */

/**
 * Lấy danh sách dấu trang của một người dùng cụ thể.
 */
async function getBookmarks(userId) {
  return fetchAPI(`/bookmarks?userId=${userId}`);
}

/**
 * Thêm một bộ truyện vào danh sách dấu trang của người dùng.
 */
async function addBookmark(userId, comicId) {
  return fetchAPI('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ 
      userId, 
      comicId, 
      createdAt: new Date().toISOString() 
    }),
  });
}

/**
 * Xóa một dấu trang theo ID.
 */
async function removeBookmark(bookmarkId) {
  return fetchAPI(`/bookmarks/${bookmarkId}`, { method: 'DELETE' });
}

/* ─── Tài nguyên Lịch sử đọc ───────────────────────────────────── */

/**
 * Cập nhật hoặc tạo mới bản ghi lịch sử đọc cho người dùng.
 */
async function updateReadingHistory(userId, comicId, chapterId, lastPage = 1) {
  const existing = await fetchAPI(`/readingHistory?userId=${userId}&comicId=${comicId}`);
  
  const payload = { 
    userId, 
    comicId, 
    chapterId, 
    lastPage, 
    updatedAt: new Date().toISOString() 
  };

  if (existing && existing.length > 0) {
    return fetchAPI(`/readingHistory/${existing[0].id}`, { 
      method: 'PUT', 
      body: JSON.stringify(payload) 
    });
  }
  
  return fetchAPI('/readingHistory', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

/* ─── Tài nguyên Bình luận (Comment) ───────────────────────────────────────────── */

/**
 * Lấy danh sách bình luận cho một bộ truyện cụ thể.
 */
async function getCommentsByComic(comicId) {
  return fetchAPI(`/comments?comicId=${comicId}&_sort=createdAt&_order=desc`);
}

/**
 * Thêm bình luận cho một bộ truyện.
 */
async function addComment(comicId, content) {
  const user = Auth.getCurrentUser();
  if (!user) throw new Error('Yêu cầu đăng nhập');
  
  const payload = {
    comicId: parseInt(comicId),
    userId: user.id,
    userDisplayName: user.displayName,
    userAvatar: user.avatar,
    content,
    createdAt: new Date().toISOString()
  };
  return fetchAPI('/comments', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

/**
 * Xóa một bình luận theo ID.
 */
async function deleteComment(id) {
  return fetchAPI(`/comments/${id}`, { method: 'DELETE' });
}

/* ─── Tài nguyên Thương mại (Mua hàng & Giỏ hàng) ─────────────────────── */

/**
 * Lấy lịch sử mua hàng của người dùng.
 */
async function getPurchases(userId, comicId = null) {
  const query = comicId ? `&comicId=${parseInt(comicId)}` : '';
  return fetchAPI(`/purchases?userId=${userId}${query}`);
}

/**
 * Tạo một bản ghi mua hàng mới.
 */
async function createPurchase(userId, comicId, chapterId, price) {
  const payload = { 
    userId, 
    comicId: parseInt(comicId), 
    chapterId: parseInt(chapterId), 
    price, 
    createdAt: new Date().toISOString() 
  };
  return fetchAPI('/purchases', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

/**
 * Lấy các vật phẩm trong giỏ hàng của người dùng.
 */
async function getCart(userId, comicId = null) {
  const query = comicId ? `&comicId=${parseInt(comicId)}` : '';
  return fetchAPI(`/cart?userId=${userId}${query}`);
}

/**
 * Thêm một chương vào giỏ hàng của người dùng.
 */
async function addToCart(userId, comicId, chapterId, price) {
  const payload = { 
    userId, 
    comicId: parseInt(comicId), 
    chapterId: parseInt(chapterId), 
    price, 
    createdAt: new Date().toISOString() 
  };
  return fetchAPI('/cart', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
}

/**
 * Xóa một vật phẩm khỏi giỏ hàng.
 */
async function removeFromCart(cartId) {
  return fetchAPI(`/cart/${cartId}`, { method: 'DELETE' });
}

/* ─── Tài nguyên Ví (Wallet) ────────────────────────────────────────────── */

/**
 * Cập nhật số dư xu của người dùng.
 */
async function updateUserCoins(userId, coins) {
  const response = await fetchAPI(`/users/${userId}`, { 
    method: 'PATCH', 
    body: JSON.stringify({ coins }) 
  });
  
  // Đồng bộ hóa trạng thái phiên làm việc cục bộ
  const currentUser = Auth.getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    currentUser.coins = coins;
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
  }
  
  return response;
}
