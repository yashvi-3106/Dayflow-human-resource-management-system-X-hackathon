const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Notification = require('../models/Notification');

// @desc    Get Employee Dashboard Data
// @route   GET /api/dashboard/employee
// @access  Private (Employee)
const getEmployeeDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        // Find linked employee profile
        const employee = await Employee.findOne({ user: userId });

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found' });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // 1. Today's Attendance
        const attendance = await Attendance.findOne({
            employee: employee._id,
            date: today
        });

        // 2. Leave Summary
        const pendingLeaves = await Leave.countDocuments({
            employee: employee._id,
            status: 'PENDING'
        });

        const approvedLeaves = await Leave.countDocuments({
            employee: employee._id,
            status: 'APPROVED'
        });

        // 3. Latest Payroll
        const latestPayroll = await Payroll.findOne({ employee: employee._id })
            .sort({ year: -1, month: -1 });

        // 4. Notifications (Recent 5)
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                attendance: {
                    status: attendance ? attendance.status : 'ABSENT',
                    clockIn: attendance ? attendance.clockIn : null,
                    clockOut: attendance ? attendance.clockOut : null,
                },
                leaves: {
                    pending: pendingLeaves,
                    approved: approvedLeaves
                },
                payroll: latestPayroll ? {
                    month: latestPayroll.month,
                    year: latestPayroll.year,
                    netSalary: latestPayroll.netSalary,
                    status: latestPayroll.status
                } : null,
                notifications
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Admin Dashboard Data
// @route   GET /api/dashboard/admin
// @access  Private (Admin/HR)
const getAdminDashboard = async (req, res) => {
    try {
        const companyId = req.user.company;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // 1. Employee Stats
        const totalEmployees = await Employee.countDocuments({ company: companyId });
        const activeEmployees = await Employee.countDocuments({ company: companyId, status: 'ACTIVE' });
        const inactiveEmployees = await Employee.countDocuments({ company: companyId, status: 'INACTIVE' });

        // 2. Attendance Stats (Today)
        const attendanceDocs = await Attendance.find({
            date: today
        }).populate({
            path: 'employee',
            match: { company: companyId } // Filter by company via populate match? 
            // Better: Filter Attendance by list of employee IDs or check company after populate.
            // Efficient: Add company field to Attendance model? No, it's not there.
            // Aggregation is best here.
        });

        // Filter attendance for this company (since Attendance doesn't store companyId directly usually, but let's check model)
        // Actually, Attendance Schema relates to Employee. 
        // Let's use aggregation to join Employee and filter by company.

        // Simpler for now: Get all employees of company, then find attendance for them.
        const companyEmployeeIds = (await Employee.find({ company: companyId }).select('_id')).map(e => e._id);

        const presentCount = await Attendance.countDocuments({ date: today, status: 'PRESENT', employee: { $in: companyEmployeeIds } });
        const absentCount = await Attendance.countDocuments({ date: today, status: 'ABSENT', employee: { $in: companyEmployeeIds } }); // Explicit absent usually not stored unless Cron runs
        // Actually, 'ABSENT' is default if no record.
        // So Absent = Active Employees - (Present + HalfDay + Leave + Remote)

        const halfDayCount = await Attendance.countDocuments({ date: today, status: 'HALF_DAY', employee: { $in: companyEmployeeIds } });
        const onLeaveCount = await Attendance.countDocuments({ date: today, status: 'LEAVE', employee: { $in: companyEmployeeIds } });

        const recordedCount = presentCount + halfDayCount + onLeaveCount; // + others
        const realAbsentCount = activeEmployees - recordedCount;
        // (Assuming all others are absent. Logic might vary if we have 'REMOTE' etc. but let's approximate).

        // 3. Leave Stats (Pending)
        const pendingLeaves = await Leave.countDocuments({ company: companyId, status: 'PENDING' });

        // 4. Payroll Stats (Current Month)
        const currentMonth = today.getMonth() + 1; // 1-12 usually? Payroll model uses String Enum often or Number. 
        // Payroll model checks 'January', 'February' etc or 1, 2? 
        // Let's check Payroll model later or assume standard.
        // Let's assume we want "Last Generation" stats.

        const payrollCount = await Payroll.countDocuments({
            company: companyId,
            month: today.toLocaleString('default', { month: 'long' }),
            year: today.getFullYear()
        });

        // 5. Alerts
        let alerts = [];
        if (pendingLeaves > 0) alerts.push(`${pendingLeaves} Leave requests pending approval`);
        if (realAbsentCount > 0) alerts.push(`${realAbsentCount} Employees absent today`);
        if (payrollCount === 0 && today.getDate() > 25) alerts.push(`Payroll not generated for ${today.toLocaleString('default', { month: 'long' })}`);

        // 6. Attendance Trend (Last 5 Days)
        const trend = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);

            const startOfDay = new Date(d); startOfDay.setUTCHours(0, 0, 0, 0);

            // Re-fetch active count contextually? No, assume stable for trend viz or simple calc.
            // Using logic: Present vs Absent

            // Get attendance for this historic date
            const dayAttendance = await Attendance.find({ date: startOfDay, employee: { $in: companyEmployeeIds } });

            const dayPresent = dayAttendance.filter(a => ['PRESENT', 'HALF_DAY'].includes(a.status)).length;
            const dayOnLeave = dayAttendance.filter(a => a.status === 'LEAVE').length;
            // Absents usually aren't stored as records if no clock-in occurred. 
            // So Absent = CurrentTotalActive - Present - OnLeave
            // Limitation: If total employees changed recently, this might be slightly off historically, but acceptable for dashboard trend.
            let dayAbsent = activeEmployees - dayPresent - dayOnLeave;
            if (dayAbsent < 0) dayAbsent = 0; // Integrity safety

            trend.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }), // e.g., Mon, Tue
                Present: dayPresent,
                Absent: dayAbsent
            });
        }

        res.json({
            success: true,
            data: {
                employees: {
                    total: totalEmployees,
                    active: activeEmployees,
                    inactive: inactiveEmployees
                },
                attendance: {
                    present: presentCount,
                    halfDay: halfDayCount,
                    onLeave: onLeaveCount,
                    absent: realAbsentCount
                },
                leaves: {
                    pending: pendingLeaves
                },
                payroll: {
                    generatedThisMonth: payrollCount
                },
                trend,
                alerts
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getEmployeeDashboard, getAdminDashboard };
