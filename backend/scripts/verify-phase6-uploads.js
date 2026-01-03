const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data'); // You might need 'form-data' package if not available, but axios in node needs it? 
// Wait, 'axios' usually handles form data if we pass a stream or proper headers.
// Ideally, we should install 'form-data' package for reliable Multipart in Node.js.
// Let's assume user environment might not have it strictly, but let's try standard approach or use boundary manually?
// No, keep it simple. If it fails, I'll install form-data.

// Wait, I can't install packages mid-script without tool call.
// Is 'form-data' installed? It's often deeper dependency of axios 0.x, but verify.
// Checking package.json... axios 1.13.2. 
// Axios docs say in Node.js you need 'form-data' or similar for multipart.
// I will just use 'form-data' assuming it's standard or try to install it?
// Safer: Install 'form-data' first.

const API_URL = 'http://localhost:5001/api';
require('dotenv').config();

// Temporary test file creation
const createTestFile = (name, content) => {
    const p = path.join(__dirname, name);
    fs.writeFileSync(p, content);
    return p;
};

const runVerification = async () => {
    try {
        // We need FormData. If module not found, script fails.
        // I will try to require it, if fail, exit with message to install.
        let FormData;
        try {
            FormData = require('form-data');
        } catch (e) {
            console.error('❌ Missing dependency: form-data. Please install it.');
            process.exit(1);
        }

        console.log('🚀 Starting Phase 6 (Media Uploads) Verification...\n');

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

        // 2. Create Employee 1
        const unique = Date.now();
        const emp1Res = await axios.post(`${API_URL}/employees`, {
            firstName: "Doc",
            lastName: "Owner",
            email: `doc.${unique}@test.com`,
            phone: "9988776655",
            department: (await axios.get(`${API_URL}/departments`, { headers: { Authorization: `Bearer ${adminToken}` } })).data.data[0]._id, // First dept
            designation: "Staff"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const loginId1 = emp1Res.data.data.loginId;
        const pwd1 = emp1Res.data.data.tempPassword;
        console.log(`✅ Employee 1 Created: ${loginId1}`);

        // Verify Emp 1
        const User = require('../src/models/User');
        await User.updateOne({ loginId: loginId1 }, { isVerified: true, verificationToken: undefined });

        // Login Emp 1
        const login1 = await axios.post(`${API_URL}/auth/login`, { loginId: loginId1, password: pwd1 });
        let token1 = login1.data.data.token;
        // Skip pwd change for speed if allowed? No, Auth middleware might allow if no change required?
        // Phase 1 usually forced change password.
        await axios.post(`${API_URL}/auth/change-password`, { currentPassword: pwd1, newPassword: 'password123' }, { headers: { Authorization: `Bearer ${token1}` } });
        token1 = (await axios.post(`${API_URL}/auth/login`, { loginId: loginId1, password: 'password123' })).data.data.token;

        // 3. Create Test Image
        const imagePath = createTestFile('test-avatar.png', 'fake png content');

        // 4. Upload Avatar
        const form = new FormData();
        form.append('file', fs.createReadStream(imagePath));

        const uploadRes = await axios.post(`${API_URL}/employees/upload-avatar`, form, {
            headers: {
                Authorization: `Bearer ${token1}`,
                ...form.getHeaders()
            }
        });

        console.log('✅ Upload Avatar Success:', uploadRes.data.data.url);
        const avatarUrl = uploadRes.data.data.url; // /api/media/filename...

        // 5. Verify Access (Owner)
        try {
            const getRes = await axios.get(`http://localhost:5001${avatarUrl}`, {
                headers: { Authorization: `Bearer ${token1}` }
            });
            console.log('✅ Generic Access Success.');
        } catch (e) {
            console.error('❌ Owner Access Failed:', e.message);
        }

        // 6. Create Employee 2
        const emp2Res = await axios.post(`${API_URL}/employees`, {
            firstName: "Spy",
            lastName: "Hacker",
            email: `spy.${unique}@test.com`,
            phone: "1122334455",
            department: (await axios.get(`${API_URL}/departments`, { headers: { Authorization: `Bearer ${adminToken}` } })).data.data[0]._id,
            designation: "Spy"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const loginId2 = emp2Res.data.data.loginId;
        const pwd2 = emp2Res.data.data.tempPassword;
        // Verify Emp 2
        await User.updateOne({ loginId: loginId2 }, { isVerified: true, verificationToken: undefined });
        // Login Emp 2
        const login2 = await axios.post(`${API_URL}/auth/login`, { loginId: loginId2, password: pwd2 });
        let token2 = login2.data.data.token;
        await axios.post(`${API_URL}/auth/change-password`, { currentPassword: pwd2, newPassword: 'password123' }, { headers: { Authorization: `Bearer ${token2}` } });
        token2 = (await axios.post(`${API_URL}/auth/login`, { loginId: loginId2, password: 'password123' })).data.data.token;

        // 7. Verify Unauth Access (Spy tries to see Doc's avatar)
        try {
            await axios.get(`http://localhost:5001${avatarUrl}`, {
                headers: { Authorization: `Bearer ${token2}` }
            });
            console.error('❌ FAIL: Unauthorized user could view file!');
        } catch (e) {
            if (e.response && e.response.status === 403) {
                console.log('✅ Unauthorized Access Blocked (403).');
            } else {
                console.error(`❌ Unexpected Error: ${e.message}`);
            }
        }

        // 8. Verify Admin Access
        try {
            await axios.get(`http://localhost:5001${avatarUrl}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('✅ Admin Access Success.');
        } catch (e) {
            console.error('❌ Admin Access Failed:', e.message);
        }

        // Cleanup
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        console.log('\n🎉 Phase 6 Verification Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        if (error.response) console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        process.exit(1);
    }
};

runVerification();
