/**
 * ComicsWeb — Shared Components
 * Inject Navbar + Footer vào mọi trang
 *
 * Sử dụng: gọi initComponents() trong DOMContentLoaded
 */

/**
 * Khởi tạo navbar và footer
 * @param {string} activePage - Tên trang hiện tại ('home', 'search', 'login', 'admin')
 */
function initComponents(activePage = '') {
  renderNavbar(activePage);
  renderFooter();
}

/**
 * Xác định đường dẫn tương đối về root frontend
 * (tuỳ thuộc file html nằm ở cấp nào)
 */
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/pages/admin/')) return '../../';
  if (path.includes('/pages/')) return '../';
  return './';
}

function renderNavbar(activePage) {
  const base = getBasePath();
  const user = Auth.getCurrentUser();
  const isLogged = Auth.isLoggedIn();
  const isAdmin = Auth.isAdmin();

  const activeClass = (page) => activePage === page ? 'active' : '';

  const authButtons = isLogged
    ? `
      <div class="d-flex align-items-center gap-2">
        ${isAdmin ? `<a href="${base}pages/admin/dashboard.html" class="btn btn-sm btn-cw-outline">
          <i class="bi bi-speedometer2"></i> Quản trị
        </a>` : ''}
        <span class="text-secondary small d-none d-md-inline">
          <i class="bi bi-person-circle"></i> ${user?.displayName || user?.email || ''}
        </span>
        <button onclick="Auth.logout(); location.reload();" class="btn btn-sm btn-cw-primary">
          <i class="bi bi-box-arrow-right"></i> Đăng xuất
        </button>
      </div>
    `
    : `
      <div class="d-flex gap-2">
        <a href="${base}pages/login.html" class="btn btn-sm btn-cw-outline">Đăng nhập</a>
        <a href="${base}pages/register.html" class="btn btn-sm btn-cw-primary">Đăng ký</a>
      </div>
    `;

  const navHTML = `
    <nav class="navbar navbar-expand-lg cw-navbar" id="mainNavbar">
      <div class="container">
        <a class="navbar-brand" href="${base}index.html">
          Comics<span>Web</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link ${activeClass('home')}" href="${base}index.html">
                <i class="bi bi-house-door"></i> Trang chủ
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activeClass('search')}" href="${base}pages/search.html">
                <i class="bi bi-search"></i> Tìm kiếm
              </a>
            </li>
          </ul>
          ${authButtons}
        </div>
      </div>
    </nav>
  `;

  // Insert navbar at the beginning of body
  document.body.insertAdjacentHTML('afterbegin', navHTML);
}

function renderFooter() {
  const base = getBasePath();
  const year = new Date().getFullYear();

  const footerHTML = `
    <footer class="cw-footer" id="mainFooter">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="cw-footer__brand">Comics<span>Web</span></div>
            <p class="cw-footer__text mt-2">
              Website đọc truyện tranh trực tuyến miễn phí.
              Cập nhật nhanh nhất, chất lượng cao nhất.
            </p>
          </div>
          <div class="col-6 col-lg-2">
            <h6 class="cw-footer__heading">Điều hướng</h6>
            <ul class="cw-footer__links">
              <li><a href="${base}index.html">Trang chủ</a></li>
              <li><a href="${base}pages/search.html">Tìm kiếm</a></li>
              <li><a href="#">Thể loại</a></li>
            </ul>
          </div>
          <div class="col-6 col-lg-2">
            <h6 class="cw-footer__heading">Thể loại</h6>
            <ul class="cw-footer__links">
              <li><a href="#">Hành Động</a></li>
              <li><a href="#">Phiêu Lưu</a></li>
              <li><a href="#">Lãng Mạn</a></li>
              <li><a href="#">Giả Tưởng</a></li>
            </ul>
          </div>
          <div class="col-lg-4">
            <h6 class="cw-footer__heading">Liên hệ</h6>
            <ul class="cw-footer__links">
              <li><i class="bi bi-envelope"></i> contact@comicsweb.vn</li>
              <li><i class="bi bi-facebook"></i> ComicsWeb Vietnam</li>
            </ul>
          </div>
        </div>
        <div class="cw-footer__bottom">
          © ${year} ComicsWeb. Được xây dựng với ❤️
        </div>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
}
