/**
 * TLUTRUYEN — Logic Trang hồ sơ cá nhân
 * Quản lý các tab hồ sơ người dùng, thiết lập, lịch sử đọc và mua hàng.
 */

// Trạng thái toàn cục cho phiên làm việc hiện tại
let currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các thành phần dùng chung
  initComponents('');
  
  // Tải nội dung trang
  initProfilePage();
});

/* ─── Khởi tạo trang ────────────────────────────────────────── */

/**
 * Khởi tạo chính cho trang hồ sơ.
 */
async function initProfilePage() {
  const user = Auth.getCurrentUser();
  if (!user) {
    _renderUnauthorized();
    return;
  }

  currentUserId = user.id;
  document.getElementById('profile-dashboard').classList.remove('d-none');

  // Cập nhật UI ban đầu
  _updateProfileHeader(user);
  _setupTabNavigation();
  _loadUploadGenres();
}

/** @private */
function _renderUnauthorized() {
  document.getElementById('unauthorized-message').classList.remove('d-none');
}

/** @private */
function _updateProfileHeader(user) {
  const avatarSrc = user.avatar || '../' + CONFIG.DEFAULTS.PLACEHOLDER_IMAGE;
  const displayName = user.displayName || user.email.split('@')[0];
  const coins = user.coins !== undefined ? user.coins : 0;

  // Các phần tử Header
  document.getElementById('user-profile-avatar').src = avatarSrc;
  document.getElementById('user-profile-name').textContent = displayName;
  document.getElementById('user-profile-email').textContent = user.email;
  document.getElementById('user-profile-coins').textContent = coins;
  
  // Điền sẵn tab Thiết lập
  document.getElementById('settings-avatar-preview').src = avatarSrc;
  document.getElementById('settings-avatar').value = user.avatar || '';
  document.getElementById('settings-display-name').value = displayName;
  document.getElementById('settings-email').value = user.email;
}

/* ─── Điều hướng Tab ─────────────────────────────────────────────── */

/** @private */
function _setupTabNavigation() {
  const navButtons = document.querySelectorAll('.profile-nav-btn');
  const tabContents = document.querySelectorAll('.profile-tab-content');

  // Xử lý tab ban đầu từ URL hoặc mặc định
  const initialTab = getQueryParam('tab') || 'reading-history';
  _activateTab(initialTab, navButtons, tabContents);

  // Đính kèm trình lắng nghe nhấp chuột
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      _activateTab(button.dataset.tab, navButtons, tabContents);
    });
  });
}

/** @private */
function _activateTab(tabId, navButtons, tabContents) {
  // Cập nhật trạng thái UI
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  tabContents.forEach(content => content.classList.toggle('active', content.id === `tab-${tabId}`));

  // Tải dữ liệu tab cụ thể
  _loadTabData(tabId);
}

/** @private */
function _loadTabData(tabId) {
  switch (tabId) {
    case 'reading-history': loadReadingHistory(); break;
    case 'purchase-history': loadPurchaseHistory(); break;
    case 'cart': loadCart(); break;
    case 'following': loadFollowedComics(); break;
    case 'user-comics': loadUploadedComics(); break;
    case 'settings': setupSettingsForm(); break;
  }
}

/* ─── Tab 1: Lịch sử đọc ─────────────────────────────────────── */

async function loadReadingHistory() {
  const container = document.getElementById('reading-history-list');
  _renderLoader(container);

  try {
    const history = await fetchAPI(`/readingHistory?userId=${currentUserId}&_sort=updatedAt&_order=desc`);
    if (!history || history.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-5">Bạn chưa đọc truyện nào.</p>';
      return;
    }

    // Tải dữ liệu liên quan để ánh xạ
    const [comics, chapters] = await Promise.all([
      getComics({ limit: 999 }),
      fetchAPI('/chapters?_limit=9999')
    ]);

    let html = '';
    history.forEach(item => {
      const comic = comics.find(c => c.id === item.comicId);
      const chapter = chapters.find(ch => ch.id === item.chapterId);
      
      if (comic && chapter) {
        html += _renderHistoryItem(comic, chapter, item.updatedAt);
      }
    });

    container.innerHTML = html || '<p class="text-muted text-center py-5">Lỗi hiển thị lịch sử đọc.</p>';
    
  } catch (error) {
    console.error('[PROFILE] Lỗi tải lịch sử:', error);
    container.innerHTML = '<p class="text-danger text-center py-5">Lỗi tải dữ liệu lịch sử đọc.</p>';
  }
}

