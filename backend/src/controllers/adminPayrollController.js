const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee'); // If needed for validation
const { calculatePayroll } = require('../utils/payrollCalculator');

// Helper to get total days in a month (e.g., Jan = 31)
const getDaysInMonth = (monthStr) => {
    // monthStr format: "YYYY-MM"
    const [year, month] = monthStr.split('-').map(Number);
    // new Date(year, month, 0) gives the last day of the specific month
    // year: 2026, month: 6 (June) -> new Date(2026, 6, 0) is actually June 30th?
    // JavaScript Date month is 0-indexed.
    // So for "2026-06" (June), we want month index 6 (July) and day 0 => June 30.
    // Wait. "06" is June. 0-indexed 5 is June.
    // If we pass 6 to constructor as month, it's July. Day 0 of July is June 30. Correct.
    return new Date(year, month, 0).getDate();
};

// @desc    Generate Payroll for Employee
// @route   POST /api/admin/payroll/generate/:employeeId
// @access  Private (Admin/HR)
const generatePayroll = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { month } = req.body; // month: "2026-01"

        if (!month) {
            return res.status(400).json({ success: false, message: 'Please provide month (YYYY-MM)' });
        }

        // Fetch Employee to get Salary Details
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const grossSalary = employee.salaryDetails?.monthWage || 0;
        if (!grossSalary || grossSalary <= 0) {
            return res.status(400).json({ success: false, message: 'Employee gross salary (monthWage) is not set or is 0' });
        }

        // 1. Calculate Total Days in Month
        const totalDays = getDaysInMonth(month);

        // 2. Fetch Attendance
        // Format of date in DB is ISODate. We need to match YYYY-MM.
        // Fast way: $gte start of month, $lte end of month
        const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const attendanceRecords = await Attendance.find({
            employee: employeeId,
            date: { $gte: startOfMonth, $lt: endOfMonth }
        });

        // 3. Calculate Payable Days
        // Logic: Present/OnLeave = 1, HalfDay = 0.5
        // Note: Weekends/Holidays? 
        // MVP: Only count recorded attendance. If weekends aren't marked, they aren't paid?
        // OR: Assume they are paid if not marked absent?
        // Let's stick to strict explicit attendance as per Phase 3 requirements.
        // "Payable Days = Present + Approved Leaves" implies we count what's there.
        // (Real world: usually Auto-Present for weekends or fixed monthly salary assumes weekends paid)
        // For this exam/MVP, let's sum up the records we have.

        let payableDays = 0;
        attendanceRecords.forEach(record => {
            if (record.status === 'PRESENT' || record.status === 'REMOTE') {
                payableDays += 1;
            } else if (record.status === 'HALF_DAY') {
                payableDays += 0.5;
            } else if (record.status === 'LEAVE') {
                // Check if UNPAID
                // Phase 4 populates remarks: "Leave Approved: UNPAID"
                if (record.remarks && record.remarks.includes('UNPAID')) {
                    payableDays += 0;
                } else {
                    payableDays += 1;
                }
            } else if (record.status === 'ON_LEAVE') {
                // Handling legacy/alternate status if any, though we switched to LEAVE in Phase 4.
                // Just in case Phase 4 wasn't fully migrated in all paths.
                if (record.remarks && record.remarks.includes('UNPAID')) {
                    payableDays += 0;
                } else {
                    payableDays += 1;
                }
            }
        });

        // 4. Calculate Salary
        const { salaryStructure, calculated } = calculatePayroll(grossSalary, payableDays, totalDays);

        // 5. Save/Update Payroll
        const payroll = await Payroll.findOneAndUpdate(
            { employee: employeeId, month },
            {
                employee: employeeId,
                company: req.user.company,
                month,
                grossSalary,
                salaryStructure,
                payableDays,
                totalDaysInMonth: totalDays,
                netSalary: calculated.netSalary,
                status: 'GENERATED',
            },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Payroll generated successfully',
            data: payroll
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get All Payrolls
// @route   GET /api/admin/payroll
// @access  Private (Admin/HR)
const getAllPayrolls = async (req, res) => {
    try {
        const { month } = req.query;
        let query = { company: req.user.company };
        if (month) query.month = month;

        const payrolls = await Payroll.find(query)
            .populate('employee', 'firstName lastName loginId designation')
            .sort({ month: -1 });

        res.json({ success: true, count: payrolls.length, data: payrolls });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generatePayroll,
    getAllPayrolls,
};
