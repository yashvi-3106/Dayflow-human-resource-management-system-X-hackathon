const AuditLog = require('../models/AuditLog');

// @desc    Get Audit Logs
// @route   GET /api/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('user', 'email role'); // Populate user details if needed

        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to create log (internal use)
const createAuditLog = async (userId, userName, action, details, ip, status = 'SUCCESS') => {
    try {
        await AuditLog.create({
            user: userId,
            userName,
            action,
            details,
            ip,
            status
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

module.exports = {
    getAuditLogs,
    createAuditLog
};
