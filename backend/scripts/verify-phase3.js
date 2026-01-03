const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
// Use a fixed date to allow re-running tests (need cleanup) or use dynamic today
// For ease, I'll use today but might need to delete old records.

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 3 (Attendance) Verification...\n');

        // 1. Admin Login
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        const adminToken = adminRes.data.data.token;
        console.log('✅ Admin Logged In.');

        // 2. Create a Test Employee (new one to avoid existing attendance conflicts)
        const uniqueSerial = Date.now();
        const empRes = await axios.post(`${API_URL}/employees`, {
            firstName: "Attend",
            lastName: "User",
            email: `attend.${uniqueSerial}@test.com`,
            phone: "5555555555",
            department: "6958a1130ecdbc9581ef8c28",
            designation: "Worker",
            joiningDate: "2026-01-01"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const { loginId, tempPassword } = empRes.data.data;
        console.log(`✅ Test Employee Created: ${loginId}`);

        // 3. Employee Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: tempPassword });
        const empToken = loginRes.data.data.token;
        console.log('✅ Employee Logged In.');

        // 4. Clock In (Manual)
        const clockInRes = await axios.post(`${API_URL}/attendance/clock-in`, {}, {
            headers: { Authorization: `Bearer ${empToken}` }
        });
        console.log(`✅ Clock In Success: ${clockInRes.data.data.status}`);

        // 5. Duplicate Clock In Check (Should Fail)
        try {
            await axios.post(`${API_URL}/attendance/clock-in`, {}, {
                headers: { Authorization: `Bearer ${empToken}` }
            });
            console.log('❌ FAIL: Duplicate Clock In allowed!');
        } catch (e) {
            console.log('✅ Duplicate Clock In blocked (400).');
        }

        // 6. Clock Out
        const clockOutRes = await axios.post(`${API_URL}/attendance/clock-out`, {}, {
            headers: { Authorization: `Bearer ${empToken}` }
        });
        console.log(`✅ Clock Out Success. Duration: ${clockOutRes.data.data.workDuration} min`);

        // 7. Admin Import (Machine) - Create another employee for this
        const uniqueSerial2 = Date.now() + 1;
        const empRes2 = await axios.post(`${API_URL}/employees`, {
            firstName: "Import",
            lastName: "User",
            email: `import.${uniqueSerial2}@test.com`,
            phone: "4444444444",
            department: "6958a1130ecdbc9581ef8c28",
            designation: "Worker",
            joiningDate: "2026-01-01"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const loginId2 = empRes2.data.data.loginId;

        const importPayload = {
            records: [
                {
                    loginId: loginId2,
                    date: new Date().toISOString(),
                    status: 'PRESENT',
                    clockIn: new Date().toISOString(),
                    clockOut: new Date().toISOString()
                }
            ]
        };

        const importRes = await axios.post(`${API_URL}/admin/attendance/import`, importPayload, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Import Result:', importRes.data.message);

        // 8. View All as Admin
        const viewRes = await axios.get(`${API_URL}/admin/attendance`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Admin View: Found ${viewRes.data.count} records.`);

        console.log('\n🎉 Phase 3 Verification Complete!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
};

runVerification();
