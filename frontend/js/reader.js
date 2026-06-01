/**
 * TLUTRUYEN — Logic Trang đọc truyện
 * Xử lý việc tải nội dung chương, kiểm tra bảo mật và điều hướng.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các thành phần dùng chung
  initComponents('');
  
  // Tải nội dung trang
  initReader();
});

/* ─── Khởi tạo trình đọc ───────────────────────────────────────── */

/**
 * Hàm khởi tạo chính cho trình đọc truyện.
 */
async function initReader() {
  const chapterId = getQueryParam('id');
  if (!chapterId) return;

  try {
    const chapter = await getChapterById(chapterId);
    if (!chapter) throw new Error('Không tìm thấy chương truyện');

    const comic = await getComicById(chapter.comicId);
    const allChapters = await getChaptersByComic(chapter.comicId);
    const currentUser = Auth.getCurrentUser();

    // Kiểm tra xem người dùng có quyền truy cập vào chương này không
    const hasAccess = await _checkChapterAccess(chapter, comic, currentUser);

    if (!hasAccess) {
      _renderLockedScreen(comic, chapter, allChapters);
      return;
    }

    // Hiển thị nội dung và ghi lại lịch sử
    _renderReader(comic, chapter, allChapters);
    _recordReadingHistory(currentUser, comic.id, chapter.id);

  } catch (error) {
    console.error('[READER] Lỗi khi tải chương:', error);
    document.getElementById('reader-content').innerHTML = `
      <div class="text-center py-5">
        <p class="text-danger mb-3">Lỗi: ${error.message}</p>
        <a href="../index.html" class="btn btn-cw-outline">Về trang chủ</a>
      </div>
    `;
  }
}

/* ─── Trợ giúp hiển thị Riêng tư ───────────────────────────────────── */

/** @private */
async function _checkChapterAccess(chapter, comic, user) {
  // 1. Kiểm tra nếu chương miễn phí
  const isFree = !chapter.price || chapter.price <= 0;
  if (isFree) return true;

  // 2. Kiểm tra nếu người dùng được ủy quyền (Admin hoặc Người đăng)
  if (Auth.isAdmin()) return true;
  if (user && comic.uploaderId === user.id) return true;

  // 3. Kiểm tra nếu người dùng đã mua chương này
  if (user) {
    const purchases = await getPurchases(user.id, comic.id);
    return purchases.some(purchase => purchase.chapterId === chapter.id);
  }

  return false;
}

/** @private */
function _renderReader(comic, chapter, allChapters) {
  const container = document.getElementById('reader-content');
  const currentIdx = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = allChapters[currentIdx - 1];
  const nextChapter = allChapters[currentIdx + 1];

  const pagesHTML = (chapter.pages || []).map((src, index) => `
    <img src="../${src}" alt="Trang ${index + 1}" class="cw-reader__page"
         onerror="this.src='../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
  `).join('');

  container.innerHTML = `
    <div class="text-center py-3">
      <a href="comic-detail.html?id=${comic.id}" class="text-decoration-none">
        <h5 class="cw-reader__comic-title">${escapeHtml(comic.title)}</h5>
      </a>
      <h6 class="text-secondary">Chương ${chapter.chapterNumber}${chapter.title ? ': ' + escapeHtml(chapter.title) : ''}</h6>
    </div>
    <div class="cw-reader">${pagesHTML}</div>
    ${_renderNavigation(comic.id, prevChapter, nextChapter)}
  `;
}

/** @private */
function _renderLockedScreen(comic, chapter, allChapters) {
  const container = document.getElementById('reader-content');
  const currentIdx = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = allChapters[currentIdx - 1];
  const nextChapter = allChapters[currentIdx + 1];
  const price = chapter.price || CONFIG.DEFAULTS.CHAPTER_PRICE;

  container.innerHTML = `
    <div class="text-center py-3">
      <a href="comic-detail.html?id=${comic.id}" class="text-decoration-none">
        <h5 class="cw-reader__comic-title">${escapeHtml(comic.title)}</h5>
      </a>
      <h6 class="text-secondary">Chương ${chapter.chapterNumber}</h6>
    </div>
    
    <div class="container my-5 text-center px-3" style="max-width: 500px;">
      <div class="p-5 rounded-4 anim-fade-in cw-reader__lock-card">
        <div class="mb-4 text-danger" style="font-size: 4rem;">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <h3 class="mb-3 text-uppercase fw-bold">Chương truyện bị khoá</h3>
        <p class="text-secondary mb-4">Chương này cần mở khoá bằng xu để tiếp tục theo dõi hành trình của các nhân vật.</p>
        
        <div class="p-3 rounded-3 mb-4 d-flex justify-content-between align-items-center bg-surface border">
          <span class="text-secondary">Giá mở khoá:</span>
          <strong class="text-danger" style="font-size: 1.25rem;">
            <i class="bi bi-coin text-warning"></i> ${price} Xu
          </strong>
        </div>

        <button onclick="handleQuickBuyReader(${chapter.id}, ${price}, ${comic.id})" class="btn btn-cw-primary w-100 mb-2 py-2.5">
          <i class="bi bi-unlock-fill"></i> Mua Chương Ngay
        </button>
        <button onclick="handleAddToCartReader(${chapter.id}, ${price}, ${comic.id})" class="btn btn-cw-outline w-100 py-2.5">
          <i class="bi bi-cart-plus"></i> Thêm vào giỏ hàng
        </button>
      </div>
    </div>

    ${_renderNavigation(comic.id, prevChapter, nextChapter)}
  `;
}

/** @private */
function _renderNavigation(comicId, prevChapter, nextChapter) {
  return `
    <div class="cw-reader__nav container" style="max-width:800px;">
      ${prevChapter
        ? `<a href="reader.html?id=${prevChapter.id}" class="btn btn-cw-outline btn-sm">
            <i class="bi bi-chevron-left"></i> Chương trước
           </a>`
        : '<span></span>'}
      <a href="comic-detail.html?id=${comicId}" class="btn btn-sm text-secondary">
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

/** @private */
function _recordReadingHistory(user, comicId, chapterId) {
  if (user) {
    updateReadingHistory(user.id, comicId, chapterId).catch(() => {});
  }
}

/* ─── Hành động trong trình đọc ─────────────────────────────────────────────── */

/**
 * Xử lý hành động mua nhanh từ màn hình đọc.
 */
async function handleQuickBuyReader(chapterId, price, comicId) {
  const user = Auth.getCurrentUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để mua chương truyện', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    return;
  }

  const currentCoins = user.coins || 0;
  if (currentCoins < price) {
    showToast('Tài khoản của bạn không đủ xu. Vui lòng nạp thêm!', 'error');
    return;
  }

  try {
    const newCoins = currentCoins - price;
    await updateUserCoins(user.id, newCoins);
    await createPurchase(user.id, comicId, chapterId, price);

    showToast('Mở khoá thành công!', 'success');
    setTimeout(() => location.reload(), 1000);
    
  } catch (error) {
    showToast('Giao dịch thất bại. Vui lòng thử lại!', 'error');
  }
}

/**
 * Xử lý hành động thêm vào giỏ hàng từ màn hình đọc.
 */
async function handleAddToCartReader(chapterId, price, comicId) {
  const user = Auth.getCurrentUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để thực hiện', 'error');
    return;
  }

  try {
    await addToCart(user.id, comicId, chapterId, price);
    showToast('Đã thêm chương truyện vào giỏ hàng!', 'success');
    
  } catch (error) {
    showToast('Lỗi khi thêm vào giỏ hàng!', 'error');
  }
}
