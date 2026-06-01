/**
 * TLUTRUYEN — Module Hàm tiện ích
 * Chứa các hàm hỗ trợ thuần túy để định dạng, kiểm tra và các tiện ích chung.
 */

/* ─── Tiện ích Ngày tháng & Thời gian ────────────────────────────────────────── */

/**
 * Định dạng chuỗi ngày tháng sang kiểu Việt Nam (DD/MM/YYYY).
 * @param {string} isoString - Chuỗi ngày ISO.
 * @returns {string} Ngày đã định dạng.
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

/**
 * Định dạng ngày tháng sang chuỗi thời gian tương đối (vd: "2 giờ trước").
 * @param {string} isoString - Chuỗi ngày ISO.
 * @returns {string} Chuỗi thời gian tương đối.
 */
function timeAgo(isoString) {
  if (!isoString) return '';
  
  const now = Date.now();
  const past = new Date(isoString).getTime();
  const diffInMs = now - past;
  const diffInMinutes = Math.floor(diffInMs / 60000);

  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  
  return formatDate(isoString);
}

/* ─── Tiện ích Chuỗi ────────────────────────────────────────────── */

/**
 * Cắt ngắn văn bản theo độ dài tối đa.
 * @param {string} text - Văn bản cần cắt.
 * @param {number} maxLength - Độ dài tối đa (mặc định 100).
 * @returns {string} Văn bản đã cắt.
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Chuyển đổi văn bản tiếng Việt sang dạng slug thân thiện với URL.
 * @param {string} text - Văn bản cần chuyển đổi.
 * @returns {string} Chuỗi slug.
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Thoát các ký tự đặc biệt HTML để ngăn chặn XSS.
 * @param {string} text - Văn bản không an toàn.
 * @returns {string} Văn bản an toàn.
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/* ─── Tiện ích Số ────────────────────────────────────────────── */

/**
 * Định dạng số lượt xem (vd: 125000 -> "125.0K").
 * @param {number} count - Số lượt xem.
 * @returns {string} Số đã định dạng.
 */
function formatViews(count) {
  if (!count) return '0';
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}

/* ─── Tiện ích URL ───────────────────────────────────────────────── */

/**
 * Lấy tham số truy vấn từ URL hiện tại.
 * @param {string} name - Tên tham số.
 * @returns {string|null} Giá trị tham số.
 */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Xác định đường dẫn cơ sở tương đối với thư mục gốc frontend.
 * @returns {string} Đường dẫn cơ sở (vd: "../", "./").
 */
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/pages/admin/')) return '../../';
  if (path.includes('/pages/')) return '../';
  return './';
}

/* ─── Tiện ích Hình ảnh ────────────────────────────────────────────── */

/**
 * Lấy URL nguồn cho ảnh bìa truyện.
 * @param {string} coverImage - Đường dẫn hoặc URL ảnh.
 * @param {string} relativePath - Đường dẫn cơ sở để thêm vào trước.
 * @returns {string} URL nguồn ảnh.
 */
function getComicImageSrc(coverImage, relativePath = '') {
  if (!coverImage) return relativePath + CONFIG.DEFAULTS.PLACEHOLDER_IMAGE;
  
  const isExternal = coverImage.startsWith('data:image/') || 
                     coverImage.startsWith('http://') || 
                     coverImage.startsWith('https://');
                     
  return isExternal ? coverImage : relativePath + coverImage;
}

/* ─── Hỗ trợ UI ──────────────────────────────────────────────────── */

/**
 * Hiển thị thông báo toast.
 * @param {string} message - Nội dung thông báo.
 * @param {string} type - Loại toast ('info', 'success', 'warning', 'error').
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('cw-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'cw-toast-container';
    container.className = 'cw-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `cw-toast cw-toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, CONFIG.TOAST_DURATION);
}

/**
 * Chống rung (Debounce) cuộc gọi hàm.
 * @param {Function} fn - Hàm cần chống rung.
 * @param {number} delay - Thời gian trễ tính bằng ms.
 * @returns {Function} Hàm đã được chống rung.
 */
function debounce(fn, delay = CONFIG.DEBOUNCE_DELAY) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Hiển thị HTML các ngôi sao đánh giá.
 * @param {number} rating - Đánh giá từ 0 đến 5.
 * @returns {string} Chuỗi HTML.
 */
function renderStars(rating) {
  const validRating = (rating && !isNaN(rating)) ? rating : 0;
  let html = '';
  
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(validRating)) {
      html += '<i class="bi bi-star-fill cw-rating__star"></i>';
    } else if (i - 0.5 <= validRating) {
      html += '<i class="bi bi-star-half cw-rating__star"></i>';
    } else {
      html += '<i class="bi bi-star cw-rating__star--empty"></i>';
    }
  }
  
  html += `<span class="cw-rating__value">${validRating.toFixed(1)}</span>`;
  return html;
}
