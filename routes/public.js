const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

const cvController = require('../controllers/cvController');

router.get('/', publicController.home);
router.get('/cv.pdf', cvController.download);

module.exports = router;
