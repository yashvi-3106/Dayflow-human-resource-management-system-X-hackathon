import { useEffect, useState } from 'react';
import api from '../../api/client';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value || 0}</p>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await api.get('/dashboard/admin');
                if (data.success) {
                    setStats(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
    }

    // Use dynamic trend data from backend, fallback to empty structure if loading
    const chartData = stats?.trend || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
                    <p className="text-gray-500">System Management & Analytics</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats?.employees?.total}
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Present Today"
                    value={stats?.attendance?.present}
                    icon={UserCheck}
                    color="bg-green-500"
                    subtext={`${stats?.attendance?.onLeave || 0} On Leave`}
                />
                <StatCard
                    title="Pending Leaves"
                    value={stats?.leaves?.pending}
                    icon={Clock}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Active Employees"
                    value={stats?.employees?.active}
                    icon={CheckCircle}
                    color="bg-purple-500"
                    subtext="Synced Status"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Attendance Trend (Demo)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="Present" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts / Action Items */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Action Required</h2>
                    <div className="space-y-4">
                        {stats?.alerts && stats.alerts.length > 0 ? (
                            stats.alerts.map((alert, idx) => (
                                <div key={idx} className="flex items-start p-3 bg-red-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        {/* Backend sends string alerts, so just display alert directly */}
                                        <p className="text-sm font-semibold text-red-900">{alert}</p>
                                        <p className="text-xs text-red-700 mt-1 uppercase font-bold">ALERT</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No pending alerts. Good job!</p>
                        )}

                        {/* Static Placeholder for Demo if Empty */}
                        {(!stats?.alerts || stats.alerts.length === 0) && (
                            <div className="flex items-start p-3 bg-blue-50 rounded-lg opacity-50">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">Run Payroll for Dec</p>
                                    <p className="text-xs text-blue-700 mt-1">REMINDER</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
