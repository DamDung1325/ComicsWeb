/**
 * TLUTRUYEN — Logic Trang chi tiết truyện
 * Xử lý việc hiển thị thông tin truyện, danh sách chương, theo dõi và bình luận.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các thành phần dùng chung
  initComponents('');
  
  // Tải nội dung trang
  initComicDetail();
});

/* ─── Khởi tạo trang ────────────────────────────────────────── */

/**
 * Hàm khởi tạo chính cho trang chi tiết truyện.
 */
async function initComicDetail() {
  const comicId = getQueryParam('id');
  if (!comicId) {
    _renderErrorMessage('Không tìm thấy thông tin truyện.');
    return;
  }

  try {
    const user = Auth.getCurrentUser();
    
    // Tải tất cả dữ liệu cần thiết song song
    const [comic, chapters, comments, bookmarks, purchases, cart] = await Promise.all([
      getComicById(comicId),
      getChaptersByComic(comicId),
      getCommentsByComic(comicId),
      user ? fetchAPI(`/bookmarks?userId=${user.id}&comicId=${comicId}`) : Promise.resolve([]),
      user ? getPurchases(user.id, comicId) : Promise.resolve([]),
      user ? getCart(user.id, comicId) : Promise.resolve([]),
    ]);

    if (!comic) throw new Error('Dữ liệu truyện không tồn tại');

    // Kiểm tra bảo mật: Truyện đang chờ duyệt
    if (comic.approved === false && !Auth.isAdmin() && (!user || comic.uploaderId !== user.id)) {
      _renderPendingMessage();
      return;
    }

    _renderPageContent(comic, chapters, comments, bookmarks, purchases, cart);

  } catch (error) {
    console.error('[COMIC DETAIL] Khởi tạo thất bại:', error);
    _renderErrorMessage('Lỗi tải dữ liệu truyện. Vui lòng thử lại sau.');
  }
}

/* ─── Trợ giúp hiển thị ───────────────────────────────────────────── */

/** @private */
function _renderPageContent(comic, chapters, comments, bookmarks, purchases, cart) {
  const container = document.getElementById('comic-detail-content');
  const user = Auth.getCurrentUser();

  container.innerHTML = `
    ${_renderComicInfo(comic, bookmarks, chapters, user)}
    ${_renderChapterList(chapters, comic, user, purchases, cart)}
    ${_renderCommentSection(comic.id, comments, user)}
  `;
}

/** @private */
function _renderComicInfo(comic, bookmarks, chapters, user) {
  const isFollowed = bookmarks && bookmarks.length > 0;
  const genresHTML = (comic.genres || []).map(g => `<span class="cw-genre-tag">${g}</span>`).join(' ');
  const statusLabel = comic.status === 'completed' ? 'Hoàn thành' : 'Đang ra';
  const firstChapterId = chapters.length > 0 ? chapters[0].id : null;

  const followButtonHTML = isFollowed
    ? `<button class="btn btn-cw-outline btn-sm mt-2 px-3 py-2 d-flex align-items-center gap-1 text-muted border-muted" onclick="handleUnfollow(${bookmarks[0].id})">
         <i class="bi bi-heartbreak-fill text-danger"></i> Huỷ theo dõi
       </button>`
    : `<button class="btn btn-cw-primary btn-sm mt-2 px-3 py-2 d-flex align-items-center gap-1" onclick="handleFollow(${comic.id})">
         <i class="bi bi-heart-fill"></i> Theo dõi truyện
       </button>`;

  const readButtonHTML = firstChapterId
    ? `<a href="reader.html?id=${firstChapterId}" class="btn btn-cw-primary d-flex align-items-center gap-1">
         <i class="bi bi-book-half"></i> Đọc từ đầu
       </a>`
    : '';

  return `
    <div class="row g-4 anim-fade-in">
      <div class="col-md-4 col-lg-3">
        <img src="${getComicImageSrc(comic.coverImage, '../')}" alt="${escapeHtml(comic.title)}" class="w-100 rounded-3 border"
             style="aspect-ratio: 2/3; object-fit: cover;"
             onerror="this.src='../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
      </div>
      <div class="col-md-8 col-lg-9">
        <h1 class="fw-black text-uppercase font-heading">${escapeHtml(comic.title)}</h1>
        <div class="d-flex flex-wrap gap-2 mb-3">
          ${genresHTML}
          <span class="cw-genre-tag bg-success-subtle text-success">${statusLabel}</span>
        </div>
        <div class="cw-rating mb-3">${renderStars(comic.rating)}</div>
        <p class="text-secondary mb-2"><i class="bi bi-person"></i> <strong>Tác giả:</strong> ${escapeHtml(comic.author)}</p>
        <p class="text-secondary mb-2"><i class="bi bi-brush"></i> <strong>Hoạ sĩ:</strong> ${escapeHtml(comic.artist)}</p>
        <p class="text-secondary mb-2"><i class="bi bi-eye"></i> <strong>Lượt xem:</strong> ${formatViews(comic.views)}</p>
        <p class="text-secondary mt-3">${escapeHtml(comic.description)}</p>
        
        <div class="d-flex flex-wrap gap-2 mt-3">
          ${readButtonHTML}
          ${followButtonHTML}
        </div>
      </div>
    </div>
  `;
}

