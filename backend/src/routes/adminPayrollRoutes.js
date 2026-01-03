const express = require('express');
const { generatePayroll, getAllPayrolls } = require('../controllers/adminPayrollController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'HR'));

router.post('/generate/:employeeId', generatePayroll);
router.get('/', getAllPayrolls);

module.exports = router;
