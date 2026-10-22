const pool = require('../config/db');

exports.queue = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, payload, attempts, created_at FROM notification_queue ORDER BY id LIMIT 200'
    );
    const queue = rows.map((r) => {
      let p = {};
      try {
        p = JSON.parse(r.payload);
      } catch (e) {
        // leave empty for malformed payloads
      }
      return { id: r.id, attempts: r.attempts, created_at: r.created_at, ...p };
    });
    const [messages] = await pool.query(
      'SELECT name, email, subject, message, ip, created_at FROM contact_messages ORDER BY id DESC LIMIT 100'
    );
    res.render('admin/queue', { pageTitle: 'Message Queue', queue, messages });
  } catch (err) {
    next(err);
  }
};
