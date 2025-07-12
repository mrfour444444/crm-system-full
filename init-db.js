const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./crm.db');

db.serialize(async () => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    fullname TEXT,
    role TEXT,
    email TEXT,
    status INTEGER,
    can_withdraw INTEGER,
    can_adjust INTEGER,
    type TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS password_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 检查是否已有 admin 用户
  db.get(`SELECT * FROM users WHERE username = ?`, ['admin'], async (err, row) => {
    if (err) return console.error(err);

    if (!row) {
      const hash = await bcrypt.hash('admin123', 10);
      db.run(`INSERT INTO users (username, password, fullname, role, email, status, can_withdraw, can_adjust, type)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              ['admin', hash, 'Admin User', 'admin', 'admin@example.com', 1, 0, 0, 'staff']);
      console.log('✅ 默认 admin 账户创建成功 (admin / admin123)');
    } else {
      console.log('✅ 已存在 admin 用户，跳过插入');
    }
  });

  console.log('✅ All tables initialized successfully');
});

db.close();