/** @private */
function _renderHistoryItem(comic, chapter, updatedAt) {
  return `
    <div class="p-3 d-flex align-items-center justify-content-between history-card mb-2">
      <div class="d-flex align-items-center gap-3">
        <img src="${getComicImageSrc(comic.coverImage, '../')}" class="history-thumb" onerror="this.src='../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
        <div>
          <h6 class="mb-1 fw-bold text-light">${escapeHtml(comic.title)}</h6>
          <p class="mb-0 text-secondary small">Chương ${chapter.chapterNumber}</p>
          <small class="text-muted">${timeAgo(updatedAt)}</small>
        </div>
      </div>
      <a href="reader.html?id=${chapter.id}" class="btn btn-cw-primary btn-sm px-3">
        Đọc tiếp <i class="bi bi-arrow-right-short"></i>
      </a>
    </div>
  `;
}

/* ─── Tab 2: Lịch sử mua hàng ────────────────────────────────────── */

async function loadPurchaseHistory() {
  const container = document.getElementById('purchase-history-list');
  _renderLoader(container);

  try {
    const purchases = await getPurchases(currentUserId);
    if (!purchases || purchases.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-5">Bạn chưa mua chương truyện nào.</p>';
      return;
    }

    const [comics, chapters] = await Promise.all([
      getComics({ limit: 999 }),
      fetchAPI('/chapters?_limit=9999')
    ]);

    let html = '';
    purchases.forEach(item => {
      const comic = comics.find(c => c.id === item.comicId);
      const chapter = chapters.find(ch => ch.id === item.chapterId);

      if (comic && chapter) {
        html += _renderPurchaseItem(comic, chapter, item);
      }
    });

    container.innerHTML = html || '<p class="text-muted text-center py-5">Lỗi hiển thị lịch sử mua.</p>';
    
  } catch (error) {
    console.error('[PROFILE] Lỗi tải lịch sử mua:', error);
    container.innerHTML = '<p class="text-danger text-center py-5">Lỗi tải lịch sử mua hàng.</p>';
  }
}

/** @private */
function _renderPurchaseItem(comic, chapter, purchase) {
  return `
    <div class="p-3 d-flex align-items-center justify-content-between purchase-card mb-2">
      <div class="d-flex align-items-center gap-3">
        <div class="text-warning fs-4"><i class="bi bi-unlock-fill"></i></div>
        <div>
          <h6 class="mb-1 fw-bold text-light">${escapeHtml(comic.title)}</h6>
          <p class="mb-0 text-secondary small">Chương ${chapter.chapterNumber}</p>
          <small class="text-muted">Mở khóa: ${formatDate(purchase.createdAt)} — <strong class="text-danger">${purchase.price} xu</strong></small>
        </div>
      </div>
      <a href="reader.html?id=${chapter.id}" class="btn btn-cw-outline btn-sm px-3">
        Đọc ngay <i class="bi bi-book-half"></i>
      </a>
    </div>
  `;
}

/* ─── Tab 3: Giỏ hàng ───────────────────────────────────────── */

