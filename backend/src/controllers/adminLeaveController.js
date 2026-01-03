const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// @desc    Get All Leaves (Admin)
// @route   GET /api/admin/leaves
// @access  Private (Admin/HR)
const getAllLeaves = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        // Filter by company
        query.company = req.user.company;

        if (status) {
            query.status = status;
        }

        const leaves = await Leave.find(query)
            .populate('employee', 'firstName lastName loginId designation department')
            .sort({ fromDate: -1 });

        res.json({ success: true, count: leaves.length, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Take Action on Leave (Approve/Reject)
// @route   PATCH /api/admin/leaves/:id/action
// @access  Private (Admin/HR)
const takeLeaveAction = async (req, res) => {
    // Transaction support disabled for Standalone MongoDB
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
        const { status, remarks } = req.body;
        const leaveId = req.params.id;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Use APPROVED or REJECTED' });
        }

        const leave = await Leave.findById(leaveId).populate('employee'); // .session(session);

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        if (leave.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (leave.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: `Leave is already ${leave.status}` });
        }

        // Update Leave Status
        leave.status = status;
        leave.actionBy = req.user._id;
        leave.remarks = remarks || leave.remarks;
        await leave.save(); // { session }

        let syncInfo = { created: 0, skipped: 0 };

        // --- ATTENDANCE SYNC LOGIC ---
        if (status === 'APPROVED') {
            // Loop dates
            let currentDate = new Date(leave.fromDate);
            const endDate = new Date(leave.toDate);

            while (currentDate <= endDate) {
                const normalizedDate = new Date(currentDate);
                normalizedDate.setUTCHours(0, 0, 0, 0);

                // Create or Override Attendance
                await Attendance.findOneAndUpdate(
                    { employee: leave.employee, date: normalizedDate },
                    {
                        employee: leave.employee,
                        date: normalizedDate,
                        status: 'LEAVE',
                        source: 'MANUAL',
                        remarks: `Leave Approved: ${leave.type}`,
                        workDuration: 0
                    },
                    { upsert: true, new: true } // { session }
                );

                syncInfo.created++;

                // Next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // await session.commitTransaction();
        // session.endSession();

        // --- PHASE 7 TRIGGERS ---
        const { logAction } = require('../utils/auditLogger');
        const { createNotification } = require('../utils/notificationService');

        await logAction(req, `LEAVE_${status}`, 'LEAVE', leave._id, { type: leave.type, days: leave.days });
        await createNotification(leave.employee.user, req.user.company, `Leave Request ${status}`, `Your leave request for ${leave.fromDate} has been ${status}.`, status === 'APPROVED' ? 'ACTION' : 'ALERT');
        // ------------------------

        res.json({
            success: true,
            message: `Leave ${status} successfully`,
            data: leave,
            sync: status === 'APPROVED' ? syncInfo : undefined,
        });

    } catch (error) {
        // await session.abortTransaction();
        // session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllLeaves,
    takeLeaveAction,
};
