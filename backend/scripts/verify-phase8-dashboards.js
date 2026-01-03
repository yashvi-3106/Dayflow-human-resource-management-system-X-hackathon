const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5001/api';
require('dotenv').config();

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 8 (Dashboards) Verification...\n');

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms');
        }

        // 1. Admin Login
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        const adminToken = adminRes.data.data.token;
        console.log('✅ Admin Logged In.');

        // 2. Fetch Admin Dashboard
        const adminDashRes = await axios.get(`${API_URL}/dashboard/admin`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const adminData = adminDashRes.data.data;

        console.log('\n📊 Admin Dashboard Stats:');
        console.log(`   - Employees: Total=${adminData.employees.total}, Active=${adminData.employees.active}`);
        console.log(`   - Attendance Today: Present=${adminData.attendance.present}, Absent=${adminData.attendance.absent}`);
        console.log(`   - Pending Leaves: ${adminData.leaves.pending}`);

        if (adminData.employees.total > 0 && adminData.attendance) {
            console.log('✅ Admin Dashboard Structure Valid.');
        } else {
            console.warn('⚠️ Admin Dashboard Empty? Check data.');
        }

        // 3. Login as Employee (reuse one from previous phases if possible or create new)
        // Let's create a temp one for guaranteed cleanliness
        const unique = Date.now();
        const randDept = "DeptDash" + unique;
        const deptRes = await axios.post(`${API_URL}/departments`, { name: randDept }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const deptId = deptRes.data.data._id;

        const empRes = await axios.post(`${API_URL}/employees`, {
            firstName: "Dash",
            lastName: "User",
            email: `dash.${unique}@test.com`,
            phone: "9988001144",
            department: deptId,
            designation: "Analyst"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const loginId = empRes.data.data.loginId;
        const pwd = empRes.data.data.tempPassword;
        console.log(`\n✅ Created Dashboard Test Employee: ${loginId}`);

        // Login
        const User = require('../src/models/User');
        await User.updateOne({ loginId: loginId }, { isVerified: true, verificationToken: undefined });
        let userRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: pwd });
        let userToken = userRes.data.data.token;
        // Password Change
        await axios.post(`${API_URL}/auth/change-password`, { currentPassword: pwd, newPassword: 'password123' }, { headers: { Authorization: `Bearer ${userToken}` } });
        userToken = (await axios.post(`${API_URL}/auth/login`, { loginId, password: 'password123' })).data.data.token;

        // Mark Attendance to see it in dashboard
        await axios.post(`${API_URL}/attendance/clock-in`, {}, { headers: { Authorization: `Bearer ${userToken}` } });
        console.log('✅ Employee Clocked In.');

        // 4. Fetch Employee Dashboard
        const empDashRes = await axios.get(`${API_URL}/dashboard/employee`, { headers: { Authorization: `Bearer ${userToken}` } });
        const empData = empDashRes.data.data;

        console.log('\n📊 Employee Dashboard Stats:');
        console.log(`   - Attendance: ${empData.attendance.status} (In: ${empData.attendance.clockIn})`);
        console.log(`   - Notifications: ${empData.notifications.length}`);

        if (empData.attendance.status === 'PRESENT' || empData.attendance.status === 'HALF_DAY') {
            console.log('✅ Employee Dashboard accurately reflects Clock-In.');
        } else {
            console.error('❌ Employee Dashboard shows wrong attendance status:', empData.attendance.status);
            process.exit(1);
        }

        console.log('\n🎉 Phase 8 Verification Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        if (error.response) console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        process.exit(1);
    }
};

runVerification();
