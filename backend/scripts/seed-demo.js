const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Employee = require('../src/models/Employee');
const Department = require('../src/models/Department');
const Attendance = require('../src/models/Attendance');
const Leave = require('../src/models/Leave');
const Payroll = require('../src/models/Payroll');
const Notification = require('../src/models/Notification');
const AuditLog = require('../src/models/AuditLog');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    console.log('🗑️  Clearing Database...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Payroll.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('🌱 Seeding Data...');

    // 1. Company
    const company = await Company.create({
        name: 'TechCorp Solutions',
        address: '123 Tech Park, Silicon Valley, CA',
        email: 'contact@techcorp.io',
        phone: '1234567890'
    });
    console.log('✅ Company Created');

    // 2. Admin User
    const adminUser = await User.create({
        email: 'admin@dayflow.io',
        loginId: 'ADMIN001',
        password: 'password123', // Will be hashed
        role: 'ADMIN',
        company: company._id,
        isVerified: true,
        isFirstLogin: false
    });
    console.log('✅ Admin User Created (admin@dayflow.io / password123)');

    // 3. Departments
    const deptNames = ['Engineering', 'HR', 'Sales'];
    const depts = [];
    for (const name of deptNames) {
        const d = await Department.create({ name, company: company._id });
        depts.push(d);
    }
    console.log('✅ Departments Created');

    // 4. Employees
    const employeesData = [
        { first: 'Satoshi', last: 'Nakamoto', dept: depts[0], role: 'EMPLOYEE', desig: 'Lead Engineer' },
        { first: 'Ada', last: 'Lovelace', dept: depts[0], role: 'EMPLOYEE', desig: 'Software Engineer' },
        { first: 'Grace', last: 'Hopper', dept: depts[0], role: 'EMPLOYEE', desig: 'DevOps Engineer' },
        { first: 'Sheryl', last: 'Sandberg', dept: depts[1], role: 'HR', desig: 'HR Manager' },
        { first: 'Jordan', last: 'Belfort', dept: depts[2], role: 'EMPLOYEE', desig: 'Sales Exec' }
    ];

    const employees = [];

    for (let i = 0; i < employeesData.length; i++) {
        const e = employeesData[i];
        const loginId = `EMP${202400 + i + 1}`;

        const user = await User.create({
            email: `${e.first.toLowerCase()}@techcorp.io`,
            loginId: loginId,
            password: 'password123',
            role: e.role,
            company: company._id,
            isVerified: true,
            isFirstLogin: false
        });

        const emp = await Employee.create({
            user: user._id,
            company: company._id,
            firstName: e.first,
            lastName: e.last,
            department: e.dept._id,
            designation: e.desig,
            joiningDate: new Date('2024-01-15'),
            email: user.email,
            phone: '9876543210',
            status: 'ACTIVE',
            salary: 50000 + (i * 10000)
        });

        // Link back
        user.employeeId = emp._id;
        await user.save();
        employees.push(emp);
        console.log(`   - Created ${e.first} ${e.last} (${loginId})`);

        // Welcome Notification
        await Notification.create({
            user: user._id,
            company: company._id,
            title: 'Welcome to TechCorp',
            message: 'Welcome aboard! Please complete your profile.',
            type: 'INFO'
        });
    }

    // 5. Attendance (Last 30 days)
    console.log('⏳ Generating 30 Days of Attendance...');
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setUTCHours(0, 0, 0, 0);

        // Skip weekends
        const day = date.getDay();
        if (day === 0 || day === 6) continue;

        for (const emp of employees) {
            // 90% Present, 5% Leave, 5% Late
            const rand = Math.random();
            let status = 'PRESENT';
            let clockIn = new Date(date);
            clockIn.setHours(9, 0, 0); // 9 AM
            let clockOut = new Date(date);
            clockOut.setHours(18, 0, 0); // 6 PM

            if (rand > 0.95) {
                status = 'LEAVE'; // No attendance record
                continue;
            } else if (rand > 0.90) {
                status = 'HALF_DAY';
                clockOut.setHours(13, 0, 0); // 1 PM
            } else if (rand > 0.80) {
                // Late
                clockIn.setHours(10, 30, 0);
            }

            await Attendance.create({
                employee: emp._id,
                date: date,
                status: status,
                clockIn: clockIn,
                clockOut: clockOut,
                workDuration: (clockOut - clockIn) / (1000 * 60) // minutes
            });
        }
    }

    // 6. Leaves
    const leaveEmp = employees[1]; // Ada
    await Leave.create({
        employee: leaveEmp._id,
        company: company._id,
        type: 'SICK',
        fromDate: new Date(today.getTime() + 86400000 * 2),
        toDate: new Date(today.getTime() + 86400000 * 3),
        days: 2,
        reason: 'Flu',
        status: 'PENDING'
    });
    console.log('✅ Pending Leave Request Created');

    // 7. Payroll (Last Month)
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const yyyy = lastMonthDate.getFullYear();
    const mm = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
    const monthStr = `${yyyy}-${mm}`; // YYYY-MM

    for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const salary = 50000 + (i * 10000); // Recalculate salary as it's not in DB

        await Payroll.create({
            employee: emp._id,
            company: company._id,
            month: monthStr,
            grossSalary: salary,
            salaryStructure: {
                basic: salary * 0.5,
                hra: salary * 0.2,
                conveyance: 1600,
                pf: 1800,
                insurance: 500
            },
            totalDaysInMonth: 30, // Simplified
            payableDays: 30, // Simplified
            netSalary: salary * 0.9, // Simplified
            status: 'PAID'
        });
    }
    console.log(`✅ Payroll Generated for ${monthStr}`);

    console.log('\n🎉 Database Seeded Successfully!');
    process.exit(0);
};

seedData();