/** @private */
function _renderChapterList(chapters, comic, user, purchases, cart) {
  const itemsHTML = chapters.map(chapter => {
    const isFree = !chapter.price || chapter.price <= 0;
    const isUploader = user && comic.uploaderId === user.id;
    const isAdmin = Auth.isAdmin();
    const isPurchased = purchases.some(p => p.chapterId === chapter.id);
    const isOwned = isFree || isUploader || isAdmin || isPurchased;
    const inCart = cart.some(c => c.chapterId === chapter.id);

    if (isOwned) {
      return `
        <a href="reader.html?id=${chapter.id}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 bg-surface border-color text-primary">
          <span><i class="bi bi-book text-success me-2"></i> Chương ${chapter.chapterNumber}${chapter.title ? ': ' + escapeHtml(chapter.title) : ''}</span>
          <div class="d-flex align-items-center gap-2">
            ${isFree ? '<span class="badge bg-secondary-subtle text-secondary small border">Miễn phí</span>' : '<span class="badge bg-success-subtle text-success small border">Đã sở hữu</span>'}
            <small class="text-muted">${timeAgo(chapter.createdAt)}</small>
          </div>
        </a>
      `;
    } else {
      const price = chapter.price || CONFIG.DEFAULTS.CHAPTER_PRICE;
      return `
        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 bg-surface border-color text-primary cursor-pointer"
             onclick="openChapterPurchaseModal(${chapter.id}, ${chapter.chapterNumber}, ${price})">
          <span class="text-secondary"><i class="bi bi-lock-fill text-danger me-2"></i> Chương ${chapter.chapterNumber}</span>
          <div class="d-flex align-items-center gap-2">
            ${inCart 
              ? '<span class="badge bg-warning-subtle text-warning small border"><i class="bi bi-cart-check"></i> Đã có trong giỏ</span>'
              : `<span class="badge bg-danger-subtle text-danger small border"><i class="bi bi-coin"></i> ${price} Xu</span>`
            }
            <small class="text-muted">${timeAgo(chapter.createdAt)}</small>
          </div>
        </div>
      `;
    }
  }).join('');

  return `
    <div class="mt-5">
      <h3 class="font-heading border-start border-primary border-4 ps-3">
        Danh sách chương (${chapters.length})
      </h3>
      <div class="list-group mt-3">
        ${itemsHTML || '<p class="text-muted">Chưa có chương nào được cập nhật.</p>'}
      </div>
    </div>
  `;
}

