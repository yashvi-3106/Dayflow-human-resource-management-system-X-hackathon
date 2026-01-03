const express = require('express');
const router = express.Router();
const { getMedia } = require('../controllers/mediaController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:filename', protect, getMedia);

module.exports = router;
