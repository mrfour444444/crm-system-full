const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./database.db');

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        gender TEXT,
        email TEXT,
        phone TEXT,
        dob TEXT,
        status INTEGER,
        auto_shift INTEGER
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        status INTEGER
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        amount REAL,
        bonus REAL,
        ref_no TEXT,
        date TEXT,
        remark TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        amount REAL,
        method TEXT,
        status TEXT,
        date TEXT,
        remark TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS game_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT,
        player_name TEXT,
        game_id TEXT,
        password TEXT,
        credit REAL,
        status INTEGER,
        remark TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS banks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_name TEXT,
        account_number TEXT,
        account_name TEXT,
        status INTEGER
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        type TEXT,
        date TEXT,
        remark TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS shorts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        date TEXT,
        remark TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS payouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        date TEXT,
        remark TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        user_id INTEGER,
        date TEXT,
        ip_address TEXT
      )`);

      // ✅ 添加 password_logs 表
      db.run(`CREATE TABLE IF NOT EXISTS password_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        change_time TEXT,
        ip_address TEXT
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

function insertDefaultAdmin() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as total FROM users`, async (err, row) => {
      if (err) return reject(err);
      if (row.total === 0) {
        const hashed = await bcrypt.hash('admin123', 10);
        db.run(`INSERT INTO users (username, password, first_name, last_name, email, status)
                VALUES (?, ?, ?, ?, ?, ?)`,
          ['admin', hashed, 'Admin', 'User', 'admin@example.com', 1],
          (err) => {
            if (err) return reject(err);
            console.log('✅ 默认 admin 账户创建成功（admin / admin123）');
            resolve();
          }
        );
      } else {
        console.log('✅ 已存在 admin 用户，跳过插入');
        resolve();
      }
    });
  });
}

// 主执行流程
(async () => {
  try {
    await createTables();
    await insertDefaultAdmin();
    db.close(() => {
      console.log('✅ All tables initialized successfully');
    });
  } catch (err) {
    console.error('初始化错误:', err);
    db.close();
  }
})();
