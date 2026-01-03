const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');

router.use(protect);
router.use(authorize('ADMIN', 'HR')); // HR might need to see logs too? Prompt said "Admin/HR actions are tracked", usually Admin views logs. Let's allow HR too for now.

router.get('/', getAuditLogs);

module.exports = router;
