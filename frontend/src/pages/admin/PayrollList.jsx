import { useEffect, useState } from 'react';
import api from '../../api/client';
import { RefreshCw, Play } from 'lucide-react';

const PayrollList = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Generator Form
    const [selectedEmp, setSelectedEmp] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const fetchData = async () => {
        try {
            const [payrollRes, empRes] = await Promise.all([
                api.get('/admin/payroll'),
                api.get('/employees')
            ]);
            if (payrollRes.data.success) setPayrolls(payrollRes.data.data);
            if (empRes.data.success) setEmployees(empRes.data.data);
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerate = async () => {
        if (!selectedEmp || !month) return alert('Please select Employee and Month');
        setGenerating(true);
        try {
            await api.post(`/admin/payroll/generate/${selectedEmp}`, { month });
            alert('Payroll Generated Successfully!');
            fetchData(); // Refresh list
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to generate');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
                    <p className="text-gray-500">Processing and History</p>
                </div>
            </div>

            {/* Generator Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 bg-indigo-50">
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Run Payroll
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-indigo-700 mb-1">Select Employee</label>
                        <select
                            className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white"
                            value={selectedEmp}
                            onChange={(e) => setSelectedEmp(e.target.value)}
                        >
                            <option value="">-- Choose Employee --</option>
                            {employees.map(e => (
                                <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.designation})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-indigo-700 mb-1">Month</label>
                        <input
                            type="month"
                            className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex justify-center items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
                    >
                        {generating ? 'Processing...' : (
                            <>
                                <Play size={18} className="mr-2" />
                                Generate Payslip
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center">Loading...</td></tr>
                            ) : payrolls.length > 0 ? (
                                payrolls.map((slip) => (
                                    <tr key={slip._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {slip.month}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{slip.employee?.firstName} {slip.employee?.lastName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ₹{slip.salaryStructure?.basicSalary}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            ₹{slip.netSalary}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${slip.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {slip.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">No payroll records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PayrollList;
