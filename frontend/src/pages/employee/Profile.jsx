import { useEffect, useState } from 'react';
import api from '../../api/client';
import {
    User, Mail, Phone, MapPin, Calendar, Briefcase,
    Save, Camera, Shield, FileText, CreditCard, Lock, CheckCircle, Upload, Download
} from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, documents, security
    const [editing, setEditing] = useState(false);

    // Forms
    const [formData, setFormData] = useState({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });

    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    // Upload State
    const [uploadType, setUploadType] = useState('ID_PROOF');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/employees/me');
            if (data.success) {
                setProfile(data.data);
                setFormData({
                    phone: data.data.phone || '',
                    address: data.data.address || '',
                    dob: data.data.dob ? new Date(data.data.dob).toISOString().split('T')[0] : '',
                    gender: data.data.gender || '',
                    maritalStatus: data.data.maritalStatus || '',
                    bankAccountNo: data.data.bankAccountNo || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            await api.put('/employees/me', formData);
            setEditing(false);
            fetchProfile(); // Refresh
        } catch (error) {
            alert('Update failed');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });
        try {
            const { data } = await api.post('/auth/change-password', passwordData);
            if (data.success) {
                setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswordData({ currentPassword: '', newPassword: '' });
            }
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update password' });
        }
    };

    const handleDownload = async (doc) => {
        try {
            // Strip /api if present to get clean partial path
            const cleanUrl = doc.url.replace('/api', '');

            const response = await api.get(cleanUrl, {
                responseType: 'blob',
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.originalName || 'document');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download document');
        }
    };

    const handleUploadDocument = async () => {
        const fileInput = document.getElementById('profileDocFile');
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', uploadType);
        // No employeeId needed for self-upload

        try {
            setUploading(true);
            const res = await api.post('/employees/upload-document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                alert('Document uploaded successfully');
                fetchProfile(); // Refresh profile to see new doc
                fileInput.value = '';
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert(error.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header / Banner */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <div className="px-8 pb-6">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end">
                            <div className="relative h-24 w-24 rounded-full bg-white p-1 shadow-lg">
                                <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden">
                                    {profile?.profilePictureUrl ? (
                                        <img src={profile.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        profile?.firstName?.charAt(0)
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm border-2 border-white">
                                    <Camera size={14} />
                                </button>
                            </div>
                            <div className="ml-4 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{profile?.firstName} {profile?.lastName}</h1>
                                <p className="text-gray-500 font-medium">{profile?.designation}</p>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                {profile?.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Documents
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Security & Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Sidebar (Always Visible) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Work Info</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 block">Department</label>
                                <div className="font-medium text-gray-900 flex items-center mt-1">
                                    <Briefcase size={16} className="mr-2 text-gray-400" />
                                    {profile?.department?.name || '-'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block">Joining Date</label>
                                <div className="font-medium text-gray-900 flex items-center mt-1">
                                    <Calendar size={16} className="mr-2 text-gray-400" />
                                    {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '-'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block">Employee ID</label>
                                <div className="font-medium text-gray-900 flex items-center mt-1">
                                    <User size={16} className="mr-2 text-gray-400" />
                                    {profile?.user?.loginId || '-'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block">Work Email</label>
                                <div className="font-medium text-gray-900 flex items-center mt-1 text-sm break-all">
                                    <Mail size={16} className="mr-2 text-gray-400" />
                                    {profile?.user?.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Main Content (Tabbed) */}
                <div className="lg:col-span-2">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                                <button
                                    onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${editing
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {editing ? 'Save Changes' : 'Edit Details'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-700">
                                        {profile?.firstName} {profile?.lastName}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Name can only be changed by Admin</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
                                    {editing ? (
                                        <input
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    ) : (
                                        <div className="p-2.5 border border-gray-200 rounded-lg text-gray-900 flex items-center">
                                            <Phone size={16} className="mr-2 text-gray-400" />
                                            {profile?.phone}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date of Birth</label>
                                    {editing ? (
                                        <input
                                            type="date"
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.dob}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        />
                                    ) : (
                                        <div className="p-2.5 border border-gray-200 rounded-lg text-gray-900 flex items-center">
                                            <Calendar size={16} className="mr-2 text-gray-400" />
                                            {profile?.dob ? new Date(profile.dob).toLocaleDateString() : '-'}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Address</label>
                                    {editing ? (
                                        <textarea
                                            rows="1"
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    ) : (
                                        <div className="p-2.5 border border-gray-200 rounded-lg text-gray-900 flex items-center">
                                            <MapPin size={16} className="mr-2 text-gray-400" />
                                            {profile?.address || '-'}
                                        </div>
                                    )}
                                </div>

                                {/* Read Only Extra Info */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Gender</label>
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-700">{profile?.gender || '-'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Marital Status</label>
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-700">{profile?.maritalStatus || '-'}</div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* DOCUMENTS TAB */}
                    {activeTab === 'documents' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">My Documents</h3>
                            {profile?.documents && profile.documents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                            <div className="flex items-center">
                                                <FileText className="text-blue-500 mr-3" />
                                                <div className="overflow-hidden">
                                                    <p className="font-medium text-gray-900 truncate">{doc.type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(doc)}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                title="Download Document"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>No documents uploaded yet.</p>
                                </div>
                            )}

                            {/* Only Admin can upload usually, but maybe Employee can? For now read only */}
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-8">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload size={18} />
                            Upload New Document
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                <select
                                    value={uploadType}
                                    onChange={(e) => setUploadType(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="ID_PROOF">ID Proof</option>
                                    <option value="OFFER_LETTER">Offer Letter</option>
                                    <option value="CERTIFICATE">Certificate</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="md:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                                <input
                                    type="file"
                                    id="profileDocFile"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="button"
                                    onClick={handleUploadDocument}
                                    disabled={uploading}
                                    className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {uploading ? '...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <Shield className="mr-2 text-blue-600" /> Security Settings
                        </h3>

                        <form onSubmit={handleChangePassword} className="max-w-md">
                            <h4 className="text-md font-semibold text-gray-800 mb-4">Change Password</h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long.</p>
                                </div>
                            </div>

                            {passwordMessage.text && (
                                <div className={`mt-4 p-3 rounded-lg text-sm flex items-center ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                    }`}>
                                    {passwordMessage.type === 'success' && <CheckCircle size={16} className="mr-2" />}
                                    {passwordMessage.text}
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
                                >
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
