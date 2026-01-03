const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 4 Refinement (Strict Leave) Verification...\n');

        // 1. Admin Login
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        const adminToken = adminRes.data.data.token;
        console.log('✅ Admin Logged In.');

        // 2. Create Active Dept
        const randDept = "DeptLeave" + Date.now();
        const deptRes = await axios.post(`${API_URL}/departments`, { name: randDept }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const deptId = deptRes.data.data._id;

        // 3. Create Employee
        const unique = Date.now();
        const rand = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const empRes = await axios.post(`${API_URL}/employees`, {
            firstName: `${rand}eave`,
            lastName: "User",
            email: `leave.${unique}@test.com`,
            phone: "9876543210",
            department: deptId,
            designation: "Staff"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const { loginId, tempPassword } = empRes.data.data;
        const employeeId = empRes.data.data.employee._id;
        console.log(`✅ Employee Created: ${loginId}`);

        // Verify Email Hack (Same as Phase 3)
        const mongoose = require('mongoose');
        require('dotenv').config();
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms');
        }
        const User = require('../src/models/User');
        const user = await User.findOne({ loginId });
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        console.log('✅ Employee Verified via DB.');

        // 4. Employee Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: tempPassword });
        let empToken = loginRes.data.data.token;

        // Change Password
        await axios.post(`${API_URL}/auth/change-password`, { currentPassword: tempPassword, newPassword: 'password123' }, { headers: { Authorization: `Bearer ${empToken}` } });
        const finalLogin = await axios.post(`${API_URL}/auth/login`, { loginId, password: 'password123' });
        empToken = finalLogin.data.data.token;
        console.log('✅ Employee Logged In & Active.');

        // 5. Apply Leave (Range 1)
        // Tomorrow + 2 days
        const today = new Date();
        const start = new Date(today); start.setDate(start.getDate() + 1);
        const end = new Date(today); end.setDate(end.getDate() + 3); // 3 days

        const leaveRes = await axios.post(`${API_URL}/leaves/apply`, {
            type: 'PAID',
            fromDate: start,
            toDate: end,
            reason: 'Vacation'
        }, { headers: { Authorization: `Bearer ${empToken}` } });
        const leaveId = leaveRes.data.data._id;
        console.log(`✅ Leave Applied: ${leaveId} (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`);

        // 6. Test Overlap (Apply again in same range)
        try {
            await axios.post(`${API_URL}/leaves/apply`, {
                type: 'SICK',
                fromDate: start, // exact overlap
                toDate: end,
                reason: 'Sick overlapping'
            }, { headers: { Authorization: `Bearer ${empToken}` } });
            console.error('❌ FAIL: Allowed overlapping leave application!');
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log('✅ Blocked Overlapping Leave Request.');
            } else {
                console.error(`❌ Unexpected Error: ${e.message}`);
            }
        }

        // 7. Admin Approve & Verify Sync
        const approveRes = await axios.patch(`${API_URL}/admin/leaves/${leaveId}/action`, {
            status: 'APPROVED',
            remarks: 'Have fun'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        console.log(`✅ Leave Approved. Sync Stats:`, approveRes.data.sync);

        // 8. Verify Attendance Auto-Creation
        // Check for start date
        const Attendance = require('../src/models/Attendance');
        const startNorm = new Date(start); startNorm.setUTCHours(0, 0, 0, 0);

        const attRecord = await Attendance.findOne({ employee: employeeId, date: startNorm });
        if (attRecord && attRecord.status === 'LEAVE') {
            console.log('✅ Attendance Auto-Created with Status LEAVE.');
        } else {
            console.error(`❌ Attendance Missing or Wrong Status. Record: ${attRecord}`);
        }

        console.log('\n🎉 Phase 4 Refinement Verification Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
        process.exit(1);
    }
};

runVerification();
