const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        date: {
            type: Date,
            required: true,
            // We will normalize this to midnight UTC in the controller to ensure uniqueness
        },
        status: {
            type: String,
            enum: ['PRESENT', 'HALF_DAY', 'ABSENT', 'LEAVE', 'REMOTE'],
            default: 'PRESENT',
        },
        source: {
            type: String,
            enum: ['MANUAL', 'MACHINE'],
            default: 'MANUAL',
        },
        clockIn: {
            type: Date,
        },
        clockOut: {
            type: Date,
        },
        workDuration: {
            type: Number, // In minutes
            default: 0,
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
);

// Compound index to ensure one record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
