const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./crm.db');

// 用户相关
exports.getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

exports.updateUserPassword = (id, hashedPassword) => {
  return new Promise((resolve, reject) => {
    db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

exports.logPasswordChange = (userId) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO password_logs (user_id, changed_at) VALUES (?, datetime('now'))", [userId], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};
