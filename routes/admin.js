const express = require('express');
const router = express.Router();
const sections = require('../config/sections');
const crudFactory = require('../controllers/crudFactory');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const settingsController = require('../controllers/settingsController');
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { verifyCsrf } = require('../middleware/csrf');

// Logout must stay reachable even with a stale/expired token.
router.get('/logout', authController.logout);

router.use(requireAuth);

router.get('/', adminController.dashboard);

router.get('/profile', profileController.editForm);
router.post('/profile', verifyCsrf, profileController.update);

router.get('/password', settingsController.editForm);
router.post('/password', verifyCsrf, settingsController.update);

Object.keys(sections).forEach((key) => {
  const cfg = sections[key];
  const c = crudFactory(cfg);
  router.get(`/${key}`, c.list);
  router.get(`/${key}/new`, c.addForm);
  router.post(`/${key}`, verifyCsrf, c.create);
  router.get(`/${key}/:id/edit`, c.editForm);
  router.post(`/${key}/:id`, verifyCsrf, c.update);
  router.post(`/${key}/:id/delete`, verifyCsrf, c.remove);
});

module.exports = router;
