import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Check, X, Filter } from 'lucide-react';

const LeaveRequests = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const endpoint = filter === 'ALL' ? '/admin/leaves' : `/admin/leaves?status=${filter}`;
            // Note: Backend might require specific param logic.
            // Phase 4 "Get All Leaves" controller handles req.query.status
            const { data } = await api.get('/admin/leaves', { params: { status: filter === 'ALL' ? undefined : filter } });
            if (data.success) {
                setLeaves(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [filter]);

    const handleAction = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;
        try {
            await api.patch(`/admin/leaves/${id}/action`, { status });
            fetchLeaves(); // Refresh
        } catch (error) {
            alert('Action failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
                    <p className="text-gray-500">Manage employee leaves</p>
                </div>
                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filter === f ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="p-10 text-center">Loading...</td></tr>
                            ) : leaves.length > 0 ? (
                                leaves.map((leave) => (
                                    <tr key={leave._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {leave.employee?.firstName} {leave.employee?.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500">{leave.employee?.designation}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {leave.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{leave.days} Days</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs " title={leave.reason}>
                                            {leave.reason}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {leave.status === 'PENDING' && (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleAction(leave._id, 'APPROVED')}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(leave._id, 'REJECTED')}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                        No {filter.toLowerCase()} leaves found.
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

export default LeaveRequests;
