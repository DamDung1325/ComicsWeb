# ComicsWeb — Walkthrough

## Tổng quan

Đã hoàn thành xây dựng **bộ khung xương (project skeleton)** cho website đọc truyện tranh, bao gồm cấu trúc thư mục, tất cả file dùng chung, hợp đồng dữ liệu, và page templates.

## Cấu trúc thư mục cuối cùng

```
ComicsWeb/
├── README.md
├── backend/
│   ├── package.json          # json-server@0.17.4 + json-server-auth@2.1.0
│   ├── server.js             # Entry point, CORS, route protection
│   └── db.json               # 6 truyện, 11 chương, 8 thể loại, bookmarks, history
│
└── frontend/
    ├── index.html            # Trang chủ (hero + featured + latest)
    ├── css/
    │   └── style.css         # Design system — 400+ dòng CSS
    ├── js/
    │   ├── config.js         # API_BASE_URL, JWT keys
    │   ├── api.js            # fetchAPI() wrapper + CRUD cho mọi resource
    │   ├── auth.js           # Auth.login(), register(), logout(), isAdmin()
    │   ├── utils.js          # formatDate, timeAgo, renderStars, showToast, renderComicCard
    │   ├── components.js     # Navbar + Footer injection (path-aware, auth-aware)
    │   ├── home.js           # Featured comics + latest updates
    │   ├── comic-detail.js   # Chi tiết truyện + danh sách chương
    │   ├── reader.js         # Hiển thị ảnh chương + prev/next navigation
    │   ├── search.js         # Tìm kiếm + lọc thể loại với debounce
    │   └── admin.js          # Dashboard stats + comic management table
    ├── pages/
    │   ├── comic-detail.html
    │   ├── reader.html
    │   ├── login.html        # Form đăng nhập + error handling
    │   ├── register.html     # Form đăng ký + password confirm
    │   ├── search.html       # Search bar + genre filters + results grid
    │   └── admin/
    │       └── dashboard.html
    └── assets/
        └── images/
            └── placeholder.svg
```

## Thiết kế (Marvel-inspired)

| Yếu tố | Giá trị |
|---------|---------|
| Primary color | `#E62429` (đỏ Marvel) |
| Background | `#0A0A0A` (dark mode) |
| Card bg | `#181818` |
| Font heading | Roboto Condensed (bold, uppercase) |
| Font body | Inter |
| Accent | `#FFD700` (rating stars) |

## Hợp đồng dữ liệu (db.json)

| Bảng | Mô tả | Số bản ghi mẫu |
|------|--------|-----------------|
| `users` | Tài khoản user/admin | 1 |
| `comics` | Thông tin truyện | 6 |
| `chapters` | Chương truyện + danh sách trang | 11 |
| `genres` | Thể loại | 8 |
| `bookmarks` | Đánh dấu yêu thích | 1 |
| `readingHistory` | Lịch sử đọc | 1 |

## Cách chạy

```bash
# 1. Backend
cd backend && npm install && npm start
# → http://localhost:3001

# 2. Frontend
# Mở frontend/index.html bằng Live Server (VS Code)
```

> **Lưu ý:** Máy hiện tại chưa có Node.js trong PATH. Cần cài Node.js trước khi chạy backend.
