const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Get All Attendance Records
// @route   GET /api/admin/attendance
// @access  Private (Admin/HR)
const getAllAttendance = async (req, res) => {
    try {
        const { date, department } = req.query;
        let query = {};

        // Filter by Date
        if (date) {
            const queryDate = new Date(date);
            queryDate.setUTCHours(0, 0, 0, 0);
            query.date = queryDate;
        }

        // Filter by Department (Requires filtering employees first)
        if (department) {
            const employees = await Employee.find({ department }).select('_id');
            const employeeIds = employees.map(emp => emp._id);
            query.employee = { $in: employeeIds };
        }

        // Ensure Admin sees only their company's data
        // Filter employees by company
        // Optimized approach: find employees of company, then find attendance
        const companyEmployees = await Employee.find({ company: req.user.company }).select('_id');
        const companyEmployeeIds = companyEmployees.map(emp => emp._id);

        // Merge company filter with other filters
        if (query.employee) {
            // Intersection if department filter was active
            // (No need to intersect if logic ensures dept belongs to company, but safe to do so)
            // query.employee is already set
        } else {
            query.employee = { $in: companyEmployeeIds };
        }

        const attendance = await Attendance.find(query)
            .populate('employee', 'firstName lastName loginId')
            .sort({ date: -1 });

        res.json({ success: true, count: attendance.length, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Import Attendance (Biometric/Machine)
// @route   POST /api/admin/attendance/import
// @access  Private (Admin/HR)
const importAttendance = async (req, res) => {
    // Body: { records: [ { employeeCode, date, status, checkIn, checkOut } ] }
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ success: false, message: 'Invalid data format. Expected array of records.' });
    }

    const results = {
        successCount: 0,
        errors: [],
    };

    try {
        // Pre-fetch all employees for this company
        const employees = await Employee.find({ company: req.user.company })
            .populate('user', 'loginId');

        // Map LoginID -> EmployeeID
        const employeeMap = {};
        employees.forEach(emp => {
            if (emp.user && emp.user.loginId) {
                employeeMap[emp.user.loginId] = emp._id;
            }
        });

        // Process records
        for (const record of records) {
            const { employeeCode, date, checkIn, checkOut } = record;

            // 1. Validate Employee
            // JSON "employeeCode" maps to User "loginId"
            const employeeId = employeeMap[employeeCode];
            if (!employeeId) {
                results.errors.push({ employeeCode, message: 'Employee not found or invalid Code' });
                continue;
            }

            // 2. Validate Data
            if (!date) {
                results.errors.push({ employeeCode, message: 'Missing date' });
                continue;
            }

            const normalizedDate = new Date(date);
            normalizedDate.setUTCHours(0, 0, 0, 0);

            // 3. Calculate Status & Duration if times provided
            let status = 'ABSENT';
            let workDuration = 0;
            let clockInDate, clockOutDate;

            if (checkIn && checkOut) {
                const [inH, inM] = checkIn.split(':');
                const [outH, outM] = checkOut.split(':');

                clockInDate = new Date(normalizedDate);
                clockInDate.setHours(inH, inM, 0, 0);

                clockOutDate = new Date(normalizedDate);
                clockOutDate.setHours(outH, outM, 0, 0);

                const diffMs = clockOutDate - clockInDate;
                workDuration = Math.floor(diffMs / 1000 / 60);
                const hours = workDuration / 60;

                if (hours >= 8) status = 'PRESENT';
                else if (hours >= 4) status = 'HALF_DAY';
                else status = 'ABSENT';
            } else if (record.status) {
                status = record.status;
            }

            // 4. Upsert (Machine Override)
            await Attendance.findOneAndUpdate(
                { employee: employeeId, date: normalizedDate },
                {
                    employee: employeeId,
                    date: normalizedDate,
                    clockIn: clockInDate,
                    clockOut: clockOutDate,
                    workDuration,
                    status,
                    source: 'MACHINE' // Strict Source 'MACHINE'
                },
                { upsert: true, new: true }
            );

            results.successCount++;
        }

        res.json({
            success: true,
            message: `Import processed. Success: ${results.successCount}, Errors: ${results.errors.length}`,
            data: results,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllAttendance,
    importAttendance,
};
