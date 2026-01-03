const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5001/api';
require('dotenv').config();

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 7 (Logs & Notifications) Verification...\n');

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms');
        }

        // 1. Admin Login (Should trigger USER_LOGIN audit if logic was added to Auth, oh wait, I added logic to AuthController)
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        const adminToken = adminRes.data.data.token;
        console.log('✅ Admin Logged In.');

        // 2. Create Employee (Should trigger EMPLOYEE_CREATED audit + Notification)
        const unique = Date.now();
        const randDept = "DeptLogs" + unique;
        const deptRes = await axios.post(`${API_URL}/departments`, { name: randDept }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const deptId = deptRes.data.data._id;

        const empRes = await axios.post(`${API_URL}/employees`, {
            firstName: "Log",
            lastName: "User",
            email: `log.${unique}@test.com`,
            phone: "9988001122",
            department: deptId,
            designation: "Tester"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const loginId = empRes.data.data.loginId;
        const pwd = empRes.data.data.tempPassword;
        console.log(`✅ Employee Created: ${loginId}`);

        // 3. User Login
        const User = require('../src/models/User');
        await User.updateOne({ loginId: loginId }, { isVerified: true, verificationToken: undefined });

        const loginRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: pwd });
        let userToken = loginRes.data.data.token;
        // Change Pwd
        await axios.post(`${API_URL}/auth/change-password`, { currentPassword: pwd, newPassword: 'password123' }, { headers: { Authorization: `Bearer ${userToken}` } });
        userToken = (await axios.post(`${API_URL}/auth/login`, { loginId, password: 'password123' })).data.data.token;

        // 4. Check User Notifications (Expect "Welcome")
        const notifRes = await axios.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${userToken}` } });
        const notifs = notifRes.data.data;

        console.log(`ℹ️ User Notifications: ${notifs.length}`);
        if (notifs.length > 0 && notifs[0].title.includes('Welcome')) {
            console.log('✅ Welcome Notification Received.');
        } else {
            console.error('❌ Missing Welcome Notification.');
        }

        // 5. Apply Leave
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const leaveReason = `Audit Test ${unique}`;

        await axios.post(`${API_URL}/leaves/apply`, {
            type: 'PAID',
            fromDate: today.toISOString(),
            toDate: nextWeek.toISOString(),
            reason: leaveReason
        }, { headers: { Authorization: `Bearer ${userToken}` } });
        console.log('✅ Leave Applied.');

        // 6. Admin Approves Leave (Should trigger LEAVE_APPROVED audit + Notification)
        // Find the leave
        const Leave = require('../src/models/Leave');
        const leave = await Leave.findOne({ reason: leaveReason });

        if (!leave) {
            throw new Error('Leave not found in DB');
        }

        await axios.patch(`${API_URL}/admin/leaves/${leave._id}/action`, {
            status: 'APPROVED',
            remarks: 'Approved for Audit'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ Leave Approved by Admin.');

        // 7. Check User Notifications (Expect "Leave Request APPROVED")
        const notifRes2 = await axios.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${userToken}` } });
        const latestInfo = notifRes2.data.data[0]; // Sorted by newest

        if (latestInfo.title.includes('Leave Request APPROVED')) {
            console.log('✅ Leave Approval Notification Received.');
            // Mark as read
            await axios.patch(`${API_URL}/notifications/${latestInfo._id}/read`, {}, { headers: { Authorization: `Bearer ${userToken}` } });
            console.log('✅ Notification Marked Read.');
        } else {
            console.error('❌ Missing Leave Notification.', latestInfo);
        }

        // 8. Admin Check Audit Logs
        const logsRes = await axios.get(`${API_URL}/admin/audit-logs`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const logs = logsRes.data.data;

        console.log(`ℹ️ Total Audit Logs: ${logs.length}`);
        const hasAuthLog = logs.some(l => l.action === 'USER_LOGIN');
        const hasEmpLog = logs.some(l => l.action === 'EMPLOYEE_CREATED');
        const hasLeaveLog = logs.some(l => l.action === 'LEAVE_APPROVED');

        if (hasAuthLog && hasEmpLog && hasLeaveLog) {
            console.log('✅ All Audit Logs Verified (Login, EmpCreate, LeaveApprove).');
        } else {
            console.error('❌ Missing Audit Logs.', { hasAuthLog, hasEmpLog, hasLeaveLog });
            process.exit(1);
        }

        console.log('\n🎉 Phase 7 Verification Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        if (error.response) console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        process.exit(1);
    }
};

runVerification();
