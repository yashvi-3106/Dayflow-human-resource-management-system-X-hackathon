const express = require('express');
const { applyLeave, getMyLeaves } = require('../controllers/leaveController');
const { protect } = require('../middlewares/authMiddleware');
const { firstLoginGuard } = require('../middlewares/firstLoginGuard');

const router = express.Router();

router.use(protect);
router.use(firstLoginGuard);

router.post('/apply', applyLeave);
router.get('/me', getMyLeaves);

module.exports = router;
