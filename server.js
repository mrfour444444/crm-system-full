require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');
const expressLayouts = require('express-ejs-layouts');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'crm_secret',
  resave: false,
  saveUninitialized: true,
}));
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// 登录保护中间件
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// 登录页
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.getUserByEmail(email);
  if (!user) return res.render('login', { error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.render('login', { error: 'Invalid email or password' });

  req.session.user = user;
  res.redirect('/dashboard');
});

// 登出
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// 忘记密码
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { message: null });
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await db.getUserByEmail(email);
  if (!user) return res.render('forgot-password', { message: 'Email not found.' });

  const newPass = crypto.randomBytes(4).toString('hex');
  const hashed = await bcrypt.hash(newPass, 10);
  await db.updateUserPassword(user.id, hashed);

  // 发送邮件
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_ACCOUNT,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `"CRM Support" <${process.env.EMAIL_ACCOUNT}>`,
    to: email,
    subject: 'Password Reset',
    text: `Your new password is: ${newPass}`
  });

  res.render('forgot-password', { message: 'New password sent to email.' });
});

// 修改密码
app.get('/change-password', requireLogin, (req, res) => {
  res.render('change-password', { message: null });
});

app.post('/change-password', requireLogin, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await db.getUserById(req.session.user.id);

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return res.render('change-password', { message: 'Old password incorrect.' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.updateUserPassword(user.id, hashed);
  await db.logPasswordChange(user.id);

  res.render('change-password', { message: 'Password changed successfully.' });
});

// 各页面路由
app.get('/dashboard', requireLogin, (req, res) => res.render('dashboard', { user: req.session.user }));
app.get('/shift-report', requireLogin, (req, res) => res.render('shift-report', { user: req.session.user }));
app.get('/email-error', requireLogin, (req, res) => res.render('email-error', { user: req.session.user }));
app.get('/edit-user', requireLogin, (req, res) => res.render('edit-user', { user: req.session.user }));

// 示例菜单页面（根据你的模块继续添加）
app.get('/customers/manage', requireLogin, (req, res) => res.render('customers/manage-customers', { user: req.session.user }));
app.get('/deposit/manage', requireLogin, (req, res) => res.render('deposit/manage-deposit', { user: req.session.user }));
app.get('/withdrawal/manage', requireLogin, (req, res) => res.render('withdrawal/manage-withdrawal', { user: req.session.user }));
app.get('/game/manage', requireLogin, (req, res) => res.render('game/manage-game-account', { user: req.session.user }));
app.get('/setting/manage-user', requireLogin, (req, res) => res.render('setting/manage-user', { user: req.session.user }));

// 设置根路径跳转到 /login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// 更多模块路由……
app.listen(3000, () => {
  console.log('CRM system running on http://localhost:3000');
});
