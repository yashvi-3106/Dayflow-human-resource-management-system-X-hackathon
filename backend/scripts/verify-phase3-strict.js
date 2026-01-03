const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 3 Refinement (Strict Attendance) Verification...\n');

        // 1. Admin Login (Needed for creating employee & import)
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        const adminToken = adminRes.data.data.token;
        console.log('✅ Admin Logged In.');

        // 2. Create Active Dept (for employee)
        const randDept = "DeptAtt" + Date.now();
        const deptRes = await axios.post(`${API_URL}/departments`, { name: randDept }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const deptId = deptRes.data.data._id;

        // 3. Create Employee (for Manual Test)
        const unique = Date.now();
        const rand = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const empRes = await axios.post(`${API_URL}/employees`, {
            firstName: `${rand}ttend`,
            lastName: "User",
            email: `att.${unique}@test.com`,
            phone: "9999999999",
            department: deptId,
            designation: "Worker"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const { loginId, tempPassword } = empRes.data.data;
        console.log(`✅ Employee Created: ${loginId}`);

        // Verify email to login
        // Skipping email verify step requires manual DB update or loopback? 
        // OR: We simply verify email using the link?
        // Wait, Phase 2 Strict enforced Verification. We MUST verify strict.
        // We know the token logic is removed from response.
        // **Challenge**: Getting the link.
        // **Solution**: I will use `mongoose` in this script to fetch the user and toggle `isVerified`.
        // This is safe for a test script running on the backend machine.

        const mongoose = require('mongoose');
        require('dotenv').config();

        // Dynamic connect if not connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms');
        }

        const User = require('../src/models/User'); // Path relative to script execution? No, script is in /backend/scripts
        // Should be '../src/models/User' relative to scripts folder.
        // But let's assume running from backend root? 
        // Cwd is /backend. So path is `./src/models/User`.
        const user = await User.findOne({ loginId });
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        console.log('✅ Employee Manually Verified via DB Hack (Test Only).');

        // 4. Employee Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: tempPassword });
        let empToken = loginRes.data.data.token;

        // Change Password First
        await axios.post(`${API_URL}/auth/change-password`, {
            currentPassword: tempPassword,
            newPassword: 'password123'
        }, { headers: { Authorization: `Bearer ${empToken}` } });

        // Re-login
        const finalLogin = await axios.post(`${API_URL}/auth/login`, { loginId, password: 'password123' });
        empToken = finalLogin.data.data.token;
        console.log('✅ Employee Logged In & Active.');

        // 5. Manual Clock In
        await axios.post(`${API_URL}/attendance/clock-in`, {}, { headers: { Authorization: `Bearer ${empToken}` } });
        console.log('✅ Manual Clock In Success.');

        // 6. Manual Clock Out ( Simulate 5 hours -> HALF_DAY )
        // We need to wait or hack the DB to change clockIn time back?
        // Let's hack DB to set clockIn to 5 hours ago.
        const Attendance = require('../src/models/Attendance');
        const attRecord = await Attendance.findOne({ employee: user.employeeId, date: { $gte: new Date().setHours(0, 0, 0, 0) } });
        attRecord.clockIn = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
        await attRecord.save();

        const outRes = await axios.post(`${API_URL}/attendance/clock-out`, {}, { headers: { Authorization: `Bearer ${empToken}` } });
        // Verify Status
        if (outRes.data.data.status === 'HALF_DAY') {
            console.log(`✅ Clock Out Verified: Status is HALF_DAY (5 hrs worked).`);
        } else {
            console.error(`❌ Status Mismatch: ${outRes.data.data.status} (Expected HALF_DAY)`);
        }

        // 7. Machine Import (Override to PRESENT)
        // Import JSON with 9 hours worked
        const todayStr = new Date().toISOString().split('T')[0];
        const importData = [
            {
                employeeCode: loginId,
                date: todayStr,
                checkIn: "08:00",
                checkOut: "17:00" // 9 hours
            }
        ];

        const importRes = await axios.post(`${API_URL}/admin/attendance/import`, {
            records: importData
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        console.log(`✅ Machine Import Processed: ${importRes.data.message}`);

        // Verify Override
        const updatedAtt = await Attendance.findOne({ _id: attRecord._id });
        if (updatedAtt.status === 'PRESENT' && updatedAtt.source === 'MACHINE') {
            console.log('✅ Machine Import Overrode Manual Record -> PRESENT.');
        } else {
            console.error(`❌ Override Failed. Status: ${updatedAtt.status}, Source: ${updatedAtt.source}`);
        }

        console.log('\n🎉 Phase 3 Refinement Verification Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
        process.exit(1);
    }
};

runVerification();
