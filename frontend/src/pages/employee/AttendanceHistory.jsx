import { useState, useEffect } from 'react';
import client from '../../api/client';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const AttendanceHistory = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [stats, setStats] = useState({ presentDays: 0, leavesCount: 0, totalWorkingDays: 0 });
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                // Fetch History
                const historyRes = await client.get('/attendance/me');
                if (historyRes.data.success) {
                    setAttendanceData(historyRes.data.data);
                }

                // Fetch Stats
                const statsRes = await client.get('/attendance/stats');
                if (statsRes.data.success) {
                    setStats(statsRes.data.data);
                }
            } catch (error) {
                console.error('Error fetching attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [currentDate]); // Ideally dependency should include current month to filter backend, but simplistic for now

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    };

    const formattedMonth = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });

    // Table Row Component
    const AttendanceRow = ({ record }) => {
        const dateObj = new Date(record.date);
        const dateStr = dateObj.toLocaleDateString();
        const checkIn = record.clockIn ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
        const checkOut = record.clockOut ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

        return (
            <tr className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-800 font-medium">{dateStr}</td>
                <td className="p-4 text-gray-600">{checkIn}</td>
                <td className="p-4 text-gray-600">{checkOut}</td>
                <td className="p-4 text-gray-600">{record.workHours || '-'}</td>
                <td className="p-4 text-gray-600">{record.extraHours || '-'}</td>
            </tr>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading attendance data...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Attendance</h1>

            {/* Controls & Stats Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">

                {/* Date Controls */}
                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <button onClick={handlePrevMonth} className="p-3 hover:bg-gray-100 border-r border-gray-200">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="px-6 py-3 font-semibold text-gray-700 min-w-[140px] text-center flex items-center justify-center">
                        {formattedMonth}
                    </div>
                    <button onClick={handleNextMonth} className="p-3 hover:bg-gray-100 border-l border-gray-200">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Stat Cards - Gray Box Style from Wireframe */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-100 p-4 rounded-lg text-center border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Count of days present</p>
                        <p className="text-xl font-bold text-gray-800">{stats.presentDays}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg text-center border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Leaves count</p>
                        <p className="text-xl font-bold text-gray-800">{stats.leavesCount}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg text-center border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Total working days</p>
                        <p className="text-xl font-bold text-gray-800">{stats.totalWorkingDays}</p>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-500">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-sm text-gray-500 bg-white">
                                <th className="p-4 font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Check In</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Check Out</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Work Hours</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Extra Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {attendanceData.length > 0 ? (
                                attendanceData.map(record => (
                                    <AttendanceRow key={record._id} record={record} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        No attendance records found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistory;
