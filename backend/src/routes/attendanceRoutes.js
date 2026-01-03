const express = require('express');
const { clockIn, clockOut, getMyAttendance, getAttendanceStats } = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { firstLoginGuard } = require('../middlewares/firstLoginGuard');

const router = express.Router();

router.use(protect);
router.use(firstLoginGuard);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/me', getMyAttendance);
router.get('/stats', getAttendanceStats);

module.exports = router;
