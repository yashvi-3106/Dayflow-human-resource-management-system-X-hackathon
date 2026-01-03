import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Plus, Briefcase, Search } from 'lucide-react';

const DepartmentList = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const { data } = await api.get('/departments');
            if (data.success) {
                setDepartments(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch departments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/departments', { name: newDeptName });
            setNewDeptName('');
            setShowModal(false);
            fetchDepartments();
        } catch (error) {
            alert('Failed to create department');
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Departments...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                    <p className="text-gray-500">Manage company structure</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} className="mr-2" />
                    Add Department
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <div key={dept._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                                <p className="text-xs text-gray-500">Active</p>
                            </div>
                        </div>
                        {/* No Delete Action yet as backend doesn't support it */}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Department</h2>
                        <form onSubmit={handleCreate}>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500"
                                placeholder="Department Name (e.g. Engineering)"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                required
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentList;
