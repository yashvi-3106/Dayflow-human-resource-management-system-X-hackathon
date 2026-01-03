const AuditLog = require('../models/AuditLog');

// @desc    Get Audit Logs (Admin)
// @route   GET /api/admin/audit-logs
// @access  Private (Admin Only)
const getAuditLogs = async (req, res) => {
    try {
        // Filters
        const { action, entity, performedBy, date } = req.query;
        const query = { company: req.user.company };

        if (action) query.action = action;
        if (entity) query.entity = entity;
        if (performedBy) query.performedBy = performedBy;

        if (date) {
            // Simple date filter (start of day to end of day)
            const d = new Date(date);
            const nextDay = new Date(d);
            nextDay.setDate(d.getDate() + 1);
            query.createdAt = { $gte: d, $lt: nextDay };
        }

        const logs = await AuditLog.find(query)
            .populate('performedBy', 'email role')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAuditLogs };
