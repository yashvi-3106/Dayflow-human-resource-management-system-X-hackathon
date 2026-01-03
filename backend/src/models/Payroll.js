const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
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
        month: {
            type: String, // Format: YYYY-MM
            required: true,
        },
        grossSalary: {
            type: Number,
            required: true,
        },
        salaryStructure: {
            basic: Number,
            hra: Number,
            conveyance: Number,
            pf: Number,
            insurance: Number,
        },
        payableDays: {
            type: Number,
            required: true,
            default: 0,
        },
        totalDaysInMonth: {
            type: Number,
            required: true,
        },
        netSalary: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['GENERATED', 'PAID'],
            default: 'GENERATED',
        },
    },
    { timestamps: true },
);

// Ensure one payroll per employee per month
payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
