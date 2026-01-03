const express = require('express');
const { getAllLeaves, takeLeaveAction } = require('../controllers/adminLeaveController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'HR'));

router.get('/', getAllLeaves);
router.patch('/:id/action', takeLeaveAction);

module.exports = router;
