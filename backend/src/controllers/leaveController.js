const Leave = require('../models/Leave');

// Helper to calculate days between dates (inclusive)
const calculateDays = (start, end) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((end - start) / oneDay)) + 1;
    return diffDays;
};

// @desc    Apply for Leave
// @route   POST /api/leaves/apply
// @access  Private (Employee)
const applyLeave = async (req, res) => {
    try {
        const { type, fromDate, toDate, reason } = req.body;
        const employeeId = req.user.employeeId;
        const companyId = req.user.company;

        if (!fromDate || !toDate || !type || !reason) {
            return res.status(400).json({ success: false, message: 'Please provide all details' });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        // 1. Validation: End date >= Start date
        if (end < start) {
            return res.status(400).json({ success: false, message: 'To Date cannot be before From Date' });
        }

        // 2. Validation: Strict Overlap Check
        // Find if any leave exists that overlaps with [start, end]
        // Condition: (ExistingStart <= NewEnd) AND (ExistingEnd >= NewStart)
        const overlap = await Leave.findOne({
            employee: employeeId,
            status: { $in: ['PENDING', 'APPROVED'] },
            $or: [
                {
                    fromDate: { $lte: end },
                    toDate: { $gte: start }
                }
            ]
        });

        if (overlap) {
            return res.status(400).json({ success: false, message: 'Leave overlaps with an existing application' });
        }

        const days = calculateDays(start, end);

        const leave = await Leave.create({
            employee: employeeId,
            company: companyId,
            type,
            fromDate: start,
            toDate: end,
            days,
            reason,
        });

        res.status(201).json({ success: true, message: 'Leave application submitted', data: leave });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get My Leaves
// @route   GET /api/leaves/me
// @access  Private (Employee)
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ employee: req.user.employeeId })
            .sort({ createdAt: -1 });

        res.json({ success: true, count: leaves.length, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    applyLeave,
    getMyLeaves,
};
