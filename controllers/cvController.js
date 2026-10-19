const multer = require('multer');
const pool = require('../config/db');

// Stored in the DB because serverless hosting (Vercel) has no persistent disk.
const MAX_BYTES = 4 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
}).single('cv');

exports.parseUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 4 MB).' : 'Upload failed.';
    return renderForm(req, res, message, null, 400);
  });
};

async function renderForm(req, res, error, success, status = 200) {
  const [rows] = await pool.query('SELECT filename, size, enabled, updated_at FROM cv_file WHERE id = 1 LIMIT 1');
  const [downloads] = await pool.query(
    'SELECT email, ip, downloaded_at FROM cv_downloads ORDER BY downloaded_at DESC, id DESC LIMIT 200'
  );
  res.status(status).render('admin/cv', {
    pageTitle: 'CV (PDF)',
    cv: rows[0] || null,
    downloads,
    error,
    success,
  });
}

exports.form = async (req, res, next) => {
  try {
    await renderForm(req, res, null, null);
  } catch (err) {
    next(err);
  }
};

exports.upload = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return await renderForm(req, res, 'Please choose a PDF file.', null, 400);

    // Check the real file signature, not just the client-supplied MIME type.
    if (file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return await renderForm(req, res, 'Only PDF files are allowed.', null, 400);
    }

    const filename = (file.originalname || 'cv.pdf').replace(/[^\w.\- ]/g, '_').slice(0, 200);
    await pool.query(
      `INSERT INTO cv_file (id, filename, size, data) VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE filename = VALUES(filename), size = VALUES(size), data = VALUES(data)`,
      [filename, file.size, file.buffer]
    );
    await renderForm(req, res, null, 'CV uploaded.');
  } catch (err) {
    next(err);
  }
};

exports.toggle = async (req, res, next) => {
  try {
    await pool.query('UPDATE cv_file SET enabled = 1 - enabled WHERE id = 1');
    await renderForm(req, res, null, 'Download button setting updated.');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cv_file WHERE id = 1');
    await renderForm(req, res, null, 'CV removed.');
  } catch (err) {
    next(err);
  }
};

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

// Per-IP throttle; best effort only since serverless instances don't share memory.
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

async function verifyCaptcha(token, ip) {
  if (!token || !process.env.RECAPTCHA_SECRET_KEY) return false;
  const params = new URLSearchParams({
    secret: process.env.RECAPTCHA_SECRET_KEY,
    response: String(token),
    remoteip: ip || '',
  });
  const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: params,
  });
  const result = await r.json();
  return result.success === true;
}

exports.download = async (req, res, next) => {
  try {
    if (throttled(req.ip)) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    const { email, captchaToken } = req.body || {};
    if (!EMAIL_RE.test(String(email || '').trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!(await verifyCaptcha(captchaToken, req.ip))) {
      return res.status(400).json({ error: 'Captcha verification failed. Please try again.' });
    }
    const [rows] = await pool.query('SELECT filename, data FROM cv_file WHERE id = 1 AND enabled = 1 LIMIT 1');
    if (!rows[0]) {
      return res.status(404).json({ error: 'CV not available.' });
    }
    await pool.query('INSERT INTO cv_downloads (email, ip, user_agent) VALUES (?, ?, ?)', [
      String(email).trim().slice(0, 320),
      String(req.ip || '').slice(0, 45),
      String(req.get('user-agent') || '').slice(0, 255),
    ]);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Chinthaka_Withanage_CV.pdf"',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(rows[0].data);
  } catch (err) {
    next(err);
  }
};
