const express = require('express');
const { getAllAttendance, importAttendance } = require('../controllers/adminAttendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'HR'));

router.get('/', getAllAttendance);
router.post('/import', importAttendance);

module.exports = router;
