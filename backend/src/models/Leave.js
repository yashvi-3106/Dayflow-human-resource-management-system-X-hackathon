const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        type: {
            type: String,
            enum: ['PAID', 'SICK', 'UNPAID'],
            required: true,
        },
        fromDate: {
            type: Date,
            required: true,
        },
        toDate: {
            type: Date,
            required: true,
        },
        days: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        actionBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
);

// Index to help find overlaps
leaveSchema.index({ employee: 1, fromDate: 1, toDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
