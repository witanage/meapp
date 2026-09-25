const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/admin/login');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    res.locals.csrfToken = payload.csrf;
    res.locals.adminUsername = payload.username;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/admin/login');
  }
}

module.exports = { requireAuth };
