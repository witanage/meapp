const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

exports.loginForm = (req, res) => {
  res.render('admin/login', { pageTitle: 'Admin Login', error: null });
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(401)
        .render('admin/login', { pageTitle: 'Admin Login', error: 'Invalid username or password' });
    }

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);
    const admin = rows[0];
    const match = admin && (await bcrypt.compare(password, admin.password_hash));

    if (!admin || !match) {
      return res
        .status(401)
        .render('admin/login', { pageTitle: 'Admin Login', error: 'Invalid username or password' });
    }

    const csrf = crypto.randomBytes(16).toString('hex');
    const token = jwt.sign({ username: admin.username, csrf }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin/login');
};
