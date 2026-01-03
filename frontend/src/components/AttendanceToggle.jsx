import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Clock } from 'lucide-react';

const AttendanceToggle = () => {
    const { user } = useAuth();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [elapsed, setElapsed] = useState(0); // seconds
    const [startTime, setStartTime] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [todayStatus, setTodayStatus] = useState(null);
    const [error, setError] = useState('');

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const fetchStatus = async () => {
        try {
            const res = await client.get('/attendance/me');
            if (res.data.success && res.data.data.length > 0) {
                const lastRecord = res.data.data[0];

                // If the latest record has NO clockOut, we are currently Checked In.
                if (lastRecord.clockIn && !lastRecord.clockOut) {
                    setTodayStatus(lastRecord);
                    setIsCheckedIn(true);
                    setStartTime(new Date(lastRecord.clockIn));
                } else {
                    // Latest record is closed.
                    const recordDate = new Date(lastRecord.date);
                    const today = new Date();

                    if (isSameDay(recordDate, today)) {
                        setTodayStatus(lastRecord);
                        setIsCheckedIn(false);
                    } else {
                        // Latest record is old.
                        setTodayStatus(null);
                        setIsCheckedIn(false);
                        setStartTime(null);
                    }
                }
            } else {
                // No records at all
                setTodayStatus(null);
                setIsCheckedIn(false);
                setStartTime(null);
            }
        } catch (err) {
            console.error("Failed to fetch status", err);
        }
    };

    // Fetch on mount and when popover opens
    useEffect(() => {
        fetchStatus();
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchStatus();
        }
    }, [isOpen]);

    // Timer Logic
    useEffect(() => {
        let interval;
        if (isCheckedIn && startTime) {
            const updateTimer = () => {
                const now = new Date();
                const start = new Date(startTime);
                const diff = Math.floor((now - start) / 1000);
                setElapsed(diff > 0 ? diff : 0);
            };

            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [isCheckedIn, startTime]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleCheckIn = async () => {
        try {
            setError('');
            const res = await client.post('/attendance/clock-in');
            if (res.data.success) {
                const start = new Date();
                setStartTime(start);
                setIsCheckedIn(true);
                setTodayStatus(res.data.data);
                // fetchStatus(); // Double check
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Clock In Failed';
            setError(msg);

            // If error says already exists, sync state immediately
            if (msg.includes('already exists')) {
                fetchStatus();
            }
        }
    };

    const handleCheckOut = async () => {
        try {
            setError('');
            const res = await client.post('/attendance/clock-out');
            if (res.data.success) {
                setIsCheckedIn(false);
                setStartTime(null);
                setElapsed(0);
                setTodayStatus(prev => ({ ...prev, clockOut: new Date() }));
                // setIsOpen(false);
                alert(`Checked Out! Work Duration: ${res.data.data.workHours}`);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Clock Out Failed');
        }
    };

    // Determine dot color
    const getDotColor = () => {
        // Green if checked in
        if (isCheckedIn) return 'bg-green-500 hover:bg-green-600';
        // Gray if not checked in BUT task completed today (clockOut exists for today)
        if (todayStatus?.clockOut) return 'bg-gray-400 hover:bg-gray-500';
        // Red if not checked in and work pending
        return 'bg-red-500 hover:bg-red-600';
    };

    // Toggle Popover
    const togglePopover = () => setIsOpen(!isOpen);

    return (
        <div className="relative z-50">
            {/* Status Dot Trigger */}
            <button
                onClick={togglePopover}
                className={`w-6 h-6 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 focus:outline-none ${getDotColor()}`}
                title={isCheckedIn ? "Checked In" : "Not Checked In"}
            />

            {/* Popover */}
            {isOpen && (
                <div className="absolute right-0 top-10 w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-5 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <span className="font-semibold text-gray-700">Daily Attendance</span>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>

                    {error && <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

                    <div className="space-y-5">
                        <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Current Session</p>
                            <p className="text-3xl font-mono font-bold text-gray-800 my-1">
                                {isCheckedIn ? formatTime(elapsed) : '00:00:00'}
                            </p>
                            <p className="text-xs text-blue-500 flex items-center justify-center gap-1 h-4">
                                {isCheckedIn && (
                                    <>
                                        <Clock size={12} />
                                        <span>Started {startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCheckIn}
                                disabled={isCheckedIn || todayStatus?.clockOut}
                                className={`py-2 px-3 rounded-md text-sm font-medium transition flex items-center justify-center gap-1
                                    ${isCheckedIn || todayStatus?.clockOut
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                    }`}
                            >
                                Check IN
                            </button>
                            <button
                                onClick={handleCheckOut}
                                disabled={!isCheckedIn}
                                className={`py-2 px-3 rounded-md text-sm font-medium transition flex items-center justify-center gap-1
                                    ${!isCheckedIn
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                    }`}
                            >
                                Check Out
                            </button>
                        </div>

                        {todayStatus?.clockOut && (
                            <p className="text-xs text-center text-gray-500 italic">
                                You have completed work for today.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceToggle;
