# 📚 TLUTRUYEN — Nền Tảng Đọc Truyện Tranh Trực Tuyến

**TLUTRUYEN** là một ứng dụng web hiện đại cho phép người dùng khám phá, theo dõi và đọc truyện tranh trực tuyến. Dự án được xây dựng với kiến trúc hướng mô-đun, dễ dàng bảo trì và mở rộng, cung cấp trải nghiệm mượt mà cho cả người đọc và quản trị viên.

---

## ✨ Tính năng chính

### 👤 Dành cho người dùng (Frontend)
- **Trang chủ:** Hiển thị truyện nổi bật (Top Views) và truyện mới cập nhật.
- **Tìm kiếm & Lọc:** Tìm kiếm truyện theo tên, tác giả và lọc theo thể loại.
- **Chi tiết truyện:** Xem thông tin, danh sách chương, theo dõi truyện và bình luận.
- **Trình đọc truyện:** Hỗ trợ đọc chương miễn phí và chương khóa (mua bằng xu). Điều hướng chương trước/sau dễ dàng.
- **Hồ sơ cá nhân:** 
    - Quản lý lịch sử đọc truyện và lịch sử mua chương.
    - Giỏ hàng linh hoạt cho phép mua nhiều chương cùng lúc.
    - Chỉnh sửa thông tin cá nhân và thay đổi ảnh đại diện (Upload/URL).
    - Nạp xu ảo để trải nghiệm các chương trả phí.
    - Đăng truyện người dùng (cần Admin phê duyệt).

### 🛠 Dành cho Quản trị viên (Admin Panel)
- **Thống kê:** Tổng quan về số lượng truyện, lượt xem và các đầu truyện chờ duyệt.
- **Quản lý truyện:** CRUD (Thêm, sửa, xóa) truyện và quản lý từng chương truyện cụ thể.
- **Phê duyệt:** Hệ thống duyệt truyện do người dùng đăng tải.
- **Quản lý tài khoản:** Quản lý danh sách người dùng, thay đổi vai trò hoặc khóa tài khoản.

---

## 🚀 Công nghệ sử dụng

### Frontend
- **Ngôn ngữ:** JavaScript (ES6+ Vanilla JS) theo cấu trúc mô-đun.
- **Giao diện:** HTML5, CSS3 (Custom Variables), Bootstrap 5.
- **Icon:** Bootstrap Icons.
- **Xử lý bất đồng bộ:** Fetch API kết hợp `async/await`.

### Backend (Mock API)
- **Nền tảng:** Node.js.
- **Server:** `json-server` (giả lập RESTful API).
- **Xác thực:** `json-server-auth` (Xử lý JWT, Login, Register).
- **Tiện ích:** `bcryptjs` (mã hóa mật khẩu), `body-parser` (xử lý payload lớn cho ảnh base64).

---

## 📁 Cấu trúc dự án

```text
TLUTRUYEN/
├── backend/                # Server & Database giả lập
│   ├── db.json             # Cơ sở dữ liệu JSON
│   ├── server.js           # Logic server & Upload media
│   └── package.json
└── frontend/               # Giao diện người dùng
    ├── assets/             # Hình ảnh, placeholder
    ├── css/                # Stylesheet chính
    ├── js/                 # Logic JavaScript (Mô-đun hóa)
    │   ├── api.js          # Kết nối API
    │   ├── auth.js         # Xử lý phiên đăng nhập
    │   ├── components.js   # Thành phần UI dùng chung
    │   └── config.js       # Cấu hình tập trung
    └── pages/              # Các trang HTML
```

---

## 🛠 Hướng dẫn chạy dự án

### 1. Cài đặt môi trường
Đảm bảo máy tính của bạn đã cài đặt [Node.js](https://nodejs.org/).

### 2. Cài đặt thư viện (Backend)
Mở terminal tại thư mục gốc của dự án:
```bash
cd backend
npm install
```

### 3. Khởi chạy Server
Chạy lệnh sau để khởi động API Server:
```bash
npm start
```
*Mặc định server sẽ chạy tại: `http://localhost:3001`*

### 4. Truy cập Frontend
Bạn có thể mở tệp `frontend/index.html` trực tiếp bằng trình duyệt hoặc sử dụng extension **Live Server** trên VS Code để có trải nghiệm tốt nhất.

---

## 📝 Lưu ý về dữ liệu & Bảo mật
- **Database:** Mọi thay đổi về truyện, người dùng sẽ được lưu trực tiếp vào tệp `backend/db.json`.
- **Ảnh Media:** Khi thêm truyện hoặc chương mới, ảnh sẽ được server lưu vật lý vào thư mục `frontend/assets/images/`.
- **Tài khoản Admin:**
    - **Email:** `admin@tlutruyen.vn`
    - **Mật khẩu:** `123456`

---

## 🛠 Quy chuẩn mã nguồn (Refactoring Standards)
Dự án đã được tái cấu trúc (Refactored) để đạt tiêu chuẩn sản xuất:
- **Modularization:** Tách biệt hoàn toàn logic API, UI và Utilities.
- **Clean Code:** Chú thích tiếng Việt đầy đủ, tên biến rõ ràng, không trùng lặp code.
- **Security:** Kiểm tra quyền hạn tại cả Frontend và Backend (Middleware).

---
*Phát triển với ❤️ bởi TLUTRUYEN Team.*
