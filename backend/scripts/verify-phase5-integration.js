const axios = require('axios');
const mongoose = require('mongoose');
const Attendance = require('../src/models/Attendance');

const API_URL = 'http://localhost:5001/api';
require('dotenv').config();

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 5 Refinement (Payroll Integration) Verification...\n');

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

        // 2. Create Employee
        const randDept = "DeptPay" + Date.now();
        const deptRes = await axios.post(`${API_URL}/departments`, { name: randDept }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const deptId = deptRes.data.data._id;

        const unique = Date.now();
        const empRes = await axios.post(`${API_URL}/employees`, {
            firstName: "Pay",
            lastName: "Roll",
            email: `pay.${unique}@test.com`,
            phone: "1112223334",
            department: deptId,
            designation: "Analyst"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const employeeId = empRes.data.data.employee._id;
        console.log(`✅ Employee Created: ${empRes.data.data.loginId} (${employeeId})`);

        // 3. Seed Attendance (Current Month)
        const today = new Date();
        const year = today.getFullYear();
        const monthIndex = today.getMonth(); // 0-11
        const monthNum = String(monthIndex + 1).padStart(2, '0');
        const monthStr = `${year}-${monthNum}`;

        console.log(`ℹ️ Seeding Attendance for ${monthStr}...`);

        // Helper to create UTC Date properly
        const createUTCDate = (day) => {
            return new Date(Date.UTC(year, monthIndex, day));
        };

        // 20 Days Present (Day 1 to 20)
        for (let i = 1; i <= 20; i++) {
            await Attendance.create({
                employee: employeeId,
                date: createUTCDate(i),
                status: 'PRESENT',
                source: 'MACHINE'
            });
        }

        // 2 Days Half Day (Day 21, 22)
        for (let i = 21; i <= 22; i++) {
            await Attendance.create({
                employee: employeeId,
                date: createUTCDate(i),
                status: 'HALF_DAY',
                source: 'MANUAL'
            });
        }

        // 1 Day Paid Leave (Day 23)
        await Attendance.create({
            employee: employeeId,
            date: createUTCDate(23),
            status: 'LEAVE',
            remarks: 'Leave Approved: SICK (PAID)',
            source: 'MANUAL'
        });

        // 1 Day Unpaid Leave (Day 24)
        await Attendance.create({
            employee: employeeId,
            date: createUTCDate(24),
            status: 'LEAVE',
            remarks: 'Leave Approved: UNPAID',
            source: 'MANUAL'
        });

        console.log('✅ Attendance Seeded: 20 Pres + 2 Half + 1 Paid + 1 Unpaid.');
        // Expected Payable: 20 + (2*0.5) + 1 + 0 = 22 Days.

        // 4. Generate Payroll
        // Gross: 30000
        const payrollRes = await axios.post(`${API_URL}/admin/payroll/generate/${employeeId}`, {
            month: monthStr,
            grossSalary: 30000
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const payroll = payrollRes.data.data;
        console.log(`✅ Payroll Generated. Status: ${payroll.status}`);
        console.log(`   Payable Days: ${payroll.payableDays}`);
        console.log(`   Net Salary: ${payroll.netSalary}`);

        // Verify
        if (payroll.payableDays === 22) {
            console.log('✅ Payable Days Verified (22).');
        } else {
            console.error(`❌ Payable Days Mismatch: Got ${payroll.payableDays}, Expected 22.`);
            process.exit(1);
        }

        // Verify Net Salary
        const totalDays = payroll.totalDaysInMonth;

        // Manual Calc
        // Earned Gross
        const daily = 30000 / totalDays;
        const earnedGross = Math.round(daily * 22);

        // Earned Basic (40% of Gross / Total * Payable)
        const basic = Math.round(30000 * 0.40);
        const earnedBasic = Math.round((basic / totalDays) * 22);

        const earnedPF = Math.round(earnedBasic * 0.12);
        const earnedIns = Math.round(earnedBasic * 0.02);
        const earnedDed = earnedPF + earnedIns;

        const expectedNet = earnedGross - earnedDed;

        if (Math.abs(payroll.netSalary - expectedNet) <= 1) {
            console.log(`✅ Net Salary Verified: ${payroll.netSalary} (Expected ~${expectedNet})`);
        } else {
            console.error(`❌ Net Salary Mismatch: Got ${payroll.netSalary}, Expected ${expectedNet}`);
            process.exit(1);
        }

        console.log('\n🎉 Phase 5 Refinement Verification Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
        process.exit(1);
    }
};

runVerification();
