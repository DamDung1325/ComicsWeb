/**
 * ComicsWeb — Utility Functions
 */

/**
 * Định dạng ngày theo kiểu Việt Nam
 * @param {string} isoString - ISO date string
 * @returns {string} vd: "10/05/2026"
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Định dạng ngày tương đối (vd: "2 giờ trước")
 * @param {string} isoString
 * @returns {string}
 */
function timeAgo(isoString) {
  const now = Date.now();
  const diff = now - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return formatDate(isoString);
}

/**
 * Cắt ngắn text
 */
function truncateText(text, maxLen = 100) {
  if (!text || text.length <= maxLen) return text;
  return text.substring(0, maxLen).trim() + '...';
}

/**
 * Tạo slug từ tiếng Việt
 */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Format lượt xem (vd: 125000 → "125K")
 */
function formatViews(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Render rating stars HTML
 * @param {number} rating - 0 đến 5
 * @returns {string} HTML
 */
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      html += '<i class="bi bi-star-fill cw-rating__star"></i>';
    } else if (i - 0.5 <= rating) {
      html += '<i class="bi bi-star-half cw-rating__star"></i>';
    } else {
      html += '<i class="bi bi-star cw-rating__star--empty"></i>';
    }
  }
  html += `<span class="cw-rating__value">${rating.toFixed(1)}</span>`;
  return html;
}

/**
 * Hiển thị toast notification
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
  }, 3000);
}

/**
 * Debounce function
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Lấy query parameter từ URL
 */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Render HTML cho 1 comic card
 */
function renderComicCard(comic, index = 0) {
  const statusBadge = comic.status === 'completed'
    ? '<span class="cw-comic-card__badge cw-comic-card__badge--completed">Hoàn thành</span>'
    : '<span class="cw-comic-card__badge">Đang ra</span>';

  const genreTags = (comic.genres || [])
    .slice(0, 3)
    .map(g => `<span class="cw-genre-tag">${g}</span>`)
    .join('');

  return `
    <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-4 anim-slide-up anim-delay-${(index % 4) + 1}">
      <a href="pages/comic-detail.html?id=${comic.id}" class="text-decoration-none">
        <div class="cw-comic-card">
          <div class="cw-comic-card__cover">
            <img src="${comic.coverImage}" alt="${comic.title}"
                 onerror="this.src='assets/images/placeholder.svg'">
            ${statusBadge}
          </div>
          <div class="cw-comic-card__body">
            <h5 class="cw-comic-card__title">${comic.title}</h5>
            <p class="cw-comic-card__meta">
              <i class="bi bi-eye"></i> ${formatViews(comic.views)}
              &nbsp;·&nbsp;
              <i class="bi bi-book"></i> ${comic.totalChapters || '?'} chương
            </p>
            <div class="cw-comic-card__genres">${genreTags}</div>
          </div>
        </div>
      </a>
    </div>
  `;
}
