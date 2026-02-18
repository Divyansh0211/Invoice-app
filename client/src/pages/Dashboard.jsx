import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const authContext = useContext(AuthContext);
    const { isAuthenticated, loading } = authContext;
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        if (isAuthenticated) {
            getInvoices();
        }
    }, [isAuthenticated]);

    const getInvoices = async () => {
        try {
            const res = await axios.get('/api/invoices');
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteInvoice = async (id) => {
        try {
            await axios.delete(`/api/invoices/${id}`);
            setInvoices(invoices.filter(invoice => invoice._id !== id));
        } catch (err) {
            console.error(err);
        }
    }

    // Analytics Calculations
    const totalSales = invoices.reduce((acc, invoice) => acc + invoice.total, 0);
    const totalPending = invoices.filter(inv => inv.status === 'Pending').reduce((acc, inv) => acc + inv.total, 0);
    const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((acc, inv) => acc + inv.total, 0);
    const totalOverdue = invoices.filter(inv => inv.status === 'Overdue').reduce((acc, inv) => acc + inv.total, 0);

    const barData = {
        labels: ['Total Sales', 'Paid', 'Pending', 'Overdue'],
        datasets: [
            {
                label: 'Amount',
                data: [totalSales, totalPaid, totalPending, totalOverdue],
                backgroundColor: [
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                ],
            },
        ],
    };

    const pieData = {
        labels: ['Paid', 'Pending', 'Overdue'],
        datasets: [
            {
                data: [totalPaid, totalPending, totalOverdue],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                ],
                borderWidth: 1,
            },
        ],
    };

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return (
            <div className="landing">
                <h1>Welcome to Invoice App</h1>
                <p>Manage your invoices with ease.</p>
                <Link to="/login" className="btn btn-primary">Login</Link>
            </div>
        )
    }

    return (
        <div>
            <h1 className="large text-primary">Dashboard</h1>
            <div className="flex justify-between align-center mb-1">
                <p className="lead my-0">
                    <i className="fas fa-user"></i> Welcome {authContext.user && authContext.user.name}
                </p>
                <button onClick={getInvoices} className="btn btn-light btn-sm">
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            {/* Analytics Section */}
            <div className="analytics-section my-2">
                <div className="card-grid">
                    <div className="card bg-light text-center">
                        <h3>Total Sales</h3>
                        <p className="lead">${totalSales.toFixed(2)}</p>
                    </div>
                    <div className="card bg-success text-center">
                        <h3>Total Paid</h3>
                        <p className="lead">${totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="card bg-warning text-center" style={{ backgroundColor: '#ffc107', color: '#333' }}>
                        <h3>Total Pending</h3>
                        <p className="lead">${totalPending.toFixed(2)}</p>
                    </div>
                    <div className="card bg-danger text-center">
                        <h3>Overdue</h3>
                        <p className="lead">${totalOverdue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="charts-grid my-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div className="card">
                        <h3>Financial Overview</h3>
                        <Bar data={barData} />
                    </div>
                    <div className="card">
                        <h3>Invoice Status</h3>
                        <Pie data={pieData} />
                    </div>
                </div>
            </div>
            <Link to="/create-invoice" className="btn btn-create my-1">Create Invoice</Link>
            {invoices.length > 0 ? (
                <div className="invoice-grid">
                    {invoices.map(invoice => (
                        <div key={invoice._id} className="card bg-light">
                            <h3>{invoice.clientName}</h3>
                            {invoice.businessName && <p><strong>Business:</strong> {invoice.businessName}</p>}
                            <p>{invoice.clientEmail}</p>
                            <p>Total: {invoice.currency ? invoice.currency : '$'} {invoice.total}</p>
                            <p>Status: <span className={`badge ${invoice.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>{invoice.status}</span></p>
                            <div className="card-actions">
                                <Link to={`/invoice/${invoice._id}`} className="btn btn-secondary">View</Link>
                                <Link to={`/edit-invoice/${invoice._id}`} className="btn btn-dark">Edit</Link>
                                <button onClick={() => deleteInvoice(invoice._id)} className="btn btn-danger">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No invoices found. <Link to="/create-invoice">Create one</Link></p>
            )}
        </div>
    );
};

export default Dashboard;
