const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

const runVerification = async () => {
    try {
        console.log('🚀 Starting Phase 1 Refinement (Strict Security) Verification...\n');

        // 1. Admin Login
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@dayflow.io',
            password: 'password123'
        });
        let adminToken = adminRes.data.data.token;
        console.log('✅ Admin Logged In.');

        if (adminRes.data.data.isFirstLogin) {
            console.log('⚠️ Admin is in First Login state. Changing Admin password...');
            await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword: 'password123',
                newPassword: 'password123' // Keeping it same for simplicity in test env, or 'newpassword123'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });

            // Relogin
            const adminRelogin = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@dayflow.io',
                password: 'password123' // It was hashed, but if I set it to same string, it works.
                // Wait. If I change it to "newpassword123", I must use that.
                // Let's use 'password123' as the "new" password? 
                // Validation might prevent same password? 
                // Let's use 'password1234'.
            });
            adminToken = adminRelogin.data.data.token;
            console.log('✅ Admin Password Changed & Relogged In.');
        } else {
            console.log('ℹ️ Admin already verified.');
        }

        // 2. Create Employee
        const unique = Date.now();
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
        const empRes = await axios.post(`${API_URL}/employees`, {
            firstName: `${randomChar}ecure`,
            lastName: "User",
            email: `secure.${unique}@test.com`,
            phone: "7777777777",
            department: "6958a1130ecdbc9581ef8c28",
            designation: "Sec Officer",
            joiningDate: "2026-01-01"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const { loginId, tempPassword, verificationToken } = empRes.data.data;
        console.log(`✅ Employee Created: ${loginId}`);
        // console.log(`   Token: ${verificationToken}`);

        // 3. Attempt Login (Should Fail - Unverified)
        try {
            await axios.post(`${API_URL}/auth/login`, { loginId, password: tempPassword });
            console.error('❌ FAIL: Login allowed before verification!');
        } catch (e) {
            if (e.response && e.response.status === 401) {
                console.log('✅ Login Blocked (Unverified).');
            } else {
                console.error(`❌ Login Error Mismatch: ${e.response ? e.response.status : e.message}`);
            }
        }

        // 4. Verify Email
        const verifyRes = await axios.get(`${API_URL}/auth/verify-email?token=${verificationToken}`);
        if (verifyRes.status === 200) console.log('✅ Email Verified.');

        // 5. Login Again (Should Succeed, but First Login)
        const firstLoginRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: tempPassword });
        const empToken = firstLoginRes.data.data.token;
        console.log('✅ Login Success (First Login).');

        // 6. Access Protected Route (Should Fail - First Login Guard)
        // Try getting attendance
        try {
            await axios.get(`${API_URL}/attendance/me`, { headers: { Authorization: `Bearer ${empToken}` } });
            console.error('❌ FAIL: Protected route allowed during First Login!');
        } catch (e) {
            if (e.response && e.response.status === 403) {
                console.log('✅ First Login Guard Blocked Access (403).');
            } else {
                console.error(`❌ Guard Error Mismatch: ${e.response ? e.response.status : e.message}`);
            }
        }

        // 7. Change Password
        await axios.post(`${API_URL}/auth/change-password`, {
            currentPassword: tempPassword,
            newPassword: 'securepassword999'
        }, { headers: { Authorization: `Bearer ${empToken}` } });
        console.log('✅ Password Changed.');

        // 8. Re-Login (Normal)
        const finalLoginRes = await axios.post(`${API_URL}/auth/login`, { loginId, password: 'securepassword999' });
        const finalToken = finalLoginRes.data.data.token;

        // 9. Access Protected Route (Should Succeed)
        const attRes = await axios.get(`${API_URL}/attendance/me`, {
            headers: { Authorization: `Bearer ${finalToken}` }
        });
        console.log(`✅ Protected Route Access Granted.`);

        console.log('\n🎉 Phase 1 Refinement Verification Complete!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
};

runVerification();
