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

// CORS Configuration
const allowedOrigins = [
  'https://dayflow-hrms-odoo.netlify.app',
  'https://dayflow-hrms.vercel.app',
  'http://localhost:3000'
];

// Replace the CORS configuration with this:
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://dayflow-hrms-odoo.netlify.app',
      'https://dayflow-hrms.vercel.app',
      'http://localhost:3000'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS to all routes
app.use(cors(corsOptions));


// Handle preflight for all routes
app.options('(.*)', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', true);
  res.sendStatus(200);
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight for all API routes
app.all('/api/(.*)', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', true);
    return res.sendStatus(200);
  }
  next();
});

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;