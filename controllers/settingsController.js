const bcrypt = require('bcryptjs');
const pool = require('../config/db');

exports.editForm = (req, res) => {
  res.render('admin/password', { pageTitle: 'Change Password', error: null, success: null });
};

exports.update = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).render('admin/password', {
        pageTitle: 'Change Password',
        error: 'All fields are required.',
        success: null,
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).render('admin/password', {
        pageTitle: 'Change Password',
        error: 'New password must be at least 8 characters.',
        success: null,
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).render('admin/password', {
        pageTitle: 'Change Password',
        error: 'New password and confirmation do not match.',
        success: null,
      });
    }

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [req.admin.username]);
    const admin = rows[0];
    const match = admin && (await bcrypt.compare(currentPassword, admin.password_hash));

    if (!match) {
      return res.status(401).render('admin/password', {
        pageTitle: 'Change Password',
        error: 'Current password is incorrect.',
        success: null,
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [newHash, admin.id]);

    res.render('admin/password', {
      pageTitle: 'Change Password',
      error: null,
      success: 'Password updated successfully.',
    });
  } catch (err) {
    next(err);
  }
};
