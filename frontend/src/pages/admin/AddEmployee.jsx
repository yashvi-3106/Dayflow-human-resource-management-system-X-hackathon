import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const AddEmployee = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        role: 'EMPLOYEE',
        designation: '',
        salary: '',
        joiningDate: new Date().toISOString().split('T')[0],
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null); // To store { loginId, password }

    useEffect(() => {
        // Fetch Departments
        const fetchDepts = async () => {
            try {
                const { data } = await api.get('/departments');
                if (data.success) setDepartments(data.data);
            } catch (error) {
                console.error('Error fetching departments', error);
            }
        };
        fetchDepts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/employees', formData);
            if (data.success) {
                setSuccessData(data.data); // data.data contains { employee, loginId, password } from controller
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create employee');
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg border border-green-200 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Employee Onboarded!</h2>
                <p className="text-gray-500 mb-8">
                    Please share these credentials with the employee. They will be prompted to change the password on first login.
                </p>

                <div className="bg-gray-50 p-6 rounded-lg text-left inline-block w-full max-w-sm">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Login ID</label>
                            <div className="text-xl font-mono font-bold text-gray-900 tracking-wider">
                                {successData.loginId}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Temporary Password</label>
                            <div className="text-xl font-mono font-bold text-gray-900 tracking-wider">
                                {successData.tempPassword}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-x-4">
                    <button
                        onClick={() => navigate('/admin/employees')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Go to Employee List
                    </button>
                    <button
                        onClick={() => {
                            setSuccessData(null);
                            setFormData({
                                ...formData,
                                firstName: '',
                                lastName: '',
                                email: ''
                            });
                        }}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                        Add Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/admin/employees')}
                className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Employees
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Onboard New Employee</h2>
                    <p className="text-sm text-gray-500 mt-1">Fill in the details to create a new account.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    {/* Login Info - Auto Generated */}
                    <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 mb-2">System Access</h3>
                        <p className="text-sm text-blue-700">
                            Login ID and Temporary Password will be <strong>automatically generated</strong> upon creation.
                            <br />
                            Format: <code>[Company][Name][Year][Serial]</code> (e.g. TEJO20260001)
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                                required
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                                required
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Contact */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Login credentials will be generated automatically.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                            <input
                                required
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                type="tel"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Official */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="HR">HR</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                            <select
                                required
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                            <input
                                required
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                type="text"
                                placeholder="e.g. Software Engineer"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary (Monthly) *</label>
                            <input
                                required
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                            <input
                                required
                                name="joiningDate"
                                value={formData.joiningDate}
                                onChange={handleChange}
                                type="date"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployee;