/** @private */
function _renderCommentSection(comicId, comments, user) {
  const commentListHTML = comments.length > 0
    ? comments.map(comment => {
        const isOwner = user && (user.id === comment.userId || Auth.isAdmin());
        const avatarSrc = comment.userAvatar || '../' + CONFIG.DEFAULTS.PLACEHOLDER_IMAGE;
        return `
          <div class="p-3 rounded bg-surface border mb-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="d-flex align-items-center gap-2">
                <img src="${avatarSrc}" class="rounded-circle border" style="width:32px; height:32px; object-fit:cover;" onerror="this.src='../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
                <div>
                  <strong class="text-primary small">${escapeHtml(comment.userDisplayName)}</strong>
                  <span class="text-muted smaller ms-2">${timeAgo(comment.createdAt)}</span>
                </div>
              </div>
              ${isOwner ? `<button onclick="handleDeleteComment(${comment.id})" class="btn btn-sm text-danger p-0 bg-transparent border-0" title="Xoá bình luận"><i class="bi bi-trash"></i></button>` : ''}
            </div>
            <p class="mb-0 text-secondary ps-5" style="font-size:0.95rem; white-space:pre-wrap;">${escapeHtml(comment.content)}</p>
          </div>
        `;
      }).join('')
    : '<p class="text-muted text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm xúc!</p>';

  const inputHTML = user
    ? `
      <div class="d-flex align-items-start gap-3">
        <img src="${user.avatar || '../' + CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}" class="rounded-circle border border-primary" style="width:40px; height:40px; object-fit:cover;" onerror="this.src='../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
        <div class="flex-grow-1">
          <textarea id="comment-textarea" class="cw-form-input w-100 mb-2" rows="3" placeholder="Nhập bình luận của bạn tại đây..."></textarea>
          <div class="text-end">
            <button onclick="handlePostComment(${comicId})" class="btn btn-cw-primary btn-sm px-4">Gửi bình luận</button>
          </div>
        </div>
      </div>
    `
    : `
      <div class="text-center py-3 text-secondary">
        <i class="bi bi-chat-left-dots fs-4"></i>
        <p class="mt-2 mb-0">Bạn cần <a href="login.html" class="text-danger fw-semibold">Đăng nhập</a> để tham gia bình luận.</p>
      </div>
    `;

  return `
    <div class="mt-5 border-top pt-4">
      <h3 class="font-heading border-start border-primary border-4 ps-3 mb-4">
        Bình luận (${comments.length})
      </h3>
      <div class="p-3 rounded mb-4 bg-card border">
        ${inputHTML}
      </div>
      <div class="comment-list">
        ${commentListHTML}
      </div>
    </div>
  `;
}

/** @private */
function _renderErrorMessage(message) {
  document.getElementById('comic-detail-content').innerHTML = `
    <p class="text-center text-danger py-5">${message}</p>
  `;
}

/** @private */
function _renderPendingMessage() {
  document.getElementById('comic-detail-content').innerHTML = `
    <div class="text-center py-5">
      <div class="text-warning mb-3 fs-1"><i class="bi bi-hourglass-split"></i></div>
      <h4>Truyện đang chờ duyệt</h4>
      <p class="text-secondary">Bộ truyện này đang chờ quản trị viên phê duyệt.</p>
      <a href="../index.html" class="btn btn-cw-primary mt-3">Về trang chủ</a>
    </div>
  `;
}

/* ─── Hành động trên trang ───────────────────────────────────────────────── */

/**
 * Theo dõi một bộ truyện.
 */
async function handleFollow(comicId) {
  const user = Auth.getCurrentUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để theo dõi truyện', 'warning');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  try {
    await addBookmark(user.id, comicId);
    showToast('Đã theo dõi truyện thành công!', 'success');
    initComicDetail();
  } catch (error) {
    showToast('Không thể theo dõi truyện lúc này.', 'error');
  }
}

/**
 * Huỷ theo dõi một bộ truyện.
 */
async function handleUnfollow(bookmarkId) {
  try {
    await removeBookmark(bookmarkId);
    showToast('Đã huỷ theo dõi truyện.', 'info');
    initComicDetail();
  } catch (error) {
    showToast('Không thể huỷ theo dõi.', 'error');
  }
}

/**
 * Mở modal mua chương truyện.
 */
