/**
 * TLUTRUYEN Backend — Máy chủ API Giả lập
 * Được xây dựng với json-server, json-server-auth và express.
 * 
 * Tính năng:
 *  - Xác thực JWT
 *  - Tải lên phương tiện lưu trữ hệ thống tệp (Ảnh bìa, Chương truyện)
 *  - CRUD RESTful cho Truyện, Chương, Người dùng, v.v.
 */

const jsonServer = require('json-server');
const auth = require('json-server-auth');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, '..', 'frontend'),
});

/* ─── Cấu hình ──────────────────────────────────────────────── */

// Tăng giới hạn payload để nhận ảnh base64 lớn
server.use(bodyParser.json({ limit: '100mb' }));
server.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Chính sách CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Quy tắc Kiểm soát Truy cập (json-server-auth)
// 6 = Chủ sở hữu RW, 4 = Người dùng đã xác thực R, 0 = Công khai Không có
const authRules = auth.rewriter({
  comics: 664,
  chapters: 664,
  genres: 444,
  bookmarks: 660,
  readingHistory: 660,
  users: 660,
});

/* ─── Các điểm cuối Quản lý Phương tiện ──────────────────────────────────── */

/**
 * Điểm cuối: POST /api/upload-comic-media
 * Xử lý việc lưu vật lý các ảnh base64 vào thư mục assets.
 */
server.post('/api/upload-comic-media', (req, res) => {
  try {
    const { comicTitle, coverFile, chapterNumber, pages } = req.body;
    if (!comicTitle) return res.status(400).json({ message: 'Tên truyện là bắt buộc' });

    const dirName = _sanitizeDirName(comicTitle);
    const result = { coverImage: null, pages: [] };

    // 1. Xử lý Ảnh bìa
    if (coverFile?.base64) {
      const coverPath = _saveFile(
        path.join(__dirname, '..', 'frontend', 'assets', 'images', 'cover_images'),
        `${dirName}_cover${path.extname(coverFile.name) || '.jpg'}`,
        coverFile.base64
      );
      result.coverImage = coverPath.replace(/.*assets/, 'assets').replace(/\\/g, '/');
    }

    // 2. Xử lý các trang của Chương
    if (chapterNumber && pages?.length > 0) {
      const chapterDir = path.join(__dirname, '..', 'frontend', 'assets', 'images', 'Comics', dirName, `chapter_${chapterNumber}`);
      pages.forEach((page, index) => {
        if (page.base64) {
          const filePath = _saveFile(chapterDir, `page_${index + 1}${path.extname(page.name) || '.jpg'}`, page.base64);
          result.pages.push(filePath.replace(/.*assets/, 'assets').replace(/\\/g, '/'));
        }
      });
    }

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('[BACKEND] Lỗi tải lên:', error);
    return res.status(500).json({ message: 'Lỗi server khi lưu file media' });
  }
});

/**
 * Điểm cuối: POST /api/delete-file
 * Xử lý việc xóa các tài sản tĩnh.
 */
server.post('/api/delete-file', (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ message: 'Đường dẫn file là bắt buộc' });

    const fullPath = path.join(__dirname, '..', 'frontend', filePath);
    
    // Bảo mật: Chỉ cho phép xóa trong thư mục assets
    if (!path.normalize(fullPath).startsWith(path.normalize(path.join(__dirname, '..', 'frontend', 'assets')))) {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối' });
    }

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return res.status(200).json({ message: 'Đã xoá file thành công' });
    }
    return res.status(200).json({ message: 'File không tồn tại' });

  } catch (error) {
    console.error('[BACKEND] Lỗi xóa file:', error);
    return res.status(500).json({ message: 'Lỗi server khi xoá file' });
  }
});

/* ─── Ghi đè CRUD Tùy chỉnh ───────────────────────────────────────── */

/**
 * Ghi đè: POST /users
 * Tạo người dùng bảo mật cho bảng quản trị (mã hóa mật khẩu).
 */
server.post('/users', (req, res) => {
  const { email, password, displayName, username, role, status, avatar } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });

  const users = router.db.get('users');
  if (users.find({ email }).value()) return res.status(400).json({ message: 'Email đã tồn tại' });

  const allUsers = users.value();
  const nextId = allUsers.length ? Math.max(...allUsers.map(u => Number(u.id) || 0)) + 1 : 1;

  const newUser = {
    id: nextId,
    email,
    password: bcrypt.hashSync(password, 10),
    displayName: displayName || email.split('@')[0],
    username: username || email.split('@')[0],
    role: role || 'user',
    status: status || 'active',
    avatar: avatar || '',
    createdAt: req.body.createdAt || new Date().toISOString(),
  };

  users.push(newUser).write();
  const { password: _, ...safeUser } = newUser;
  return res.status(201).json(safeUser);
});

/**
 * Ghi đè: DELETE /comics/:id
 * Xóa sâu bao gồm cả các tài sản vật lý.
 */
server.delete('/comics/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const comics = router.db.get('comics');
  const comic = comics.find({ id }).value();

  if (!comic) return res.status(404).json({ message: 'Không tìm thấy truyện' });

  // 1. Dọn dẹp Ảnh bìa
  if (comic.coverImage) {
    const coverPath = path.join(__dirname, '..', 'frontend', comic.coverImage);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
  }

  // 2. Dọn dẹp Thư mục Chương
  const chapterDir = path.join(__dirname, '..', 'frontend', 'assets', 'images', 'Comics', _sanitizeDirName(comic.title));
  _removeDirRecursive(chapterDir);

  // 3. Xóa Bản ghi
  comics.remove({ id }).write();
  return res.status(200).json({ message: 'Đã xoá truyện và toàn bộ dữ liệu liên quan' });
});

/* ─── Trợ giúp Riêng tư ───────────────────────────────────────────── */

function _sanitizeDirName(title) {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
}

function _saveFile(dir, fileName, base64) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fullPath = path.join(dir, fileName);
  const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  fs.writeFileSync(fullPath, buffer);
  return fullPath;
}

function _removeDirRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  fs.readdirSync(dirPath).forEach(file => {
    const curPath = path.join(dirPath, file);
    if (fs.statSync(curPath).isDirectory()) _removeDirRecursive(curPath);
    else fs.unlinkSync(curPath);
  });
  fs.rmdirSync(dirPath);
}

/* ─── Khởi động Máy chủ ─────────────────────────────────────────────── */

// Bắt buộc phải gắn db của router vào server để json-server-auth hoạt động
server.db = router.db;
server.use(authRules);
server.use(middlewares);
server.use(auth);
server.use(router);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n  TLUTRUYEN API: http://localhost:${PORT}\n`);
});
