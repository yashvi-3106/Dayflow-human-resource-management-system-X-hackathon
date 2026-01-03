import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { Plus, Search, Trash2, Edit, AlertCircle, CheckCircle, Plane, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const EmployeeList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await client.get('/employees');
                if (res.data.success) {
                    setEmployees(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching employees:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this employee?')) {
            try {
                await client.delete(`/employees/${id}`);
                setEmployees(employees.filter((emp) => emp._id !== id));
            } catch (error) {
                console.error('Error deleting employee:', error);
            }
        }
    };

    const filteredEmployees = employees.filter(
        (emp) =>
            emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status Icon Helper
    const getStatusIcon = (status) => {
        switch (status) {
            case 'PRESENT':
                return <div className="w-4 h-4 rounded-full bg-green-500 border border-white shadow-sm" title="Present" />;
            case 'ON_LEAVE':
                return <Plane className="w-5 h-5 text-blue-500" title="On Leave" />;
            default: // ABSENT
                return <div className="w-4 h-4 rounded-full bg-yellow-400 border border-white shadow-sm" title="Absent" />;
        }
    };

    if (loading) {
        return <div className="p-6">Loading employees...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
                <Link
                    to="/admin/employees/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <Plus size={20} />
                    Add Employee
                </Link>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search employees..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredEmployees.map((emp) => (
                    <div
                        key={emp._id}
                        onClick={() => navigate(`/admin/employees/${emp._id}/edit`)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer relative group"
                    >
                        {/* Status Indicator (Top Right) */}
                        <div className="absolute top-4 right-4">
                            {getStatusIcon(emp.attendanceStatus)}
                        </div>

                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border-2 border-white shadow-sm">
                            {emp.profilePictureUrl ? (
                                <img src={emp.profilePictureUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-10 h-10 text-gray-400" />
                            )}
                        </div>

                        {/* Info */}
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {emp.firstName} {emp.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">{emp.designation || 'No Designation'}</p>

                        <div className="w-full border-t border-gray-100 pt-4 flex justify-between items-center text-sm text-gray-500">
                            <span>{emp.department?.name || 'General'}</span>
                            {/* Delete Action (Prevent bubbling) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(emp._id);
                                }}
                                className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredEmployees.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No employees found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeList;
