const pool = require('../config/db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Per-IP throttle; best effort only since serverless instances don't share memory.
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

async function verifyCaptcha(token, ip) {
  if (!token || !process.env.RECAPTCHA_SECRET_KEY) return false;
  const params = new URLSearchParams({
    secret: process.env.RECAPTCHA_SECRET_KEY,
    response: String(token),
    remoteip: ip || '',
  });
  const r = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: params });
  const result = await r.json();
  return result.success === true;
}

exports.send = async (req, res, next) => {
  try {
    if (throttled(req.ip)) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim();
    const subject = String(b.subject || '').trim();
    const message = String(b.message || '').trim();
    if (!name || !message || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please provide a name, a valid email and a message.' });
    }
    if (name.length > 100 || email.length > 150 || subject.length > 150 || message.length > 2000) {
      return res.status(400).json({ error: 'One or more fields are too long.' });
    }
    if (!(await verifyCaptcha(b.captchaToken, req.ip))) {
      return res.status(400).json({ error: 'Captcha verification failed. Please try again.' });
    }
    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, subject || null, message, String(req.ip || '').slice(0, 45), String(req.get('user-agent') || '').slice(0, 255)]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
