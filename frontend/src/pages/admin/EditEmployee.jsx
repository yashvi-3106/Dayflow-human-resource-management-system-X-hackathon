import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { Save, ArrowLeft, User, Briefcase, DollarSign, Lock, Calculator, FileText, Upload, Eye, Download } from 'lucide-react';

const EditEmployee = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('resume');
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Employee Data State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        designation: '',
        phone: '',
        dob: '',
        address: '',
        joiningDate: '',
        workMobile: '',
        workLocation: '',
        gender: '',
        maritalStatus: '',
        nationality: '',
        bankAccountNo: '',
    });

    // Salary Data State (Separated for clarity)
    const [salaryData, setSalaryData] = useState({
        monthWage: 0,
        yearWage: 0,
        workingDaysPerWeek: 5,
        breakTime: 1,

        // Earnings
        basicSalary: 0,
        hra: 0,
        standardAllowance: 0,
        performanceBonus: 0,
        lta: 0,
        fixedAllowance: 0,

        // Deductions/Contributions
        pfEmployee: 0,
        pfEmployer: 0,
        professionalTax: 200, // Default fixed
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, deptRes] = await Promise.all([
                    client.get(`/employees/${id}`),
                    client.get('/departments')
                ]);

                if (empRes.data.success) {
                    const emp = empRes.data.data;
                    setFormData({
                        firstName: emp.firstName || '',
                        lastName: emp.lastName || '',
                        email: emp.user?.email || '',
                        department: emp.department?._id || '',
                        designation: emp.designation || '',
                        phone: emp.phone || '',
                        dob: emp.dob ? emp.dob.split('T')[0] : '',
                        address: emp.address || '',
                        joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
                        workMobile: emp.workMobile || '',
                        workLocation: emp.workLocation || '',
                        gender: emp.gender || '',
                        maritalStatus: emp.maritalStatus || '',
                        nationality: emp.nationality || '',
                        bankAccountNo: emp.bankAccountNo || '',
                    });

                    // Load Salary Data if exists, else defaults
                    if (emp.salaryDetails) {
                        setSalaryData(prev => ({ ...prev, ...emp.salaryDetails }));
                    } else {
                        // If no saved salary, maybe init with 50000 example for demo or 0
                        calculateSalaryComponents(50000);
                    }
                    // Load Documents
                    setDocuments(emp.documents || []);
                }
                if (deptRes.data.success) {
                    setDepartments(deptRes.data.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Core Calculation Logic
    const calculateSalaryComponents = (monthlyWageInput) => {
        const wage = Number(monthlyWageInput) || 0;

        // 1. Basic Salary: 50% of Monthly Wage
        const basic = wage * 0.50;

        // 2. HRA: 50% of Basic Salary
        const hra = basic * 0.50;

        // 3. Standard Allowance: Approx 16.67% of wage (or fixed logic, using the wireframe hint)
        const stdAllowance = wage * (16.67 / 100);

        // 4. Performance Bonus: ~8.33% of wage (approx 1 month basic equivalent per year often)
        const bonus = wage * (8.33 / 100);

        // 5. LTA: ~8.33% of wage (similar to bonus)
        const lta = wage * (8.33 / 100);

        // 6. PF (Provident Fund): 12% of Basic Salary
        // Both Employee and Employer Contribution usually same
        const pf = basic * 0.12;

        // 7. Professional Tax: Fixed 200 usually
        const profTax = 200;

        // 8. Fixed Allowance (Balancing Figure)
        // Formula: Wage - (Basic + HRA + StdAllow + Bonus + LTA)
        // Note: Wage here is usually "Cost to Company" or "Gross", let's assume Wage = Gross Earnings.
        // If Wage = CTC, Employer PF would be subtracted too. 
        // Based on wireframe "Month Wage" seems to be Gross Earnings target.
        const sumComponents = basic + hra + stdAllowance + bonus + lta;
        let fixed = wage - sumComponents;
        if (fixed < 0) fixed = 0; // prevent negative if logic skews

        setSalaryData(prev => ({
            ...prev,
            monthWage: wage,
            yearWage: wage * 12,

            basicSalary: Number(basic.toFixed(2)),
            hra: Number(hra.toFixed(2)),
            standardAllowance: Number(stdAllowance.toFixed(2)),
            performanceBonus: Number(bonus.toFixed(2)),
            lta: Number(lta.toFixed(2)),
            fixedAllowance: Number(fixed.toFixed(2)), // Balancing

            pfEmployee: Number(pf.toFixed(2)),
            pfEmployer: Number(pf.toFixed(2)),
            professionalTax: profTax
        }));
    };

    const handleSalaryChange = (e) => {
        const { name, value } = e.target;

        if (name === 'monthWage') {
            calculateSalaryComponents(value); // Auto-recalc everything
        } else {
            // Allow manual override of specific fields
            setSalaryData(prev => ({ ...prev, [name]: Number(value) }));
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Combine Form Data and Salary Data Structure
            const payload = {
                ...formData,
                salaryDetails: salaryData // Nest salary data
            };
            await client.put(`/employees/${id}`, payload);
            alert('Employee updated successfully');
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Failed to update employee');
        }
    };

    // Upload State
    const [uploadType, setUploadType] = useState('ID_PROOF');
    const fileInputRef = useState(null);

    const handleDownload = async (doc) => {
        try {
            // Strip /api if present to get clean partial path
            const cleanUrl = doc.url.replace('/api', '');

            const response = await client.get(cleanUrl, {
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
        const fileInput = document.getElementById('docFile'); // Keeping simple for now, but ensure ID is unique
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', uploadType);
        formData.append('employeeId', id);

        try {
            setUploading(true);
            const res = await client.post('/employees/upload-document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                alert('Document uploaded successfully');
                // Refresh list
                const updatedDocRes = await client.get(`/employees/${id}`);
                if (updatedDocRes.data.success) {
                    setDocuments(updatedDocRes.data.data.documents || []);
                }
                fileInput.value = '';
            }
        } catch (error) {
            console.error('Upload failed:', error);
            const msg = error.response?.data?.message || 'Failed to upload document';
            alert(msg);
        } finally {
            setUploading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 font-medium transition-colors ${activeTab === id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/employees')}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    type="button"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h1>
                    <p className="text-gray-500">{formData.designation} • {formData.email}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 flex overflow-hidden mb-0">
                <TabButton id="resume" label="Resume" icon={Briefcase} />
                <TabButton id="private" label="Private Info" icon={User} />
                <TabButton id="salary" label="Salary Info" icon={DollarSign} />
                <TabButton id="documents" label="Documents" icon={FileText} />
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-8">

                {/* --- RESUME TAB --- */}
                {activeTab === 'resume' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleFormChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select name="department" value={formData.department} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                            <input type="text" name="designation" value={formData.designation} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                            <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Work Mobile</label>
                            <input type="text" name="workMobile" value={formData.workMobile} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                            <input type="text" name="workLocation" value={formData.workLocation} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                )}

                {/* --- PRIVATE INFO TAB --- */}
                {activeTab === 'private' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-xs text-gray-400">(Read Only)</span></label>
                            <input type="email" value={formData.email} disabled className="w-full p-2 border rounded bg-gray-50 text-gray-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Phone</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Select Gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Select Status</option>
                                <option value="SINGLE">Single</option>
                                <option value="MARRIED">Married</option>
                                <option value="DIVORCED">Divorced</option>
                                <option value="WIDOWED">Widowed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                            <input type="text" name="nationality" value={formData.nationality} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No.</label>
                            <input type="text" name="bankAccountNo" value={formData.bankAccountNo} onChange={handleFormChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                            <textarea name="address" value={formData.address} onChange={handleFormChange} rows="2" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                )}

                {/* --- SALARY INFO TAB (NEW OVERHAUL) --- */}
                {activeTab === 'salary' && (
                    <div className="animate-fadeIn">
                        {/* Admin Warning */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 border-b pb-4">
                            <Lock size={14} />
                            <span className="font-medium">Salary Info</span> tab should only be visible to Admin
                        </div>

                        {/* Top Section: Wage Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <label className="w-32 text-gray-700 font-medium">Month Wage</label>
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            name="monthWage"
                                            value={salaryData.monthWage}
                                            onChange={handleSalaryChange}
                                            className="w-full p-2 border-b-2 border-gray-300 focus:border-black outline-none font-bold text-lg bg-transparent"
                                            placeholder="00000"
                                        />
                                        <span className="absolute right-2 top-2 text-gray-400 text-sm">/ Month</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="w-32 text-gray-700 font-medium">Yearly Wage</label>
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            value={salaryData.yearWage}
                                            disabled
                                            className="w-full p-2 border-b-2 border-gray-100 outline-none font-bold text-lg bg-transparent text-gray-600"
                                        />
                                        <span className="absolute right-2 top-2 text-gray-400 text-sm">/ Yearly</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">No of working days in a week:</label>
                                    <input
                                        type="number"
                                        name="workingDaysPerWeek"
                                        value={salaryData.workingDaysPerWeek}
                                        onChange={handleSalaryChange}
                                        className="w-full p-2 border-b-2 border-gray-300 focus:border-black outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Break Time (hrs):</label>
                                    <input
                                        type="number"
                                        name="breakTime"
                                        value={salaryData.breakTime}
                                        onChange={handleSalaryChange}
                                        className="w-full p-2 border-b-2 border-gray-300 focus:border-black outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Split Columns: Components vs Deductions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                            {/* LEFT: Salary Components */}
                            <div>
                                <h3 className="font-bold text-lg border-b-2 border-gray-800 pb-2 mb-6">Salary Components</h3>
                                <div className="space-y-6">

                                    {/* Component Row Helper */}
                                    {[
                                        { label: 'Basic Salary', name: 'basicSalary', desc: 'Define Basic salary from company cost..', pct: '50.00 %' },
                                        { label: 'House Rent Allowance', name: 'hra', desc: 'HRA provided to employees 50% of basic', pct: '50.00 %' },
                                        { label: 'Standard Allowance', name: 'standardAllowance', desc: 'Fixed amount provided to employee', pct: '16.67 %' },
                                        { label: 'Performance Bonus', name: 'performanceBonus', desc: 'Variable amount paid during payroll', pct: '8.33 %' },
                                        { label: 'Leave Travel Allowance', name: 'lta', desc: 'LTA is paid by the company to cover travel', pct: '8.33 %' },
                                        { label: 'Fixed Allowance', name: 'fixedAllowance', desc: 'Balancing figure', pct: '11.67 %' },
                                    ].map((field) => (
                                        <div key={field.name}>
                                            <div className="flex justify-between items-end gap-4 mb-1">
                                                <label className="font-medium text-gray-700 w-1/3">{field.label}</label>
                                                <div className="flex-1 flex items-center border-b-2 border-black pb-1">
                                                    <input
                                                        type="number"
                                                        name={field.name}
                                                        value={salaryData[field.name]}
                                                        onChange={handleSalaryChange}
                                                        className="w-full outline-none font-semibold text-right pr-2 bg-transparent"
                                                    />
                                                    <span className="text-gray-500 text-sm whitespace-nowrap">₹ / month</span>
                                                </div>
                                                <span className="font-bold text-gray-800 w-16 text-right">{field.pct}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 max-w-xs">{field.desc}</p>
                                        </div>
                                    ))}

                                </div>
                            </div>

                            {/* RIGHT: PF & Deductions */}
                            <div>
                                <h3 className="font-bold text-lg border-b-2 border-gray-800 pb-2 mb-6">Provident Fund (PF) Contribution</h3>
                                <div className="space-y-6 mb-10">

                                    <div className="flex justify-between items-end gap-4">
                                        <label className="font-medium text-gray-700 w-1/3">Employee</label>
                                        <div className="flex-1 flex items-center border-b-2 border-black pb-1">
                                            <input
                                                type="number"
                                                name="pfEmployee"
                                                value={salaryData.pfEmployee}
                                                onChange={handleSalaryChange}
                                                className="w-full outline-none font-semibold text-right pr-2 bg-transparent"
                                            />
                                            <span className="text-sm text-gray-500">₹ / month</span>
                                        </div>
                                        <span className="font-bold text-gray-800 w-16 text-right">12.00 %</span>
                                    </div>
                                    <p className="text-xs text-gray-400">PF is calculated based on the basic salary</p>

                                    <div className="flex justify-between items-end gap-4">
                                        <label className="font-medium text-gray-700 w-1/3">Employer</label>
                                        <div className="flex-1 flex items-center border-b-2 border-black pb-1">
                                            <input
                                                type="number"
                                                name="pfEmployer"
                                                value={salaryData.pfEmployer}
                                                onChange={handleSalaryChange}
                                                className="w-full outline-none font-semibold text-right pr-2 bg-transparent"
                                            />
                                            <span className="text-sm text-gray-500">₹ / month</span>
                                        </div>
                                        <span className="font-bold text-gray-800 w-16 text-right">12.00 %</span>
                                    </div>
                                    <p className="text-xs text-gray-400">PF is calculated based on the basic salary</p>
                                </div>

                                <h3 className="font-bold text-lg border-b-2 border-gray-800 pb-2 mb-6">Tax Deductions</h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end gap-4">
                                        <label className="font-medium text-gray-700 w-1/3">Professional Tax</label>
                                        <div className="flex-1 flex items-center border-b-2 border-black pb-1">
                                            <input
                                                type="number"
                                                name="professionalTax"
                                                value={salaryData.professionalTax}
                                                onChange={handleSalaryChange}
                                                className="w-full outline-none font-semibold text-right pr-2 bg-transparent"
                                            />
                                            <span className="text-sm text-gray-500">₹ / month</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400">Professional Tax deducted from the Gross salary</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-8 mt-8 border-t border-gray-100">
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg font-medium"
                    >
                        <Save size={20} />
                        Save All Changes
                    </button>
                </div>
            </form>
            {/* --- DOCUMENTS TAB --- */}
            {activeTab === 'documents' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Employee Documents</h3>
                    </div>

                    {/* Documents List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {documents.length > 0 ? (
                            documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{doc.originalName || 'Document'}</p>
                                            <p className="text-xs text-gray-500 uppercase">{doc.type.replace('_', ' ')} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
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
                            ))
                        ) : (
                            <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                <p className="text-gray-500">No documents uploaded yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Upload Section */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload size={18} />
                            Upload New Document
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                <select
                                    id="docType"
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
                                    id="docFile"
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
            )}
        </div>
    );
};

export default EditEmployee;
