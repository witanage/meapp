const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

const cvController = require('../controllers/cvController');

router.get('/', publicController.home);
router.post('/cv/download', cvController.download);
router.post('/contact', require('../controllers/contactController').send);
router.post('/cron/flush-notifications', require('../controllers/contactController').flush);

module.exports = router;
