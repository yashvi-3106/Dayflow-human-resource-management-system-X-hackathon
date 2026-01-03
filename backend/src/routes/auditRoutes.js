const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('ADMIN'), getAuditLogs);

module.exports = router;
