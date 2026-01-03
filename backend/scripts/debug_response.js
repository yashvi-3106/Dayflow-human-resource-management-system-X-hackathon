const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const runDebug = async () => {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('Token received.');

        console.log('2. Creating Employee...');
        const uniqueEmail = `debug.${Date.now()}@test.com`;
        const res = await axios.post(`${API_URL}/employees`, {
            firstName: "Debug",
            lastName: "User",
            email: uniqueEmail,
            phone: "0000000000",
            department: "6958a1130ecdbc9581ef8c28", // Assuming this ID exists from previous logs, if not it might fail but we'll see the 500 error
            designation: "Tester",
            joiningDate: "2026-01-01"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('\n--- RAW RESPONSE DATA ---');
        console.log(JSON.stringify(res.data, null, 2));
        console.log('-------------------------\n');

        if (res.data.data.tempPassword) {
            console.log('✅ SUCCESS: tempPassword is present!');
        } else {
            console.log('❌ FAILURE: tempPassword is MISSING.');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Response:', error.response.data);
        }
    }
};

runDebug();
