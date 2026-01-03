const axios = require('axios');

const API_URL = 'http://localhost:5001/api/auth';

const testLogin = async () => {
    try {
        // 1. Test Admin Login (Should succeed)
        console.log('Testing Admin Login...');
        const adminRes = await axios.post(`${API_URL}/login`, {
            email: 'admin@dayflow.io',
            password: 'password123',
        });
        console.log('✅ Admin Login Success:', adminRes.data.success);
        console.log('Token:', adminRes.data.data.token ? 'Received' : 'Missing');

        // 2. Test Invalid Login (Should fail)
        console.log('\nTesting Invalid Login...');
        try {
            await axios.post(`${API_URL}/login`, {
                email: 'admin@dayflow.io',
                password: 'wrongpassword',
            });
        } catch (error) {
            console.log('✅ Invalid Login Failed as expected:', error.response.data.message);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

testLogin();
