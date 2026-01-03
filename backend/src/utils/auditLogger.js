const AuditLog = require('../models/AuditLog');

/**
 * Log an administrative action
 * @param {Object} req - Express Request Object (to extract performedBy)
 * @param {string} action - Action Name (e.g. 'EMPLOYEE_CREATED')
 * @param {string} entity - Entity Type (e.g. 'EMPLOYEE')
 * @param {string} entityId - Affected Entity ID
 * @param {Object} metadata - Additional Details
 */
const logAction = async (req, action, entity, entityId, metadata = {}) => {
    try {
        if (!req.user) {
            console.warn('AuditLog Skipped: No user in request');
            return;
        }

        await AuditLog.create({
            action,
            entity,
            entityId,
            performedBy: req.user._id,
            company: req.user.company,
            metadata
        });
    } catch (error) {
        console.error('AuditLog Error:', error.message);
        // Do not block main flow
    }
};

module.exports = { logAction };
