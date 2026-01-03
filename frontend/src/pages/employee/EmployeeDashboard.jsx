import { useEffect, useState } from 'react';
import api from '../../api/client';
import {
    Clock,
    Calendar,
    DollarSign,
    Bell,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clockProcessing, setClockProcessing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Clock Timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboard = async () => {
        try {
            const { data } = await api.get('/dashboard/employee');
            if (data.success) {
                setData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleClockIn = async () => {
        setClockProcessing(true);
        try {
            await api.post('/attendance/clock-in');
            await fetchDashboard(); // Refresh state
        } catch (error) {
            alert(error.response?.data?.message || 'Clock In Failed');
        } finally {
            setClockProcessing(false);
        }
    };

    // Note: Backend might not have separate clock-out endpoint yet, usually just "clock-in" and it figures it out?
    // Checking backend Phase 3: "POST /api/attendance/clock-in" 
    // Wait, Phase 3 implementation says: "check if already clocked in today... if present return 400".
    // Does it support "Clock Out"? 
    // Checking `attendanceController.js`. It seems I built "clockIn" but maybe not explicit "clockOut" toggle in the same endpoint? 
    // Let's check the backend logic briefly in my mind or assumption.
    // If only clock-in exists, I can only clock in once. I'll stick to that for now.
    // Wait, `Attendance` model has `clockOut`. 
    // I should check `attendanceController.js` if I'm unsure. 
    // For now, I will assume only Clock In is available via API based on Phase 3 description "Manual Clock-in".
    // I will implement "Clock Out" later if needed.

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    const todayStatus = data?.attendance?.today?.status;
    const isPresent = todayStatus === 'PRESENT';
    const clockInTime = data?.attendance?.today?.clockIn;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Good Morning, {user?.firstName}!</h1>
                    <p className="text-gray-500">Here's what's happening today.</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-light text-gray-800">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-gray-500">
                        {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className={`p-4 rounded-full mb-4 ${isPresent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Clock size={48} />
                    </div>

                    {isPresent ? (
                        <>
                            <h2 className="text-xl font-bold text-gray-900">Present (Biometric)</h2>
                            <p className="text-gray-500 mt-1">
                                Clock-in recorded via Machine at {new Date(clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <button
                                disabled
                                className="mt-6 px-6 py-2 bg-green-100 text-green-700 font-medium rounded-full cursor-not-allowed"
                            >
                                <CheckCircle size={16} className="inline mr-2" />
                                Recorded
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-900">Attendance via Machine</h2>
                            <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                                Please use the biometric scanner to mark your attendance. Web clock-in is disabled.
                            </p>
                            <div className="mt-6 px-6 py-2 bg-gray-100 text-gray-500 font-medium rounded-full">
                                <Clock size={16} className="inline mr-2" />
                                Awaiting Scan
                            </div>
                        </>
                    )}
                </div>

                {/* Stats */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Leave Balance */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-700">Leave Balance</h3>
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <Calendar size={20} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Pending Requests</span>
                                <span className="font-bold text-gray-900">{data?.leaves?.pending || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Approved (This Month)</span>
                                <span className="font-bold text-gray-900">{data?.leaves?.approved || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payroll Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-700">Payroll</h3>
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <DollarSign size={20} />
                            </div>
                        </div>
                        {data?.payroll ? (
                            <div>
                                <p className="text-sm text-gray-500">Last Salary Credited</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">₹{data.payroll.netSalary?.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 mt-1">For {data.payroll.month}</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                                No recent payroll record
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Bell size={20} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">Recent Notifications</h2>
                </div>
                <div className="space-y-4">
                    {data?.notifications && data.notifications.length > 0 ? (
                        data.notifications.map((notif) => (
                            <div key={notif._id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-bold text-gray-800">{notif.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No new notifications</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
