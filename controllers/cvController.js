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
  res.status(status).render('admin/cv', {
    pageTitle: 'CV (PDF)',
    cv: rows[0] || null,
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

exports.download = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT filename, data FROM cv_file WHERE id = 1 AND enabled = 1 LIMIT 1');
    if (!rows[0]) {
      return res.status(404).render('error', { pageTitle: 'Not Found', message: 'CV not available.' });
    }
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
