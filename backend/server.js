/**
 * ComicsWeb Backend — json-server-auth
 *
 * Khởi động: npm start
 * Server chạy tại: http://localhost:3001
 *
 * Routes mặc định từ json-server:
 *   GET    /comics          — Lấy danh sách truyện
 *   GET    /comics/:id      — Lấy chi tiết truyện
 *   POST   /comics          — Thêm truyện (cần auth)
 *   PUT    /comics/:id      — Sửa truyện (cần auth)
 *   DELETE /comics/:id      — Xoá truyện (cần auth)
 *   ... tương tự cho chapters, genres, bookmarks, readingHistory
 *
 * Auth routes (từ json-server-auth):
 *   POST   /register        — Đăng ký (email, password)
 *   POST   /login           — Đăng nhập → trả về JWT
 *   POST   /600/users       — Truy cập user (cần auth)
 */

const jsonServer = require('json-server');
const auth = require('json-server-auth');
const path = require('path');
const bcrypt = require('bcryptjs');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, '..', 'frontend'),
});

// ─── Cấu hình CORS ────────────────────────────────────────
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ─── Quy tắc bảo vệ routes ───────────────────────────────
// Cú pháp: "resource permission"
//   6 = chỉ owner, 4 = authenticated user, 0 = public
//
// Ví dụ: "/comics" → 660 → owner: rw, authenticated: rw, public: none
//         "/comics" → 664 → owner: rw, authenticated: rw, public: r
const rules = auth.rewriter({
  // Comics: ai cũng đọc được, chỉ admin sửa/xoá
  comics: 664,
  // Chapters: ai cũng đọc được, chỉ admin sửa/xoá
  chapters: 664,
  // Genres: ai cũng đọc được
  genres: 444,
  // Bookmarks: chỉ user đã đăng nhập
  bookmarks: 660,
  // Reading History: chỉ user đã đăng nhập
  readingHistory: 660,
  // Users: tài khoản đã đăng nhập có thể CRUD để trang admin quản lý tài khoản
  users: 660,
});

// ─── Apply middleware theo thứ tự ─────────────────────────
server.use(jsonServer.bodyParser);

// Bind json-server-auth router
server.db = router.db;

// Custom create user route cho trang admin.
// Route này đặt trước auth.rewriter để POST /users không bị đổi thành /660/users.
// Route này hash mật khẩu trước khi lưu vào db.json.
server.post('/users', (req, res) => {
  const { email, password, displayName, username, role, status, avatar } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
  }

  const users = router.db.get('users');
  const existed = users.find({ email }).value();

  if (existed) {
    return res.status(400).json({ message: 'Email đã tồn tại' });
  }

  const allUsers = users.value();
  const maxId = allUsers.length ? Math.max(...allUsers.map(u => Number(u.id) || 0)) : 0;

  const newUser = {
    id: maxId + 1,
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

  const { password: _password, ...safeUser } = newUser;
  return res.status(201).json(safeUser);
});

server.use(rules);
server.use(middlewares);
server.use(auth);
server.use(router);

// ─── Khởi động server ────────────────────────────────────
const PORT = 3001;
server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║      🚀 ComicsWeb API is running!       ║');
  console.log(`  ║      http://localhost:${PORT}              ║`);
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  Endpoints:                              ║');
  console.log('  ║    GET  /comics      — Danh sách truyện  ║');
  console.log('  ║    GET  /chapters    — Danh sách chương   ║');
  console.log('  ║    GET  /genres      — Thể loại           ║');
  console.log('  ║    POST /register    — Đăng ký            ║');
  console.log('  ║    POST /login       — Đăng nhập          ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
