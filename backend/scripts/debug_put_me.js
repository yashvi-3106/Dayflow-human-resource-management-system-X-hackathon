const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const runDebug = async () => {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        const adminToken = loginRes.data.data.token;
        console.log('✅ Admin Token received.');

        console.log('2. Creating Employee (Alice)...');
        const uniqueEmail = `alice.${Date.now()}@debug.com`;
        const createRes = await axios.post(`${API_URL}/employees`, {
            firstName: "Alice",
            lastName: "Debug",
            email: uniqueEmail,
            phone: "1112223333",
            department: "6958a1130ecdbc9581ef8c28", // Dummy Dept ID
            designation: "Tester",
            joiningDate: "2026-03-01"
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        const { loginId, tempPassword } = createRes.data.data;
        console.log(`✅ Employee Created: ${loginId} / ${tempPassword}`);

        console.log('3. Logging in as Employee...');
        const empLoginRes = await axios.post(`${API_URL}/auth/login`, {
            loginId: loginId,
            password: tempPassword
        });
        const empToken = empLoginRes.data.data.token;
        console.log('✅ Employee Token received.');

        console.log('4. Testing PUT /api/employees/me ...');
        const updateRes = await axios.put(`${API_URL}/employees/me`, {
            address: "123 Debug Lane, Test City"
        }, {
            headers: { Authorization: `Bearer ${empToken}` }
        });

        console.log('✅ PUT /me Response Status:', updateRes.status);
        console.log('Response Data:', updateRes.data);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

runDebug();
