const express = require('express');
const router = express.Router();
const { getEmployeeDashboard, getAdminDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');

router.use(protect);

router.get('/employee', authorize('EMPLOYEE', 'ADMIN', 'HR'), getEmployeeDashboard); // Admins might want to see how it looks? Usually Employee only. allowing all for testing flexibility.
// Actually, getEmployeeDashboard finds employee by req.user._id. If ADMIN calls it and has no attached Employee profile, it will fail (404). That's fine.

router.get('/admin', authorize('ADMIN', 'HR'), getAdminDashboard);

module.exports = router;
