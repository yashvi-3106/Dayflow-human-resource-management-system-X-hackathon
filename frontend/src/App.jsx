import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import AttendanceHistory from './pages/employee/AttendanceHistory';
import MyLeaves from './pages/employee/MyLeaves';
import MyPayroll from './pages/employee/MyPayroll';
import EmployeeList from './pages/admin/EmployeeList';
import AddEmployee from './pages/admin/AddEmployee';
import AdminAttendance from './pages/admin/AdminAttendance';
import LeaveRequests from './pages/admin/LeaveRequests';
import PayrollList from './pages/admin/PayrollList';
import EditEmployee from './pages/admin/EditEmployee';
import Profile from './pages/employee/Profile';
import DepartmentList from './pages/admin/DepartmentList';
import Settings from './pages/admin/Settings';
import AuditLogs from './pages/admin/AuditLogs';

// 1. Protected Route (Checks Login)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

// 2. Role Guard (Checks Role)
const RequireRole = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />; // Fallback to safe zone
  }
  return children;
};

function App() {
  const { user } = useAuth();

  // Redirect root based on role
  const RootRedirect = () => {
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/dashboard" />;
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Area */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<RootRedirect />} />

        {/* Employee Routes */}
        <Route path="/dashboard" element={<EmployeeDashboard />} />
        <Route path="/attendance" element={<AttendanceHistory />} />
        <Route path="/leaves" element={<MyLeaves />} />
        <Route path="/payroll" element={<MyPayroll />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin Routes */}
        <Route path="/admin">
          <Route path="dashboard" element={
            <RequireRole allowedRoles={['ADMIN']}><AdminDashboard /></RequireRole>
          } />
          <Route path="employees" element={
            <RequireRole allowedRoles={['ADMIN']}><EmployeeList /></RequireRole>
          } />
          <Route path="employees/new" element={
            <RequireRole allowedRoles={['ADMIN']}><AddEmployee /></RequireRole>
          } />
          <Route path="employees/:id/edit" element={
            <RequireRole allowedRoles={['ADMIN']}><EditEmployee /></RequireRole>
          } />
          <Route path="attendance" element={
            <RequireRole allowedRoles={['ADMIN']}><AdminAttendance /></RequireRole>
          } />
          <Route path="leaves" element={
            <RequireRole allowedRoles={['ADMIN']}><LeaveRequests /></RequireRole>
          } />
          <Route path="payroll" element={
            <RequireRole allowedRoles={['ADMIN']}><PayrollList /></RequireRole>
          } />
          <Route path="departments" element={
            <RequireRole allowedRoles={['ADMIN']}><DepartmentList /></RequireRole>
          } />
          <Route path="settings" element={
            <RequireRole allowedRoles={['ADMIN']}><Settings /></RequireRole>
          } />
          <Route path="audit-logs" element={
            <RequireRole allowedRoles={['ADMIN']}><AuditLogs /></RequireRole>
          } />
        </Route>
      </Route>

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
