const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        loginId: {
            type: String,
            unique: true,
            sparse: true, // Allows null/undefined for older users like Admin
            trim: true,
            uppercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['ADMIN', 'HR', 'EMPLOYEE'],
            default: 'EMPLOYEE',
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            default: null,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isFirstLogin: {
            type: Boolean,
            default: true,
        },
        verificationToken: String,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    { timestamps: true },
);

// Encrypt password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