async function loadCart() {
  const container = document.getElementById('cart-list');
  const checkoutBtn = document.getElementById('checkout-all-btn');
  _renderLoader(container);
  checkoutBtn.classList.add('d-none');

  try {
    const cartItems = await getCart(currentUserId);
    if (!cartItems || cartItems.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5 text-secondary">
          <i class="bi bi-cart-x fs-1"></i>
          <p class="mt-3">Giỏ hàng của bạn đang trống.</p>
          <a href="search.html" class="btn btn-cw-outline btn-sm mt-2">Dạo kho truyện tranh</a>
        </div>
      `;
      return;
    }

    const [comics, chapters] = await Promise.all([
      getComics({ limit: 999 }),
      fetchAPI('/chapters?_limit=9999')
    ]);

    let html = '';
    let validItems = [];

    cartItems.forEach(item => {
      const comic = comics.find(c => c.id === item.comicId);
      const chapter = chapters.find(ch => ch.id === item.chapterId);

      if (comic && chapter) {
        validItems.push(item);
        html += _renderCartItem(comic, chapter, item);
      }
    });

    container.innerHTML = html;

    if (validItems.length > 0) {
      const totalPrice = validItems.reduce((sum, i) => sum + (i.price || CONFIG.DEFAULTS.CHAPTER_PRICE), 0);
      checkoutBtn.classList.remove('d-none');
      checkoutBtn.onclick = () => handleCheckoutAll(validItems);
      checkoutBtn.innerHTML = `<i class="bi bi-wallet2"></i> Thanh toán toàn bộ (${totalPrice} Xu)`;
    }
    
  } catch (error) {
    console.error('[PROFILE] Lỗi tải giỏ hàng:', error);
    container.innerHTML = '<p class="text-danger text-center py-5">Lỗi tải giỏ hàng.</p>';
  }
}

/** @private */
function _renderCartItem(comic, chapter, cartItem) {
  return `
    <div class="p-3 d-flex align-items-center justify-content-between cart-card mb-2">
      <div class="d-flex align-items-center gap-3">
        <img src="${getComicImageSrc(comic.coverImage, '../')}" class="cart-thumb" onerror="this.src='../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
        <div>
          <h6 class="mb-1 fw-bold text-light">${escapeHtml(comic.title)}</h6>
          <p class="mb-0 text-secondary small">Chương ${chapter.chapterNumber}</p>
          <strong class="text-danger small"><i class="bi bi-coin text-warning"></i> ${cartItem.price} Xu</strong>
        </div>
      </div>
      <button onclick="handleRemoveCart(${cartItem.id})" class="btn btn-sm btn-outline-danger px-3 py-1">
        <i class="bi bi-trash"></i> Xoá
      </button>
    </div>
  `;
}

async function handleRemoveCart(cartId) {
  try {
    await removeFromCart(cartId);
    showToast('Đã xoá khỏi giỏ hàng', 'info');
    loadCart();
  } catch (error) {
    showToast('Lỗi khi xoá vật phẩm!', 'error');
  }
}

async function handleCheckoutAll(cartItems) {
  const user = Auth.getCurrentUser();
  if (!user) return;

  const currentCoins = user.coins || 0;
  const totalCost = cartItems.reduce((sum, item) => sum + (item.price || CONFIG.DEFAULTS.CHAPTER_PRICE), 0);

  if (currentCoins < totalCost) {
    showToast(`Không đủ xu! Bạn cần thêm ${totalCost - currentCoins} Xu.`, 'error');
    return;
  }

  if (!confirm(`Xác nhận thanh toán ${cartItems.length} chương truyện với tổng giá ${totalCost} Xu?`)) return;

  try {
    // 1. Khấu trừ Xu
    const newCoins = currentCoins - totalCost;
    await updateUserCoins(user.id, newCoins);

    // 2. Xử lý Mua hàng và Xoá giỏ hàng
    const purchasePromises = cartItems.map(item => createPurchase(user.id, item.comicId, item.chapterId, item.price));
    const deletePromises = cartItems.map(item => removeFromCart(item.id));

    await Promise.all([...purchasePromises, ...deletePromises]);

    showToast('Thanh toán giỏ hàng thành công!', 'success');
    _updateProfileHeader({ ...user, coins: newCoins });
    loadCart();
    
  } catch (error) {
    showToast('Lỗi trong quá trình thanh toán!', 'error');
  }
}

/* ─── Tab 4: Đang theo dõi ───────────────────────────────────────────── */

async function loadFollowedComics() {
  const container = document.getElementById('following-list');
  _renderLoader(container);

  try {
    const bookmarks = await getBookmarks(currentUserId);
    if (!bookmarks || bookmarks.length === 0) {
      container.innerHTML = '<div class="col-12 text-center py-5 text-secondary"><i class="bi bi-heartbreak fs-1"></i><p class="mt-3">Chưa theo dõi truyện nào.</p></div>';
      return;
    }

    const comics = await getComics({ limit: 999 });
    let html = '';

    bookmarks.forEach(item => {
      const comic = comics.find(c => c.id === item.comicId);
      if (comic) {
        html += _renderFollowedItem(comic, item.id);
      }
    });

    container.innerHTML = html || '<div class="col-12 text-center py-5">Lỗi hiển thị danh sách theo dõi.</div>';
    
  } catch (error) {
    console.error('[PROFILE] Lỗi tải danh sách theo dõi:', error);
    container.innerHTML = '<div class="col-12 text-center py-5 text-danger">Lỗi tải danh sách theo dõi.</div>';
  }
}

/** @private */
function _renderFollowedItem(comic, bookmarkId) {
  const genresHTML = (comic.genres || []).slice(0, 2).map(g => `<span class="cw-genre-tag">${g}</span>`).join(' ');
  
  return `
    <div class="col-12 col-md-6 col-xl-4 mb-3 anim-fade-in">
      <div class="p-3 d-flex gap-3 rounded border bg-surface">
        <a href="comic-detail.html?id=${comic.id}">
          <img src="${getComicImageSrc(comic.coverImage, '../')}" class="follow-thumb" onerror="this.src='../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
        </a>
        <div class="flex-grow-1 d-flex flex-column justify-content-between">
          <div>
            <a href="comic-detail.html?id=${comic.id}" class="text-decoration-none text-light fw-bold small d-block mb-1">${truncateText(comic.title, 25)}</a>
            <div class="mb-2">${genresHTML}</div>
          </div>
          <button onclick="handleUnfollowProfile(${bookmarkId})" class="btn btn-sm btn-outline-danger py-1 fs-smaller">
            <i class="bi bi-heartbreak"></i> Bỏ theo dõi
          </button>
        </div>
      </div>
    </div>
  `;
}

async function handleUnfollowProfile(bookmarkId) {
  try {
    await removeBookmark(bookmarkId);
    showToast('Đã huỷ theo dõi', 'info');
    loadFollowedComics();
  } catch (error) {
    showToast('Lỗi khi huỷ theo dõi!', 'error');
  }
}

/* ─── Tab 5: Truyện người dùng đã đăng ────────────────────────────────── */

async function loadUploadedComics() {
  const container = document.getElementById('uploaded-comics-list');
  _renderLoader(container);

  try {
    const comics = await fetchAPI(`/comics?uploaderId=${currentUserId}&_sort=createdAt&_order=desc`);
    if (!comics || comics.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-5">Bạn chưa đăng bộ truyện nào.</p>';
      return;
    }

    container.innerHTML = comics.map(comic => _renderUploadedItem(comic)).join('');
    
  } catch (error) {
    console.error('[PROFILE] Lỗi tải truyện đã đăng:', error);
    container.innerHTML = '<p class="text-danger text-center py-5">Lỗi tải danh sách truyện đã đăng.</p>';
  }
}

/** @private */
function _renderUploadedItem(comic) {
  const badgeHTML = comic.approved
    ? '<span class="badge bg-success-subtle text-success border px-2 py-1 fs-smaller">Đã phê duyệt</span>'
    : '<span class="badge bg-warning-subtle text-warning border px-2 py-1 fs-smaller">Chờ phê duyệt</span>';

  return `
    <div class="p-3 d-flex align-items-center justify-content-between upload-card mb-2">
      <div class="d-flex align-items-center gap-3">
        <img src="${getComicImageSrc(comic.coverImage, '../')}" class="upload-thumb" onerror="this.src='../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
        <div>
          <h6 class="mb-1 fw-bold text-light">${escapeHtml(comic.title)}</h6>
          <p class="mb-0 text-secondary small">Tác giả: ${escapeHtml(comic.author)} — Thể loại: ${comic.genres?.join(', ') || '?'}</p>
          <small class="text-muted">Đăng lúc: ${formatDate(comic.createdAt)}</small>
        </div>
      </div>
      <div class="text-end">
        <div class="mb-2">${badgeHTML}</div>
        ${comic.approved 
          ? `<a href="comic-detail.html?id=${comic.id}" class="btn btn-cw-outline btn-sm px-3">Xem chi tiết</a>`
          : '<button class="btn btn-sm btn-secondary px-3" disabled>Đang đợi duyệt</button>'
        }
      </div>
    </div>
  `;
}

async function _loadUploadGenres() {
  const container = document.getElementById('upload-genres-checkboxes');
  if (!container) return;

  try {
    const genres = await getGenres();
    container.innerHTML = genres.map(g => `
      <div class="form-check form-check-inline m-0 py-1 pe-3">
        <input class="form-check-input" type="checkbox" name="genres" id="genre-cb-${g.id}" value="${g.slug}">
        <label class="form-check-label text-secondary small cursor-pointer" for="genre-cb-${g.id}">${g.name}</label>
      </div>
    `).join('');
  } catch (error) {}

  document.getElementById('upload-comic-form')?.addEventListener('submit', _handleUploadComic);
}

async function _handleUploadComic(e) {
  e.preventDefault();

  const title = document.getElementById('upload-title').value.trim();
  const author = document.getElementById('upload-author').value.trim();
  const artist = document.getElementById('upload-artist').value.trim();
  const coverImage = document.getElementById('upload-cover').value.trim();
  const description = document.getElementById('upload-desc').value.trim();

  const checkboxes = document.querySelectorAll('input[name="genres"]:checked');
  if (checkboxes.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 thể loại!', 'warning');
    return;
  }
  const genres = Array.from(checkboxes).map(cb => cb.value);

  const payload = { title, slug: slugify(title), author, artist, coverImage, description, genres, status: 'ongoing' };

  try {
    await createComicByUser(payload);
    showToast('Đăng truyện thành công! Đang chờ duyệt.', 'success');
    
    e.target.reset();
    _loadUploadGenres();
    
    bootstrap.Collapse.getInstance(document.getElementById('upload-form-wrapper'))?.hide();
    loadUploadedComics();
    
  } catch (error) {
    showToast('Đăng truyện thất bại!', 'error');
  }
}

/* ─── Tab 6: Thiết lập tài khoản ────────────────────────────────────── */

function setupSettingsForm() {
  _initAvatarUpload();
  
  const form = document.getElementById('profile-settings-form');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const user = Auth.getCurrentUser();
    if (!user) return;

    const displayName = document.getElementById('settings-display-name').value.trim();
    const avatar = document.getElementById('settings-avatar').value.trim();
    const password = document.getElementById('settings-password').value;
    const confirmPass = document.getElementById('settings-confirm-password').value;

    if (!displayName) {
      showToast('Tên hiển thị không được trống!', 'warning');
      return;
    }

    let payload = { displayName, avatar };

    if (password) {
      if (password.length < 4) {
        showToast('Mật khẩu tối thiểu 4 ký tự!', 'warning');
        return;
      }
      if (password !== confirmPass) {
        showToast('Mật khẩu xác nhận không khớp!', 'warning');
        return;
      }
      payload.password = password;
    }

    try {
      const result = await fetchAPI(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      if (result) {
        const updatedUser = { ...user, ...payload };
        delete updatedUser.password;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
        
        showToast('Cập nhật tài khoản thành công!', 'success');
        _updateProfileHeader(updatedUser);
      }
    } catch (error) {
      showToast('Lỗi cập nhật tài khoản!', 'error');
    }
  };
}

/** @private */
function _initAvatarUpload() {
  const avatarInput = document.getElementById('settings-avatar');
  const previewImg = document.getElementById('settings-avatar-preview');
  
  // Trình chuyển đổi Tab
  const tabs = { url: document.getElementById('avatar-tab-url'), file: document.getElementById('avatar-tab-file') };
  const methods = { url: document.getElementById('avatar-method-url'), file: document.getElementById('avatar-method-file') };

  if (tabs.url && tabs.file) {
    tabs.url.onclick = () => { _toggleAvatarMethod('url', tabs, methods); };
    tabs.file.onclick = () => { _toggleAvatarMethod('file', tabs, methods); };
  }

  // Logic Kéo thả tệp
  const dropzone = document.getElementById('avatar-dropzone');
  const fileInput = document.getElementById('avatar-file-input');

  if (dropzone && fileInput) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
      dropzone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); });
    });

    dropzone.addEventListener('dragenter', () => dropzone.classList.add('dragover'));
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      dropzone.classList.remove('dragover');
      _handleAvatarFile(e.dataTransfer.files[0], avatarInput, previewImg, dropzone);
    });

    fileInput.onchange = (e) => _handleAvatarFile(e.target.files[0], avatarInput, previewImg, dropzone);
    dropzone.onclick = (e) => { if (e.target.id !== 'avatar-file-input') fileInput.click(); };
  }

  avatarInput.oninput = () => { previewImg.src = avatarInput.value.trim() || '../' + CONFIG.DEFAULTS.PLACEHOLDER_IMAGE; };
}

/** @private */
function _toggleAvatarMethod(method, tabs, methods) {
  tabs.url.classList.toggle('active', method === 'url');
  tabs.file.classList.toggle('active', method === 'file');
  methods.url.style.display = method === 'url' ? 'block' : 'none';
  methods.file.style.display = method === 'file' ? 'block' : 'none';
}

/** @private */
function _handleAvatarFile(file, input, preview, zone) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Chỉ chấp nhận file ảnh!', 'warning');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('Dung lượng tối đa 2MB!', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    input.value = e.target.result;
    preview.src = e.target.result;
    zone.querySelector('p').textContent = 'Ảnh đã sẵn sàng!';
    showToast('Tải ảnh thành công!', 'success');
  };
  reader.readAsDataURL(file);
}

/* ─── Tab 7: Ví & Nạp xu ──────────────────────────────────────── */

async function handleTopupCoins(amount) {
  const user = Auth.getCurrentUser();
  if (!user) return;

  const currentCoins = user.coins || 0;
  const newCoins = currentCoins + amount;

  try {
    await updateUserCoins(user.id, newCoins);
    document.getElementById('user-profile-coins').textContent = newCoins;
    showToast(`Nạp thành công +${amount} Xu!`, 'success');
  } catch (error) {
    showToast('Lỗi khi nạp xu!', 'error');
  }
}
window.handleTopupCoins = handleTopupCoins;

/* ─── Trợ giúp Toàn cục ─────────────────────────────────────────────── */

/** @private */
function _renderLoader(container) {
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>';
}
