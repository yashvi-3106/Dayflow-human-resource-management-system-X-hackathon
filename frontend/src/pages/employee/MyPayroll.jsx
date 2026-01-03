import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { DollarSign, Download, FileText } from 'lucide-react';

const MyPayroll = () => {
    const { user } = useAuth();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayroll = async () => {
            try {
                const { data } = await api.get('/payroll/me');
                if (data.success) {
                    setPayrolls(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch payroll', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayroll();
    }, []);

    const generatePDF = (slip) => {
        const doc = new jsPDF();

        // --- Header ---
        doc.setFontSize(20);
        doc.setTextColor(41, 128, 185);
        doc.text(user?.company?.name || 'Company Name', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Payslip for ' + slip.month, 105, 30, { align: 'center' });

        // --- Employee Details ---
        doc.setFontSize(10);
        doc.setTextColor(0);

        const detailsY = 45;
        doc.text(`Employee Name: ${user.firstName} ${user.lastName}`, 14, detailsY);
        doc.text(`Employee ID: ${user.loginId || 'N/A'}`, 14, detailsY + 7);
        doc.text(`Designation: ${user.role === 'ADMIN' ? 'Administrator' : 'Employee'}`, 14, detailsY + 14);
        // Note: Real app should store designation in User or fetch attached Employee Designation

        doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 150, detailsY);
        doc.text(`Status: ${slip.status}`, 150, detailsY + 7);

        // --- Table ---
        const tableBody = [
            ['Basic Salary', `Rs. ${slip.salaryStructure?.basic}`],
            ['HRA', `Rs. ${slip.salaryStructure?.hra || 0}`],
            ['Allowances', `Rs. ${slip.salaryStructure?.allowances || 0}`], // Check if structure has allowances?
            // Wait, schema has conveyance/insurance, verify model. 
            // Model: basic, hra, conveyance, pf, insurance.
            // Let's use flexible access safely.
            ['Conveyance', `Rs. ${slip.salaryStructure?.conveyance || 0}`],
            ['Insurance', `Rs. ${slip.salaryStructure?.insurance || 0}`],
            ['Provident Fund (PF)', `Rs. ${slip.salaryStructure?.pf || 0}`],
            ['', ''], // Spacer
            ['Gross Salary', `Rs. ${slip.grossSalary}`],
            ['Total Payable Days', `${slip.payableDays}`],
            ['Net Payable Salary', `Rs. ${slip.netSalary}`],
        ];

        autoTable(doc, {
            startY: 70,
            head: [['Description', 'Amount']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 60, halign: 'right' }
            }
        });

        // --- Footer ---
        const finalY = doc.lastAutoTable.finalY || 150;
        doc.setFontSize(10);
        doc.text('* This is a system generated payslip.', 14, finalY + 20);

        doc.save(`Payslip_${slip.month}_${user.firstName}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
                <p className="text-gray-500">View and download your salary slips</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payrolls.length > 0 ? (
                    payrolls.map((slip) => (
                        <div key={slip._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                                    <DollarSign size={24} />
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${slip.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {slip.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900">{slip.month}</h3>
                            <p className="text-gray-500 text-sm mb-4">Salary Slip</p>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Gross Salary</span>
                                    <span className="font-medium text-gray-900">₹{slip.grossSalary}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Payable Days</span>
                                    <span className="font-medium text-gray-900">{slip.payableDays}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-bold">
                                    <span className="text-gray-900">Net Pay</span>
                                    <span className="text-green-600">₹{slip.netSalary}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => generatePDF(slip)}
                                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                <Download size={18} className="mr-2" />
                                Download PDF
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No payslips generated yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPayroll;