function openChapterPurchaseModal(chapterId, chapterNumber, price) {
  const user = Auth.getCurrentUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để mua chương truyện', 'warning');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  const oldModal = document.getElementById('chapterPurchaseModal');
  if (oldModal) oldModal.remove();

  const userCoins = user.coins || 0;
  const modalHTML = `
    <div class="modal fade" id="chapterPurchaseModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-card border text-primary">
          <div class="modal-header border-bottom">
            <h5 class="modal-title font-heading text-uppercase">
              <i class="bi bi-lock-fill text-danger"></i> Mở khoá chương truyện
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center py-4">
            <h6 class="text-secondary mb-3">Chương ${chapterNumber}</h6>
            <p class="mb-4">Chương này đang khoá. Bạn cần mua để đọc.</p>
            
            <div class="d-flex justify-content-around align-items-center p-3 rounded mb-4 bg-surface border">
              <div>
                <small class="text-secondary d-block">Giá mở khoá</small>
                <strong class="text-danger fs-4"><i class="bi bi-coin text-warning"></i> ${price} Xu</strong>
              </div>
              <div class="border-start" style="height: 40px;"></div>
              <div>
                <small class="text-secondary d-block">Xu hiện có</small>
                <strong class="text-success fs-4"><i class="bi bi-coin text-warning"></i> ${userCoins} Xu</strong>
              </div>
            </div>

            <div class="d-flex flex-column gap-2">
              <button onclick="handleQuickBuy(${chapterId}, ${price})" class="btn btn-cw-primary w-100">
                <i class="bi bi-unlock-fill"></i> Mua ngay (${price} Xu)
              </button>
              <button onclick="handleAddToCart(${chapterId}, ${price})" class="btn btn-cw-outline w-100">
                <i class="bi bi-cart-plus"></i> Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const modal = new bootstrap.Modal(document.getElementById('chapterPurchaseModal'));
  modal.show();
}

/**
 * Xử lý mua nhanh từ modal.
 */
async function handleQuickBuy(chapterId, price) {
  const user = Auth.getCurrentUser();
  if (!user) return;

  const currentCoins = user.coins || 0;
  if (currentCoins < price) {
    showToast('Tài khoản của bạn không đủ xu. Vui lòng nạp thêm!', 'error');
    bootstrap.Modal.getInstance(document.getElementById('chapterPurchaseModal')).hide();
    return;
  }

  try {
    const comicId = getQueryParam('id');
    const newCoins = currentCoins - price;
    
    await updateUserCoins(user.id, newCoins);
    await createPurchase(user.id, parseInt(comicId), chapterId, price);

    showToast('Mua chương thành công! Đang chuyển hướng...', 'success');
    bootstrap.Modal.getInstance(document.getElementById('chapterPurchaseModal')).hide();
    
    setTimeout(() => {
      window.location.href = `reader.html?id=${chapterId}`;
    }, 1000);
  } catch (error) {
    showToast('Giao dịch thất bại. Vui lòng thử lại!', 'error');
  }
}

/**
 * Xử lý thêm vào giỏ hàng từ modal.
 */
async function handleAddToCart(chapterId, price) {
  const user = Auth.getCurrentUser();
  if (!user) return;

  try {
    const comicId = getQueryParam('id');
    await addToCart(user.id, parseInt(comicId), chapterId, price);
    showToast('Đã thêm chương truyện vào giỏ hàng!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('chapterPurchaseModal')).hide();
    
    initComicDetail();
  } catch (error) {
    showToast('Lỗi khi thêm vào giỏ hàng.', 'error');
  }
}

/**
 * Xử lý gửi bình luận.
 */
async function handlePostComment(comicId) {
  const textarea = document.getElementById('comment-textarea');
  if (!textarea) return;
  
  const content = textarea.value.trim();
  if (!content) {
    showToast('Nội dung bình luận không được trống!', 'warning');
    return;
  }

  try {
    await addComment(comicId, content);
    showToast('Đăng bình luận thành công!', 'success');
    initComicDetail();
  } catch (error) {
    showToast('Không thể gửi bình luận.', 'error');
  }
}

/**
 * Xử lý xoá bình luận.
 */
async function handleDeleteComment(commentId) {
  if (!confirm('Bạn có chắc muốn xoá bình luận này?')) return;

  try {
    await deleteComment(commentId);
    showToast('Đã xoá bình luận.', 'info');
    initComicDetail();
  } catch (error) {
    showToast('Không thể xoá bình luận.', 'error');
  }
}
