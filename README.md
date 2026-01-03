# Dayflow Human Resource Management System

## Overview

Dayflow is a comprehensive Human Resource Management System designed to streamline HR operations, employee management, and administrative tasks. Built during a hackathon, this system provides essential features for managing employees, attendance, leave requests, payroll, and more.

## Features

- **Employee Management**: Add, edit, and manage employee profiles and information
- **Attendance Tracking**: Monitor employee attendance with automated tracking
- **Leave Management**: Handle employee leave requests and approvals
- **Payroll Processing**: Calculate and manage employee salaries and compensation
- **Admin Dashboard**: Centralized dashboard for administrators to monitor all HR activities
- **Department Management**: Organize employees into departments and teams
- **Audit Logging**: Track all system changes and user activities
- **Notifications**: Real-time notifications for important events and updates

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### Frontend
- React
- Vite
- Tailwind CSS

## Project Structure

```
backend/
├── scripts/          # Database scripts and verification tools
├── src/
│   ├── controllers/  # API controllers
│   ├── middleware/   # Request middleware
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   └── utils/        # Utility functions
frontend/
├── src/
│   ├── api/          # API client
│   ├── components/   # Reusable components
│   ├── context/      # React context providers
│   └── pages/        # Page components
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret
- `JWT_EXPIRE` - JWT token expiration time

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Forgot password

### Employee Management
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/:id` - Update attendance

### Leave Management
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave request status

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll` - Create payroll entry
- `PUT /api/payroll/:id` - Update payroll entry

## Scripts

The project includes several verification scripts in the `backend/scripts/` directory:
- `verify-phase1.js` through `verify-phase9-security.js` - Phase-based verification scripts
- `seed-demo.js` - Demo data seeding
- `cleanup_db.js` - Database cleanup
- `check_db.js` - Database verification

## Development

This project was developed as part of a hackathon, focusing on rapid development and implementation of core HR management features. The codebase includes verification scripts to ensure functionality at different phases of development.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Built during a hackathon event, this system demonstrates rapid application development using modern web technologies.
