const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    // Determine if input is email or loginId
    const { email, loginId, password, tempPassword } = req.body;

    // Support "tempPassword" field from manual copy-paste
    const passwordToUse = password || tempPassword;

    if (!passwordToUse) {
        return res.status(400).json({ success: false, message: 'Please provide a password' });
    }

    try {
        let user;
        if (email) {
            user = await User.findOne({ email }).populate('company');
        } else if (loginId) {
            user = await User.findOne({ loginId }).populate('company');
        } else {
            return res.status(400).json({ success: false, message: 'Please provide email or Login ID' });
        }

        if (user && (await user.matchPassword(passwordToUse))) {
            console.log('✅ Password Matched for:', user.email);

            // Check if user is verified (only for email-based login if needed, but apply globally)
            // But active employees are auto-verified
            if (!user.isVerified) {
                return res.status(401).json({ success: false, message: 'Please verify your email to login' });
            }

            // SELF-REPAIR: If Admin/User has no employeeId linked, try to find it
            if (!user.employeeId) {
                console.log('🔧 Checking for missing employeeId...');
                const linkedEmployee = await Employee.findOne({ user: user._id });
                if (linkedEmployee) {
                    user.employeeId = linkedEmployee._id;
                    await user.save();
                    console.log(`✅ Auto-linked Employee ${linkedEmployee._id} to User ${user._id}`);
                }
            }

            // Creating audit log
            console.log('📝 Creating Audit Log...');
            const AuditLog = require('../models/AuditLog');
            try {
                await AuditLog.create({
                    action: 'USER_LOGIN',
                    // entity: 'AUTH', // Schema mismatch check: Is 'entity' in AuditLog schema?
                    // user: user._id, // Schema has 'user' field, not 'performedBy'?
                    // Let's check AuditLog schema I created earlier.
                    // Schema: user, userName, action, details, ip, status
                    user: user._id,
                    userName: user.email || 'Unknown',
                    action: 'LOGIN',
                    details: 'User logged in successfully',
                    ip: req.ip
                });
            } catch (auditErr) {
                console.error('⚠️ Audit Log Failed but allowing login:', auditErr.message);
            }

            console.log('🚀 Sending Response...');
            res.json({
                success: true,
                data: {
                    _id: user._id,
                    email: user.email,
                    loginId: user.loginId,
                    role: user.role,
                    company: typeof user.company === 'object' ? user.company : null, // If populated
                    isFirstLogin: user.isFirstLogin, // Frontend can redirect if true
                    token: generateToken(user._id),
                },
            });
        } else {
            console.log('❌ Invalid Credentials');
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword; // Will be hashed by pre-save hook
            user.isFirstLogin = false; // Mark as no longer first login
            await user.save();
            res.json({ success: true, message: 'Password updated successfully' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify email (Stub)
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    try {
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // In a real app, redirect to frontend login page
        res.status(200).send(`
            <h1>Email Verified Successfully</h1>
            <p>You can now login with your Login ID and Temporary Password.</p>
        `);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// @desc    Register a new Company & Admin
// @route   POST /api/auth/register
// @access  Public
const registerCompany = async (req, res) => {
    const { companyName, adminName, email, password } = req.body;

    try {
        // 1. Check if company or user exists
        const existingUser = await User.findOne({ email });
        const existingCompany = await Company.findOne({ name: companyName });

        if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });
        if (existingCompany) return res.status(400).json({ success: false, message: 'Company name already taken' });

        // 2. Create Company
        const company = await Company.create({
            name: companyName,
            address: 'Headquarters', // Default
            website: '',
            logo: req.file ? `/uploads/logos/${req.file.filename}` : null
        });

        // 3. Create Default Departments
        const defaultDepartments = ['Administration', 'Human Resources', 'Engineering', 'IT', 'Sales'];
        const createdDepartments = await Promise.all(
            defaultDepartments.map(deptName =>
                Department.create({
                    name: deptName,
                    company: company._id,
                    isActive: true
                })
            )
        );

        // Find Administration dept for the admin user (usually the first one, or find by name)
        const adminDept = createdDepartments.find(d => d.name === 'Administration');

        // 4. Create Admin User
        const year = new Date().getFullYear();
        const loginId = `ADM${year}${Math.floor(1000 + Math.random() * 9000)}`;

        const user = await User.create({
            email,
            password,
            role: 'ADMIN',
            company: company._id,
            loginId: loginId,
            isVerified: true
        });

        // 5. Create Employee Profile for Admin
        const newEmployee = await Employee.create({
            firstName: adminName,
            lastName: '(Admin)',
            email: email,
            phone: '0000000000', // Placeholder
            user: user._id,
            company: company._id,
            designation: 'System Administrator',
            department: adminDept._id,
            status: 'ACTIVE',
            joiningDate: new Date()
        });

        // CRITICAL FIX: Link Employee back to User
        user.employeeId = newEmployee._id;
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Company registered successfully',
            token: generateToken(user._id),
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                company: company.name
            }
        });

    } catch (error) {
        // Cleanup if possible? No/Not critical for now.
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { identifier } = req.body; // Email or Login ID

    try {
        let user;
        if (identifier.includes('@')) {
            user = await User.findOne({ email: identifier });
        } else {
            user = await User.findOne({ loginId: identifier });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate 6 digit OTP
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash token before saving (Optional security, but plain OTP is fine for short expiry)
        // Storing plain OTP for simplicity now, or could hash. Standard is often hashed.
        // Let's store plain for simplicity in matching, but strictly expire it.
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

        await user.save({ validateBeforeSave: false });

        const { sendVerificationCode } = require('../utils/emailService');
        const emailSent = await sendVerificationCode(user.email, resetToken);

        if (emailSent) {
            res.status(200).json({ success: true, message: 'Verification code sent to email' });
        } else {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { identifier, code, newPassword } = req.body;

    try {
        let user;
        // User needs to identify themselves again or we pass just the code? passing both is safer.
        if (identifier.includes('@')) {
            user = await User.findOne({
                email: identifier,
                resetPasswordToken: code,
                resetPasswordExpire: { $gt: Date.now() }
            });
        } else {
            user = await User.findOne({
                loginId: identifier,
                resetPasswordToken: code,
                resetPasswordExpire: { $gt: Date.now() }
            });
        }

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid code or expired' });
        }

        // Set new password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.isFirstLogin = false; // Resetting implies they took control

        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful. Please login.' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    loginUser,
    changePassword,
    verifyEmail,
    registerCompany,
    forgotPassword,
    resetPassword
};
