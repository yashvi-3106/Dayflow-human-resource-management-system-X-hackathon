const Attendance = require('../models/Attendance');

// Helper to normalize date to midnight UTC
const normalizeDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

// @desc    Clock In (Manual)
// @route   POST /api/attendance/clock-in
// @access  Private (Employee)
const clockIn = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'Employee profile not linked' });
        }

        const today = normalizeDate();

        // Check if already clocked in
        const existingAttendance = await Attendance.findOne({
            employee: employeeId,
            date: today,
        });

        if (existingAttendance) {
            return res.status(400).json({ success: false, message: 'Attendance record already exists for today' });
        }

        const attendance = await Attendance.create({
            employee: employeeId,
            date: today,
            clockIn: new Date(),
            status: 'PRESENT',
            source: 'MANUAL',
        });

        res.status(201).json({ success: true, message: 'Clocked in successfully', data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Clock Out (Manual)
// @route   POST /api/attendance/clock-out
// @access  Private (Employee)
const clockOut = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        const today = normalizeDate();

        const attendance = await Attendance.findOne({
            employee: employeeId,
            date: today,
        });

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'No attendance record found for today. Please clock in first.' });
        }

        if (attendance.clockOut) {
            return res.status(400).json({ success: false, message: 'Already clocked out for today' });
        }

        attendance.clockOut = new Date();

        // Calculate duration in minutes
        const diffMs = attendance.clockOut - attendance.clockIn;
        const diffMins = Math.floor(diffMs / 1000 / 60);
        attendance.workDuration = diffMins;

        // Calculate Work Hours & Extra Hours strings
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const workHoursStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

        // Assume 9 hours is standard work day
        let extraHoursStr = '00:00';
        if (diffMins > 540) { // 9 * 60 = 540
            const extraDiff = diffMins - 540;
            const extraH = Math.floor(extraDiff / 60);
            const extraM = extraDiff % 60;
            extraHoursStr = `${String(extraH).padStart(2, '0')}:${String(extraM).padStart(2, '0')}`;
        }

        // Save these for frontend display ease (or return in response only if not persisting)
        // For now, we can attach to the response object dynamically or rely on frontend to calc
        // But requested wireframe implies strict data. 
        // Let's add them to the response specifically.

        // Strict Status Logic
        if (hours >= 9) {
            attendance.status = 'PRESENT';
        } else if (hours >= 4) {
            attendance.status = 'HALF_DAY';
        } else {
            attendance.status = 'ABSENT';
        }

        await attendance.save();

        res.json({
            success: true,
            message: 'Clocked out successfully',
            data: {
                ...attendance.toObject(),
                workHours: workHoursStr,
                extraHours: extraHoursStr
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Attendance Stats
// @route   GET /api/attendance/stats
// @access  Private (Employee)
const getAttendanceStats = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const attendanceRecords = await Attendance.find({
            employee: employeeId,
            date: { $gte: firstDay, $lte: lastDay }
        });

        const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
        // Mock leaves/total working days for now or calc broadly
        // Assuming 22 workings days standard

        res.json({
            success: true,
            data: {
                presentDays: presentCount,
                leavesCount: 0, // Placeholder needs Leave module integration
                totalWorkingDays: 22 // Placeholder
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get My Attendance History
// @route   GET /api/attendance/me
// @access  Private (Employee)
const getMyAttendance = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;

        // Optional filters: month, year (default current)
        // For simplified MVP, just return last 30 records
        const attendance = await Attendance.find({ employee: employeeId })
            .sort({ date: -1 })
            .limit(30);

        // Enrich data with formatted strings
        const enrichedData = attendance.map(rec => {
            let workHours = '00:00';
            let extraHours = '00:00';

            if (rec.workDuration) {
                const h = Math.floor(rec.workDuration / 60);
                const m = rec.workDuration % 60;
                workHours = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

                if (rec.workDuration > 540) {
                    const extra = rec.workDuration - 540;
                    const eh = Math.floor(extra / 60);
                    const em = extra % 60;
                    extraHours = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                }
            }

            return {
                ...rec.toObject(),
                workHours,
                extraHours
            };
        });

        res.json({ success: true, count: attendance.length, data: enrichedData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    clockIn,
    clockOut,
    getMyAttendance,
    getAttendanceStats
};
