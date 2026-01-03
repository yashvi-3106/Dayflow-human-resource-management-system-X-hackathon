import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Shield, Search, Filter } from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await api.get('/audit-logs');
                if (data.success) {
                    setLogs(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch audit logs', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading Logs...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Shield className="mr-3 text-blue-600" />
                    System Audit Logs
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-normal outline-none"
                        />
                    </div>
                    <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
                        <Filter size={20} className="mr-2" /> Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                                <th className="p-4 font-semibold border-b">Action</th>
                                <th className="p-4 font-semibold border-b">User</th>
                                <th className="p-4 font-semibold border-b">Details</th>
                                <th className="p-4 font-semibold border-b">IP Address</th>
                                <th className="p-4 font-semibold border-b">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <span className="inline-block px-2 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-900 font-medium">{log.user}</td>
                                    <td className="p-4 text-gray-600">{log.details}</td>
                                    <td className="p-4 text-gray-500 font-mono text-sm">{log.ip}</td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
