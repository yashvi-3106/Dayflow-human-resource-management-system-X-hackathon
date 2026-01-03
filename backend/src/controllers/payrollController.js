const Payroll = require('../models/Payroll');

// @desc    Get My Payroll History
// @route   GET /api/payroll/me
// @access  Private (Employee)
const getMyPayroll = async (req, res) => {
    try {
        const payrolls = await Payroll.find({ employee: req.user.employeeId })
            .sort({ month: -1 });

        res.json({ success: true, count: payrolls.length, data: payrolls });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMyPayroll };
