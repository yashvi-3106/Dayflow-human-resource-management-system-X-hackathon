const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const adminAttendanceRoutes = require('./routes/adminAttendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminLeaveRoutes = require('./routes/adminLeaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const adminPayrollRoutes = require('./routes/adminPayrollRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const path = require('path');

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin/leaves', adminLeaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/admin/payroll', adminPayrollRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.send('Dayflow HRMS Backend Running');
});

// Error Handling Middleware
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

module.exports = app;
