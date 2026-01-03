const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 4 (Leave) Verification...\n');

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
            firstName: "Leave",
            lastName: "Tester",
            email: `leave.${unique}@test.com`,
            phone: "9999999999",
            department: "6958a1130ecdbc9581ef8c28",
            designation: "Staff",
            joiningDate: "2026-01-01"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const { loginId, tempPassword } = empRes.data.data;
        const empId = empRes.data.data.employee._id;
        console.log(`✅ Test Employee Created: ${loginId}`);

        // 3. Employee Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: tempPassword });
        const empToken = loginRes.data.data.token;
        console.log('✅ Employee Logged In.');

        // 4. Apply for Leave (2 days)
        // Tomorrow and Day after
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);

        const applyRes = await axios.post(`${API_URL}/leaves/apply`, {
            type: 'PAID',
            fromDate: tomorrow.toISOString(),
            toDate: dayAfter.toISOString(),
            reason: 'Verification Test'
        }, { headers: { Authorization: `Bearer ${empToken}` } });

        const leaveId = applyRes.data.data._id;
        console.log(`✅ Leave Applied: ${applyRes.data.message} (ID: ${leaveId})`);

        // 5. Verify Overlap Block
        try {
            await axios.post(`${API_URL}/leaves/apply`, {
                type: 'SICK',
                fromDate: tomorrow.toISOString(),
                toDate: tomorrow.toISOString(),
                reason: 'Overlap Test'
            }, { headers: { Authorization: `Bearer ${empToken}` } });
            console.log('❌ FAIL: Overlap allowed!');
        } catch (e) {
            console.log('✅ Overlap Application Blocked (400).');
        }

        // 6. Admin Approve Leave
        const actionRes = await axios.patch(`${API_URL}/admin/leaves/${leaveId}/action`, {
            status: 'APPROVED',
            remarks: 'Have fun'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log(`✅ Leave Approved: ${actionRes.data.message}`);
        console.log(`   Sync Stats: Created ${actionRes.data.sync.created}, Skipped ${actionRes.data.sync.skipped}`);

        // 7. Verify Attendance Sync
        // We expect attendance records for tomorrow and dayAfter
        const attRes = await axios.get(`${API_URL}/admin/attendance`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            params: { employee: empId } // Filter by new employee if logic supported, or just fetch all
        });

        // Find our records
        // Note: admin/attendance filters by date or employee via query, let's just inspect returned list
        const records = attRes.data.data.filter(r => r.employee._id === empId || r.employee === empId);

        // Check if records with status 'ON_LEAVE' exist
        const leaveRecords = records.filter(r => r.status === 'ON_LEAVE');
        if (leaveRecords.length >= 2) {
            console.log(`✅ Attendance Sync Verified: Found ${leaveRecords.length} ON_LEAVE records.`);
        } else {
            console.log(`❌ Attendance Sync FAIL: Found ${leaveRecords.length} records, expected 2.`);
        }

        console.log('\n🎉 Phase 4 Verification Complete!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
};

runVerification();
