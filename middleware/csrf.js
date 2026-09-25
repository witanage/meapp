// Synchronizer-token CSRF check: the token is embedded in the signed JWT
// (set at login) and must be echoed back as a hidden field on every form.
function verifyCsrf(req, res, next) {
  const tokenFromForm = req.body._csrf;
  if (!req.admin || !tokenFromForm || tokenFromForm !== req.admin.csrf) {
    return res.status(403).render('error', {
      pageTitle: 'Forbidden',
      message: 'Invalid or expired form token. Please refresh the page and try again.',
    });
  }
  next();
}

module.exports = { verifyCsrf };
