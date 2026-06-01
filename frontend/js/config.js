/**
 * TLUTRUYEN — Module Cấu hình
 * Chứa các thiết lập tập trung cho toàn bộ ứng dụng.
 */

const CONFIG = {
  // Đường dẫn API cơ bản
  API_BASE_URL: 'http://localhost:3001',
  
  // Phân trang & Giới hạn
  ITEMS_PER_PAGE: 12,
  MAX_SEARCH_RESULTS: 50,
  
  // Các khóa lưu trữ LocalStorage
  STORAGE_KEYS: {
    JWT_TOKEN: 'tlutruyen_token',
    USER_DATA: 'tlutruyen_user',
    THEME: 'tlutruyen_theme',
  },
  
  // Giá trị mặc định
  DEFAULTS: {
    CHAPTER_PRICE: 10,
    RATING: 5,
    PLACEHOLDER_IMAGE: 'assets/images/placeholder.svg',
  },
  
  // Thiết lập giao diện người dùng
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
};

// Hỗ trợ mã nguồn cũ nếu cần, nhưng ưu tiên sử dụng CONFIG.STORAGE_KEYS
const JWT_KEY = CONFIG.STORAGE_KEYS.JWT_TOKEN;
const USER_KEY = CONFIG.STORAGE_KEYS.USER_DATA;
