/**
 * TLUTRUYEN — Module Xác thực
 * Xử lý đăng nhập, đăng ký và quản lý phiên làm việc của người dùng.
 */

const Auth = {
  
  /* ─── Quản lý phiên làm việc ────────────────────────────────────────── */

  /**
   * Đăng nhập người dùng bằng email và mật khẩu.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} Dữ liệu xác thực (accessToken, user).
   */
  async login(email, password) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData || 'Email hoặc mật khẩu không chính xác');
    }

    const data = await response.json();
    this._saveSession(data.accessToken, data.user);
    return data;
  },

  /**
   * Đăng ký tài khoản người dùng mới.
   * @param {string} email
   * @param {string} password
   * @param {string} displayName
   * @returns {Promise<object>} Dữ liệu xác thực (accessToken, user).
   */
  async register(email, password, displayName = '') {
    const payload = {
      email,
      password,
      displayName: displayName || email.split('@')[0],
      role: 'user',
      avatar: '',
      coins: 100, // Thưởng đăng ký ban đầu
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${CONFIG.API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData || 'Đăng ký tài khoản thất bại');
    }

    const data = await response.json();
    this._saveSession(data.accessToken, data.user);
    return data;
  },

  /**
   * Xóa phiên làm việc hiện tại và đăng xuất.
   */
  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.JWT_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
  },

  /* ─── Trợ giúp Trạng thái ────────────────────────────────────────────── */

  /**
   * Lấy dữ liệu người dùng hiện đang đăng nhập.
   * @returns {object|null}
   */
  getCurrentUser() {
    const rawData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    return rawData ? JSON.parse(rawData) : null;
  },

  /**
   * Kiểm tra xem phiên làm việc của người dùng có tồn tại không.
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!this.getToken();
  },

  /**
   * Kiểm tra xem người dùng hiện tại có đặc quyền quản trị không.
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  /**
   * Lấy mã thông báo JWT hiện tại.
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.JWT_TOKEN);
  },

  /* ─── Trợ giúp Riêng tư ───────────────────────────────────────────── */

  /**
   * Lưu dữ liệu phiên làm việc vào localStorage.
   * @private
   */
  _saveSession(token, user) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.JWT_TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }
};
