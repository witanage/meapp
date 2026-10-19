const crypto = require('crypto');
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

// Returns true when delivered (or ntfy is not configured); never throws.
async function notify({ name, email, subject, message }) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return true;
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.NTFY_TOKEN) headers.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
  try {
    const r = await fetch(process.env.NTFY_URL || 'https://ntfy.sh', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topic,
        title: `New message from ${name}`,
        message: `${email}${subject ? `\n${subject}` : ''}\n\n${message}`.slice(0, 3500),
        tags: ['envelope'],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) {
      console.error(`ntfy notification failed: HTTP ${r.status} ${await r.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('ntfy notification failed:', err.message);
    return false;
  }
}

const MAX_ATTEMPTS = 20;

// Retries queued notifications oldest-first; stops at the first failure since ntfy is likely still down.
async function flushQueue() {
  const result = { sent: 0, remaining: 0 };
  if (!process.env.NTFY_TOPIC) return result;
  const [rows] = await pool.query('SELECT id, payload, attempts FROM notification_queue ORDER BY id LIMIT 50');
  for (const row of rows) {
    if (await notify(JSON.parse(row.payload))) {
      await pool.query('DELETE FROM notification_queue WHERE id = ?', [row.id]);
      result.sent++;
    } else {
      if (row.attempts + 1 >= MAX_ATTEMPTS) await pool.query('DELETE FROM notification_queue WHERE id = ?', [row.id]);
      else await pool.query('UPDATE notification_queue SET attempts = attempts + 1 WHERE id = ?', [row.id]);
      break;
    }
  }
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM notification_queue');
  result.remaining = n;
  return result;
}

exports.flush = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    const given = Buffer.from(String(req.get('authorization') || ''));
    const expected = Buffer.from(`Bearer ${secret}`);
    if (!secret || given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(await flushQueue());
  } catch (err) {
    next(err);
  }
};

async function notifyOrQueue(data) {
  if (await notify(data)) return;
  try {
    await pool.query('INSERT INTO notification_queue (payload) VALUES (?)', [JSON.stringify(data)]);
  } catch (err) {
    console.error('failed to queue notification:', err.message);
  }
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
    await notifyOrQueue({ name, email, subject, message });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
