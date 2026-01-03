const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const debugLoginId = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const testLoginId = `TEST${Date.now()}`;
        console.log(`Creating user with loginId: ${testLoginId}`);

        // Manually create a user to test Mongoose Schema
        const user = await User.create({
            email: `test.${Date.now()}@debug.com`,
            password: 'password123',
            loginId: testLoginId,
            company: new mongoose.Types.ObjectId(), // Fake ID
            role: 'EMPLOYEE'
        });

        console.log('User created. ID:', user._id);

        // Fetch back directly from DB
        const fetchedUser = await User.findById(user._id);
        console.log('Fetched User from DB:', fetchedUser);

        if (fetchedUser.loginId === testLoginId) {
            console.log('✅ PASS: loginId is persisted in DB.');
        } else {
            console.log('❌ FAIL: loginId is MISSING in DB.');
        }

        // Cleanup
        await User.deleteOne({ _id: user._id });
        console.log('Cleanup done.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

debugLoginId();
