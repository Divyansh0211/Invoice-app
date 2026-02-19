import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { getCurrencySymbol } from '../utils/currencyMap';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Reports = () => {
    const { user } = useContext(AuthContext);
    const currencySymbol = getCurrencySymbol(user?.settings?.currency);

    const [stats, setStats] = useState({
        totalSales: 0,
        totalPaid: 0,
        totalPending: 0,
        totalInvoices: 0,
        customersCount: 0,
        productsCount: 0
    });

    const [advancedStats, setAdvancedStats] = useState({
        pendingCustomers: [],
        partialInvoices: [],
        overdueInvoices: [],
        dueInvoices: []
    });

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const reportType = queryParams.get('view') || 'overview';

    useEffect(() => {
        getStats();
        getAdvancedStats();
    }, []);

    const getStats = async () => {
        try {
            const res = await axios.get('/api/reports/dashboard-stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const getAdvancedStats = async () => {
        try {
            const res = await axios.get('/api/reports/advanced');
            setAdvancedStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const data = {
        labels: ['Sales', 'Paid', 'Pending'],
        datasets: [
            {
                label: 'Amount ($)',
                data: [stats.totalSales, stats.totalPaid, stats.totalPending],
                backgroundColor: [
                    'rgba(53, 162, 235, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                ],
                borderColor: [
                    'rgb(53, 162, 235)',
                    'rgb(75, 192, 192)',
                    'rgb(255, 99, 132)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Financial Overview',
            },
        },
    };

    const renderReportContent = () => {
        switch (reportType) {
            case 'pendingCustomers':
                return (
                    <div className="card my-2">
                        <h3>Pending Customers</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                                    <th>Customer Name</th>
                                    <th>Pending Invoices</th>
                                    <th>Total Pending Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advancedStats.pendingCustomers.map((c, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td>{c.name}</td>
                                        <td>{c.count}</td>
                                        <td className="text-danger">{currencySymbol}{c.totalPending.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'partial':
                return (
                    <div className="card my-2">
                        <h3>Partially Paid Invoices</h3>
                        {advancedStats.partialInvoices.map(inv => (
                            <div key={inv._id} className="card bg-light my-1 p-1">
                                <p><strong>Client:</strong> {inv.clientName}</p>
                                <p><strong>Total:</strong> {currencySymbol}{inv.total.toFixed(2)}</p>
                                <p><strong>Paid:</strong> <span className="text-success">{currencySymbol}{inv.paidAmount.toFixed(2)}</span></p>
                                <p><strong>Remaining:</strong> <span className="text-danger">{currencySymbol}{inv.pendingAmount.toFixed(2)}</span></p>
                            </div>
                        ))}
                    </div>
                );
            case 'overdue':
                return (
                    <div className="card my-2">
                        <h3>Overdue Invoices</h3>
                        {advancedStats.overdueInvoices.length > 0 ? advancedStats.overdueInvoices.map(inv => (
                            <div key={inv._id} className="card bg-light my-1 p-1" style={{ borderLeft: '5px solid #dc3545' }}>
                                <p><strong>Client:</strong> {inv.clientName}</p>
                                <p><strong>Due Date:</strong> {new Date(inv.dueDate).toLocaleDateString()}</p>
                                <p><strong>Days Overdue:</strong> {inv.daysOverdue}</p>
                                <p><strong>Amount Due:</strong> <span className="text-danger">{currencySymbol}{inv.pendingAmount.toFixed(2)}</span></p>
                            </div>
                        )) : <p>No overdue invoices found.</p>}
                    </div>
                );
            case 'dueDates':
                return (
                    <div className="card my-2">
                        <h3>Invoices Sorted by Due Date</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                                    <th>Due Date</th>
                                    <th>Client</th>
                                    <th>Amount Due</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advancedStats.dueInvoices.map(inv => (
                                    <tr key={inv._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
                                        <td>{inv.clientName}</td>
                                        <td>{currencySymbol}{inv.pendingAmount ? inv.pendingAmount.toFixed(2) : (inv.total - (inv.paidAmount || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            default:
                return (
                    <>
                        <div className="grid-3">
                            <div className="card text-center">
                                <h2 className="text-primary">{currencySymbol}{stats.totalSales.toFixed(2)}</h2>
                                <p>Total Sales</p>
                            </div>
                            <div className="card text-center">
                                <h2 className="text-success">{currencySymbol}{stats.totalPaid.toFixed(2)}</h2>
                                <p>Total Paid</p>
                            </div>
                            <div className="card text-center">
                                <h2 className="text-danger">{currencySymbol}{stats.totalPending.toFixed(2)}</h2>
                                <p>Total Pending</p>
                            </div>
                        </div>

                        <div className="grid-3 my-1">
                            <div className="card text-center">
                                <h2>{stats.totalInvoices}</h2>
                                <p>Total Invoices</p>
                            </div>
                            <div className="card text-center">
                                <h2>{stats.customersCount}</h2>
                                <p>Customers</p>
                            </div>
                            <div className="card text-center">
                                <h2>{stats.productsCount}</h2>
                                <p>Products</p>
                            </div>
                        </div>

                        <div className="card my-1" style={{ height: '600px' }}>
                            <Bar options={options} data={data} />
                        </div>
                    </>
                );
        }
    };

    const downloadPDF = () => {
        try {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString();

            doc.setFontSize(18);
            doc.text('Financial Report', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${date}`, 14, 30);

            if (reportType === 'overview') {
                doc.text('Overview', 14, 40);
                autoTable(doc, {
                    startY: 45,
                    head: [['Metric', 'Value']],
                    body: [
                        ['Total Sales', `${currencySymbol}${stats.totalSales.toFixed(2)}`],
                        ['Total Paid', `${currencySymbol}${stats.totalPaid.toFixed(2)}`],
                        ['Total Pending', `${currencySymbol}${stats.totalPending.toFixed(2)}`],
                        ['Total Invoices', stats.totalInvoices],
                        ['Total Customers', stats.customersCount],
                        ['Total Products', stats.productsCount],
                    ],
                });
            } else if (reportType === 'pendingCustomers') {
                doc.text('Pending Customers Report', 14, 40);
                autoTable(doc, {
                    startY: 45,
                    head: [['Customer Name', 'Pending Invoices', 'Total Pending Amount']],
                    body: advancedStats.pendingCustomers.map(c => [c.name, c.count, `${currencySymbol}${c.totalPending.toFixed(2)}`]),
                });
            } else if (reportType === 'partial') {
                doc.text('Partially Paid Invoices Report', 14, 40);
                autoTable(doc, {
                    startY: 45,
                    head: [['Client', 'Total Amount', 'Paid Amount', 'Remaining Amount']],
                    body: advancedStats.partialInvoices.map(inv => [
                        inv.clientName,
                        `${currencySymbol}${inv.total.toFixed(2)}`,
                        `${currencySymbol}${inv.paidAmount.toFixed(2)}`,
                        `${currencySymbol}${inv.pendingAmount.toFixed(2)}`
                    ]),
                });
            } else if (reportType === 'overdue') {
                doc.text('Overdue Invoices Report', 14, 40);
                autoTable(doc, {
                    startY: 45,
                    head: [['Client', 'Due Date', 'Days Overdue', 'Amount Due']],
                    body: advancedStats.overdueInvoices.map(inv => [
                        inv.clientName,
                        new Date(inv.dueDate).toLocaleDateString(),
                        inv.daysOverdue,
                        `${currencySymbol}${inv.pendingAmount.toFixed(2)}`
                    ]),
                });
            } else if (reportType === 'dueDates') {
                doc.text('Invoices Sorted by Due Date', 14, 40);
                autoTable(doc, {
                    startY: 45,
                    head: [['Due Date', 'Client', 'Amount Due']],
                    body: advancedStats.dueInvoices.map(inv => [
                        new Date(inv.dueDate).toLocaleDateString(),
                        inv.clientName,
                        `${currencySymbol}${inv.pendingAmount ? inv.pendingAmount.toFixed(2) : (inv.total - (inv.paidAmount || 0)).toFixed(2)}`
                    ]),
                });
            }

            doc.save(`report_${reportType}_${Date.now()}.pdf`);
        } catch (err) {
            console.error("PDF Download Error:", err);
            alert("Failed to download PDF: " + err.message);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="large text-primary">Reports & Analytics</h1>
                <button className="btn btn-dark" onClick={downloadPDF}>
                    <i className="fas fa-file-pdf"></i> Download PDF
                </button>
            </div>

            {renderReportContent()}
        </div>
    );
};

export default Reports;
