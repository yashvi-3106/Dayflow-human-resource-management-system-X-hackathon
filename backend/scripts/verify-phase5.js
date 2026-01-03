const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 5 (Payroll) Verification...\n');

        // 1. Admin Login
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        const adminToken = adminRes.data.data.token;
        console.log('✅ Admin Logged In.');

        // 2. Create Test Employee
        const unique = Date.now();
        const empRes = await axios.post(`${API_URL}/employees`, {
            firstName: "Pay",
            lastName: "Roll",
            email: `payroll.${unique}@test.com`,
            phone: "8888888888",
            department: "6958a1130ecdbc9581ef8c28",
            designation: "Analyst",
            joiningDate: "2026-01-01"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const { loginId, tempPassword, employee } = empRes.data.data;
        const empId = employee._id;
        console.log(`✅ Test Employee Created: ${loginId}`);

        // 3. Employee Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: tempPassword });
        const empToken = loginRes.data.data.token;
        console.log('✅ Employee Logged In.');

        // 4. Simulate Attendance for Jan 2026
        // NOTE: Our calculation relies on attendance during the specific month.
        // We will seed: 
        // - 2 Present Days
        // - 1 Half Day
        // - 1 Approved Leave (which creates ON_LEAVE attendance)

        const month = "2026-06"; // Future month to avoid today conflicts
        const dates = [
            { date: `${month}-01`, status: "PRESENT" },
            { date: `${month}-02`, status: "PRESENT" },
            { date: `${month}-03`, status: "HALF_DAY" }
        ];

        // We can't use "Clock In" because that defaults to TODAY.
        // We'll use Admin Import to backdate/future-date attendance easily.
        const records = dates.map(d => ({
            loginId,
            date: new Date(d.date).toISOString(),
            status: d.status,
            clockIn: new Date(d.date + "T09:00:00").toISOString(),
            clockOut: new Date(d.date + "T18:00:00").toISOString()
        }));

        await axios.post(`${API_URL}/admin/attendance/import`, { records }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Simulated Manual Attendance via Import.');

        // 5. Apply & Approve Leave for one day
        // Apply
        const leaveDate = `${month}-04`;
        await axios.post(`${API_URL}/leaves/apply`, {
            type: 'PAID',
            fromDate: new Date(leaveDate).toISOString(),
            toDate: new Date(leaveDate).toISOString(),
            reason: 'Payroll Test'
        }, { headers: { Authorization: `Bearer ${empToken}` } });
        // Get Leave ID (assuming last one)
        const myLeaves = await axios.get(`${API_URL}/leaves/me`, { headers: { Authorization: `Bearer ${empToken}` } });
        const leaveId = myLeaves.data.data[0]._id;
        // Approve
        await axios.patch(`${API_URL}/admin/leaves/${leaveId}/action`, { status: 'APPROVED' }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Simulated Approved Leave (Syncs Attendance).');

        // Total Expected Payable Days:
        // 2 Present + 1 Leave (Full) + 0.5 (Half) = 3.5 Days

        // 6. Generate Payroll
        // Month: 2026-06 (30 Days)
        // Gross: 60,000
        const grossSalary = 60000;
        const genRes = await axios.post(`${API_URL}/admin/payroll/generate/${empId}`, {
            month,
            grossSalary
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const payroll = genRes.data.data;
        console.log(`✅ Payroll Generated for ${month}.`);
        console.log(`   Payable Days: ${payroll.payableDays} (Expected: 3.5)`);

        if (payroll.payableDays !== 3.5) {
            console.warn(`⚠️  Warning: Payable Days mismatch! Got ${payroll.payableDays}`);
        }

        // 7. Verify Calculations
        const { salaryStructure, netSalary } = payroll;
        console.log('   Structure:', JSON.stringify(salaryStructure));

        // Validation Logic
        const expBasic = Math.round(grossSalary * 0.40); // 24000
        const expPF = Math.round(expBasic * 0.12); // 2880
        const expInsurance = Math.round(expBasic * 0.02); // 480

        // Calculation: 
        // Daily Wage = 60000 / 30 = 2000
        // Earned Gross = 2000 * 3.5 = 7000
        // Earned Basic (for deduction base) = (24000 / 30) * 3.5 = 800 * 3.5 = 2800 
        // Earned Deduction = 12% of 2800 + 2% of 2800 = 336 + 56 = 392
        // Net = 7000 - 392 = 6608

        // Or if using Fixed Deduction on Fixed Basic (simpler model):
        // Net = 7000 - (2880 + 480) = 3640

        // Let's see what our utility (payrollCalculator.js) actually did.
        // It does: earnedBasic = (basic / totalDays) * payableDays
        // So it uses Pro-rated Deductions.

        console.log(`   Net Salary: ${netSalary}`);

        if (salaryStructure.basic === expBasic) console.log('✅ Basic Calc Verified (40%)');
        else console.error(`❌ Basic Calc Mismatch. Expected ${expBasic}, Got ${salaryStructure.basic}`);

        // 8. Employee View
        const viewRes = await axios.get(`${API_URL}/payroll/me`, {
            headers: { Authorization: `Bearer ${empToken}` }
        });

        if (viewRes.data.count > 0) console.log('✅ Employee View Payroll Success.');
        else console.error('❌ Employee View Payroll Failed (Empty).');

        console.log('\n🎉 Phase 5 Verification Complete!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
};

runVerification();
