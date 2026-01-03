const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        // Personal Details
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        workMobile: {
            type: String,
            trim: true,
        },
        dob: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ['MALE', 'FEMALE', 'OTHER'],
        },
        maritalStatus: {
            type: String,
            enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
        },
        nationality: {
            type: String,
            default: 'Indian',
        },
        address: {
            type: String,
        },
        workLocation: {
            type: String,
            default: 'Head Office',
        },
        bankAccountNo: {
            type: String,
        },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
        },
        salaryDetails: {
            monthWage: { type: Number, default: 0 },
            yearWage: { type: Number, default: 0 },
            workingDaysPerWeek: { type: Number, default: 5 },
            breakTime: { type: Number, default: 1 }, // in hours

            // Earnings
            basicSalary: { type: Number, default: 0 },
            hra: { type: Number, default: 0 },
            standardAllowance: { type: Number, default: 0 },
            performanceBonus: { type: Number, default: 0 },
            lta: { type: Number, default: 0 },
            fixedAllowance: { type: Number, default: 0 },

            // Deductions
            pfEmployee: { type: Number, default: 0 },
            pfEmployer: { type: Number, default: 0 },
            professionalTax: { type: Number, default: 0 },
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: true,
        },
        designation: {
            type: String,
            required: true,
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        profilePictureUrl: {
            type: String,
        },
        documents: [
            {
                type: {
                    type: String,
                    enum: ['ID_PROOF', 'OFFER_LETTER', 'CERTIFICATE', 'OTHER'],
                    required: true
                },
                url: { type: String, required: true },
                originalName: String,
                mimeType: String,
                uploadedAt: { type: Date, default: Date.now }
            }
        ],
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'],
            default: 'ACTIVE',
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Employee', employeeSchema);
