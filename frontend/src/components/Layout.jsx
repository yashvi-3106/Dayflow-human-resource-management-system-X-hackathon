import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    DollarSign,
    LogOut,
    Menu,
    X,
    UserCircle,
    ClipboardList,
    Shield
} from 'lucide-react';
import clsx from 'clsx';
import AttendanceToggle from './AttendanceToggle';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const isAdmin = user?.role === 'ADMIN';

    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Employees', path: '/admin/employees', icon: Users },
        { name: 'Attendance', path: '/admin/attendance', icon: Calendar },
        { name: 'Leaves', path: '/admin/leaves', icon: FileText },
        { name: 'Payroll', path: '/admin/payroll', icon: DollarSign },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: Shield },
    ];

    const employeeLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'My Attendance', path: '/attendance', icon: Calendar },
        { name: 'My Leaves', path: '/leaves', icon: FileText },
        { name: 'My Payslips', path: '/payroll', icon: DollarSign },
        { name: 'My Profile', path: '/profile', icon: UserCircle },
    ];

    const links = isAdmin ? adminLinks : employeeLinks;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        {user?.company?.logo ? (
                            <img
                                src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '')}${user.company.logo}`}
                                alt="Logo"
                                className="w-10 h-10 rounded-lg object-contain bg-white"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">D</span>
                            </div>
                        )}
                        <span className="text-xl font-bold text-gray-800">
                            {user?.company?.name || 'Dayflow'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    <div className="mb-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Menu
                    </div>
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname.startsWith(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={clsx(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon size={20} className="mr-3" />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={20} className="mr-3" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-8 z-40 relative">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex-1 flex justify-end items-center space-x-6">
                        {/* Attendance Toggle (Red/Green Dot) */}
                        <AttendanceToggle />

                        {/* Profile Dropdown Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center space-x-3 focus:outline-none"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                    {user?.firstName?.charAt(0)}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-20 animate-fadeIn">
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                            <UserCircle size={16} className="mr-2" />
                                            My Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                        >
                                            <LogOut size={16} className="mr-2" />
                                            Log Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
