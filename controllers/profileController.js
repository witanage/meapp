const pool = require('../config/db');

exports.editForm = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM profile WHERE id = 1 LIMIT 1');
    res.render('admin/profile', { pageTitle: 'Edit Profile', profile: rows[0] || {}, error: null });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, title, objective, phone, email, location, linkedin } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).render('admin/profile', {
        pageTitle: 'Edit Profile',
        profile: req.body,
        error: 'Name is required',
      });
    }

    await pool.query(
      `INSERT INTO profile (id, name, title, objective, phone, email, location, linkedin)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), title = VALUES(title), objective = VALUES(objective),
         phone = VALUES(phone), email = VALUES(email), location = VALUES(location),
         linkedin = VALUES(linkedin)`,
      [name, title, objective, phone, email, location, linkedin]
    );

    res.redirect('/admin/profile');
  } catch (err) {
    next(err);
  }
};
