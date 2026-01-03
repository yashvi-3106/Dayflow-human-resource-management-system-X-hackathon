const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userName: String, // Snapshot of name in case user is deleted
        action: {
            type: String, // e.g., 'LOGIN', 'CREATE_EMPLOYEE', 'UPDATE_PAYROLL'
            required: true,
        },
        details: {
            type: String,
        },
        ip: {
            type: String,
        },
        status: {
            type: String,
            enum: ['SUCCESS', 'FAILURE'],
            default: 'SUCCESS'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
