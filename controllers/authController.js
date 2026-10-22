const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

authenticator.options = { window: 1 };
const ISSUER = 'Portfolio Admin';

function issueSession(res, username) {
  const csrf = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign({ username, csrf }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000,
  });
  res.clearCookie('mfa');
}

function readPending(req) {
  try {
    const p = jwt.verify(req.cookies.mfa, process.env.JWT_SECRET);
    return p.purpose === 'mfa' ? p : null;
  } catch (e) {
    return null;
  }
}

async function renderVerify(res, pending, error, status = 200) {
  let qr = null;
  if (pending.newSecret) {
    const uri = authenticator.keyuri(pending.username, ISSUER, pending.newSecret);
    qr = await QRCode.toDataURL(uri);
  }
  res.status(status).render('admin/verify', {
    pageTitle: 'Verify',
    error,
    qr,
    secret: pending.newSecret || null,
  });
}

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

    const pending = { purpose: 'mfa', username: admin.username };
    if (!admin.totp_secret) pending.newSecret = authenticator.generateSecret();
    const mfa = jwt.sign(pending, process.env.JWT_SECRET, { expiresIn: '5m' });
    res.cookie('mfa', mfa, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });
    res.redirect('/admin/login/verify');
  } catch (err) {
    next(err);
  }
};

exports.verifyForm = async (req, res, next) => {
  try {
    const pending = readPending(req);
    if (!pending) return res.redirect('/admin/login');
    await renderVerify(res, pending, null);
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const pending = readPending(req);
    if (!pending) return res.redirect('/admin/login');

    const code = String(req.body.code || '').replace(/\s/g, '');
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [pending.username]);
    const admin = rows[0];
    if (!admin) return res.redirect('/admin/login');

    const secret = admin.totp_secret || pending.newSecret;
    if (!secret || !/^\d{6}$/.test(code) || !authenticator.check(code, secret)) {
      return renderVerify(res, pending, 'Invalid code. Please try again.', 401);
    }

    if (!admin.totp_secret) {
      await pool.query('UPDATE admins SET totp_secret = ? WHERE id = ? AND totp_secret IS NULL', [secret, admin.id]);
    }

    issueSession(res, admin.username);
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin/login');
};
