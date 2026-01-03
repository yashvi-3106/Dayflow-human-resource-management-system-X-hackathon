require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const Department = require('../models/Department');
const User = require('../models/User');
const Employee = require('../models/Employee');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Company.deleteMany({});
        await Department.deleteMany({});
        await User.deleteMany({});
        await Employee.deleteMany({});

        // 1. Create Company
        const company = await Company.create({
            name: 'Dayflow Inc.',
            address: '123 Tech Park, Silicon Valley, CA',
            website: 'https://dayflow.io',
            phone: '+1-555-0123',
        });
        console.log('Company created');

        // 2. Create Departments
        const hrDept = await Department.create({
            name: 'Human Resources',
            company: company._id,
        });
        const engDept = await Department.create({
            name: 'Engineering',
            company: company._id,
        });
        console.log('Departments created');

        // 3. Create Admin User (The initial super admin)
        const adminUser = await User.create({
            email: 'admin@dayflow.io',
            password: 'password123', // Will be hashed
            role: 'ADMIN',
            company: company._id,
            isVerified: true,
        });
        console.log('Admin User created');

        // 4. Create Employee Profile for Admin (Optional but good for consistency)
        const adminEmployee = await Employee.create({
            firstName: 'System',
            lastName: 'Admin',
            user: adminUser._id,
            company: company._id,
            department: hrDept._id, // Assigning to HR by default
            designation: 'Super Admin',
            status: 'ACTIVE',
            phone: '1234567890', // Dummy phone
        });

        // Link employee back to user
        adminUser.employeeId = adminEmployee._id;
        await adminUser.save();
        console.log('Admin Employee Profile created and linked');

        console.log('Database Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
