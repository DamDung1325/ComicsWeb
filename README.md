# 📚 ComicsWeb — Website Đọc Truyện Tranh

Website đọc truyện tranh trực tuyến sử dụng **Vanilla JavaScript**, **Bootstrap 5**, và **json-server-auth**.

## 🏗️ Cấu trúc thư mục

```
ComicsWeb/
├── backend/
│   ├── db.json          # Cơ sở dữ liệu JSON
│   ├── package.json     # Dependencies
│   └── server.js        # json-server-auth entry point
│
├── frontend/
│   ├── index.html       # Trang chủ
│   ├── css/style.css    # Design system
│   ├── js/
│   │   ├── config.js    # Cấu hình chung
│   │   ├── api.js       # Fetch wrapper + CRUD
│   │   ├── auth.js      # Đăng nhập/Đăng ký/JWT
│   │   ├── utils.js     # Helper functions
│   │   ├── components.js# Navbar + Footer
│   │   ├── home.js      # Logic trang chủ
│   │   ├── comic-detail.js
│   │   ├── reader.js
│   │   ├── search.js
│   │   └── admin.js
│   ├── pages/
│   │   ├── comic-detail.html
│   │   ├── reader.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── search.html
│   │   └── admin/dashboard.html
│   └── assets/images/
│
└── README.md
```

## 🚀 Cài đặt & Chạy

### 1. Cài đặt Backend
```bash
cd backend
npm install
```

### 2. Chạy Backend (API server)
```bash
npm start
# Server chạy tại http://localhost:3001
```

### 3. Chạy Frontend
Mở `frontend/index.html` bằng **Live Server** (VS Code extension) hoặc bất kỳ HTTP server nào.

## 📤 Hướng dẫn Push Code lên GitHub

Để đưa toàn bộ mã nguồn dự án này lên kho lưu trữ GitHub của bạn tại [duy1sme/ComicsWeb](https://github.com/duy1sme/ComicsWeb), hãy mở terminal tại thư mục gốc của dự án (`ComicsWeb-main`) và chạy tuần tự các lệnh sau:

### 1. Khởi tạo Git local repository
```bash
git init
```

### 2. Thêm tất cả các file vào hàng đợi kiểm soát (Staging)
*(Lưu ý: Thư mục `node_modules` đã được cấu hình ẩn trong `.gitignore` nên sẽ tự động được bỏ qua, không bị đẩy lên GitHub)*
```bash
git add .
```

### 3. Ghi nhận commit đầu tiên
```bash
git commit -m "Initial commit - ComicsWeb project code"
```

### 4. Đổi tên nhánh mặc định thành `main`
```bash
git branch -M main
```

### 5. Liên kết repository trên máy với repository trên GitHub
```bash
git remote add origin https://github.com/duy1sme/ComicsWeb.git
```

### 6. Đẩy code lên GitHub (Push)

* **Trường hợp A: Kho lưu trữ trên GitHub của bạn trống (chưa tạo file README, LICENSE...)**
  ```bash
  git push -u origin main
  ```

* **Trường hợp B: Kho lưu trữ trên GitHub đã được tạo sẵn file (ví dụ có file README.md hoặc LICENSE khác)**
  Để tránh lỗi xung đột lịch sử commit (`non-fast-forward`), hãy chạy lệnh gộp nhánh dưới đây trước khi push:
  ```bash
  git pull origin main --rebase
  git push -u origin main
  ```
  *(Hoặc nếu bạn muốn ghi đè hoàn toàn kho lưu trữ trên GitHub bằng code dưới máy cục bộ, chạy lệnh force push: `git push -u origin main --force`)*


## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/register` | Đăng ký tài khoản |
| POST | `/login` | Đăng nhập → JWT |
| GET | `/comics` | Danh sách truyện |
| GET | `/comics/:id` | Chi tiết truyện |
| GET | `/chapters?comicId=X` | Chương theo truyện |
| GET | `/genres` | Thể loại |
| GET/POST | `/bookmarks` | Đánh dấu truyện |

## 🎨 Thiết kế

- Lấy cảm hứng từ [Marvel.com/comics](https://www.marvel.com/comics)
- Dark theme, accent đỏ `#E62429`
- Font: Roboto Condensed (heading) + Inter (body)
- Responsive mobile-first

## 👥 Tài khoản mẫu

- **Admin:** `admin@comicsweb.vn` (cần đăng ký lại vì password trong db.json là placeholder)

## 📝 License

MIT
