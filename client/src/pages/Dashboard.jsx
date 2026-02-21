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
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import { getCurrencySymbol } from '../utils/currencyMap';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const authContext = useContext(AuthContext);
    const { isAuthenticated, loading, user } = authContext;
    const [invoices, setInvoices] = useState([]);
    const [metrics, setMetrics] = useState({
        items: []
    });
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });
    const [filter, setFilter] = useState('Yearly');

    useEffect(() => {
        if (isAuthenticated) {
            getInvoices();
        }
    }, [isAuthenticated, user?.activeWorkspace]);

    const getInvoices = async () => {
        try {
            const res = await axios.get('/api/invoices');
            setInvoices(res.data);
            calculateMetrics(res.data);
            prepareChartData(res.data, filter);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (invoices.length > 0) {
            prepareChartData(invoices, filter);
        }
    }, [filter, invoices]);

    const deleteInvoice = async (id) => {
        try {
            await axios.delete(`/api/invoices/${id}`);
            const updatedInvoices = invoices.filter(invoice => invoice._id !== id);
            setInvoices(updatedInvoices);
            calculateMetrics(updatedInvoices);
            prepareChartData(updatedInvoices);
        } catch (err) {
            console.error(err);
        }
    }

    const calculateMetrics = (data) => {
        const now = moment();
        const currentMonth = now.month();
        const lastMonth = moment().subtract(1, 'months').month();
        const currentYear = now.year();

        // 1. Revenue Trend (This month vs Last month)
        const currentMonthRevenue = data
            .filter(inv => moment(inv.date).month() === currentMonth && moment(inv.date).year() === currentYear)
            .reduce((acc, inv) => acc + inv.total, 0);

        const lastMonthRevenue = data
            .filter(inv => moment(inv.date).month() === lastMonth && moment(inv.date).year() === (lastMonth === 11 ? currentYear - 1 : currentYear))
            .reduce((acc, inv) => acc + inv.total, 0);

        const revenueGrowth = lastMonthRevenue === 0 ? 100 : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

        // 2. Total Invoices Sent
        const totalInvoices = data.length;

        // 3. Tax Summary (GST Collected)
        // Assuming GST is included in total or calculated separately. 
        // Using a simple estimate if not stored: total * (gstRate/100)
        const totalTax = data.reduce((acc, inv) => {
            const taxAmount = inv.gstRate ? (inv.total * inv.gstRate / (100 + inv.gstRate)) : 0;
            return acc + taxAmount;
        }, 0);

        // 4. Due This Week
        const startOfWeek = moment().startOf('week');
        const endOfWeek = moment().endOf('week');
        const dueThisWeek = data
            .filter(inv => inv.dueDate && moment(inv.dueDate).isBetween(startOfWeek, endOfWeek, 'day', '[]'))
            .reduce((acc, inv) => acc + inv.total, 0);

        // 5. Reoccurring (Placeholder: Pending Invoices)
        const reoccurring = data
            .filter(inv => inv.status === 'Pending')
            .reduce((acc, inv) => acc + inv.total, 0);

        // 6. Expenses & Net Profit
        axios.get('/api/expenses').then(res => {
            const expenses = res.data;
            const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
            const totalRevenue = data.reduce((acc, inv) => acc + inv.total, 0);
            const netProfit = totalRevenue - totalExpenses;

            const currencySymbol = getCurrencySymbol(user?.settings?.currency);

            setMetrics([
                { title: 'Revenue trend', amount: `${currencySymbol}${currentMonthRevenue.toFixed(2)}`, trend: `${revenueGrowth.toFixed(1)}% Compared to last month`, icon: 'fa-chart-bar' },
                { title: 'Pending Invoices', amount: `${currencySymbol}${reoccurring.toFixed(2)}`, trend: '10% Compared to last month', icon: 'fa-file-invoice-dollar' },
                { title: 'Total Invoice sent', amount: totalInvoices, trend: '10% Compared to last month', icon: 'fa-paper-plane' },
                { title: 'Total Expenses', amount: `${currencySymbol}${totalExpenses.toFixed(2)}`, trend: 'cost', icon: 'fa-money-bill-wave' },
                { title: 'Net Profit', amount: `${currencySymbol}${netProfit.toFixed(2)}`, trend: 'Revenue - Expenses', icon: 'fa-wallet' },
            ]);
        }).catch(err => console.error(err));
    };

    const prepareChartData = (data, currentFilter) => {
        const labels = [];
        const revenueData = [];
        const now = moment();

        if (currentFilter === 'Yearly') {
            for (let i = 0; i < 12; i++) {
                labels.push(moment().month(i).format('MMM'));
                const monthRevenue = data
                    .filter(inv => moment(inv.date).month() === i && moment(inv.date).year() === now.year())
                    .reduce((acc, inv) => acc + inv.total, 0);
                revenueData.push(monthRevenue);
            }
        } else if (currentFilter === 'Quarterly') {
            for (let i = 1; i <= 4; i++) {
                labels.push(`Q${i}`);
                const quarterRevenue = data
                    .filter(inv => moment(inv.date).quarter() === i && moment(inv.date).year() === now.year())
                    .reduce((acc, inv) => acc + inv.total, 0);
                revenueData.push(quarterRevenue);
            }
        } else if (currentFilter === 'Monthly') {
            const daysInMonth = now.daysInMonth();
            for (let i = 1; i <= daysInMonth; i++) {
                labels.push(i);
                const dayRevenue = data
                    .filter(inv => moment(inv.date).date() === i && moment(inv.date).month() === now.month() && moment(inv.date).year() === now.year())
                    .reduce((acc, inv) => acc + inv.total, 0);
                revenueData.push(dayRevenue);
            }
        } else if (currentFilter === 'Weekly') {
            const startOfWeek = moment().startOf('week');
            for (let i = 0; i < 7; i++) {
                const day = startOfWeek.clone().add(i, 'days');
                labels.push(day.format('ddd'));
                const dayRevenue = data
                    .filter(inv => moment(inv.date).isSame(day, 'day'))
                    .reduce((acc, inv) => acc + inv.total, 0);
                revenueData.push(dayRevenue);
            }
        } else if (currentFilter === 'Daily') {
            for (let i = 0; i < 24; i++) {
                labels.push(`${i}:00`);
                // Check if invoice date matches today and the specific hour
                const hourRevenue = data
                    .filter(inv => {
                        const invDate = moment(inv.date);
                        return invDate.isSame(now, 'day') && invDate.hour() === i;
                    })
                    .reduce((acc, inv) => acc + inv.total, 0);
                revenueData.push(hourRevenue);
            }
        }

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: '#1a73e8',
                    borderRadius: 4,
                    barThickness: currentFilter === 'Monthly' ? 10 : 20,
                },
            ],
        });
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    borderDash: [2, 2],
                    color: '#e0e5f2',
                },
                ticks: {
                    display: true // Show Y axis labels
                },
                border: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false,
                },
                border: {
                    display: false
                }
            },
        },
    };

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return (
            <div className="landing">
                <h1>Welcome to BillSphere</h1>
                <p>Manage your invoices with ease.</p>
                <Link to="/login" className="btn btn-primary">Login</Link>
            </div>
        )
    }

    // Sort invoices by date descending
    const sortedInvoices = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));

    const currencySymbol = getCurrencySymbol(user?.settings?.currency);

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <h1 className="large mb-2">Dashboard</h1>

            {/* Top Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {metrics.length > 0 && metrics.map((item, index) => (
                    <div key={index} className="card flex" style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div className="flex align-center mb-1">
                            <div style={{ background: '#f4f7fe', padding: '10px', borderRadius: '50%', color: '#1a73e8', marginRight: '10px' }}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <span style={{ color: '#a3aed0', fontSize: '0.9rem' }}>{item.title}</span>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{item.amount}</h2>
                            <p style={{ fontSize: '0.8rem', color: '#a3aed0' }}>
                                <span style={{ color: '#05cd99', marginRight: '5px' }}><i className="fas fa-arrow-up"></i></span>
                                {item.trend}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Overview Chart */}
            <div className="card mb-2">
                <div className="flex justify-between align-center mb-2">
                    <h2 style={{ fontSize: '1.2rem' }}>Revenue Overview</h2>
                    <div className="flex align-center">
                        <h3 className="mr-2" style={{ marginRight: '1rem' }}>{currencySymbol}{invoices.reduce((acc, inv) => acc + inv.total, 0).toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#05cd99', fontWeight: 'normal' }}><i className="fas fa-arrow-up"></i> 10%</span></h3>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{ border: '1px solid #e0e5f2', padding: '5px 10px', borderRadius: '5px', color: '#a3aed0', outline: 'none' }}
                        >
                            <option value="Yearly">Yearly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Daily">Daily</option>
                        </select>
                    </div>
                </div>
                <div style={{ height: '300px', position: 'relative' }}>
                    <Bar options={chartOptions} data={chartData} />
                </div>
            </div>

            {/* Recent Invoices Table */}
            <h2 className="mb-1" style={{ fontSize: '1.2rem' }}>Recent Invoices</h2>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f4f7fe' }}>
                                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a3aed0', fontWeight: '500', fontSize: '0.9rem' }}>Invoice ID</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a3aed0', fontWeight: '500', fontSize: '0.9rem' }}>Client</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a3aed0', fontWeight: '500', fontSize: '0.9rem' }}>Issue Date</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a3aed0', fontWeight: '500', fontSize: '0.9rem' }}>Due Date</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a3aed0', fontWeight: '500', fontSize: '0.9rem' }}>Amount</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a3aed0', fontWeight: '500', fontSize: '0.9rem' }}>Payment Method</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a3aed0', fontWeight: '500', fontSize: '0.9rem' }}>Status</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a3aed0', fontWeight: '500', fontSize: '0.9rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedInvoices.map(invoice => (
                                <tr key={invoice._id} style={{ borderBottom: '1px solid #f4f7fe' }}>
                                    <td style={{ padding: '15px 20px' }}>
                                        <Link to={`/invoice/${invoice._id}`} style={{ fontWeight: '500', color: '#1a73e8' }}>
                                            {invoice._id.substring(0, 8).toUpperCase()}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div className="flex align-center">
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e0e5f2', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {invoice.clientName.charAt(0)}
                                            </div>
                                            {invoice.clientName}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>{moment(invoice.date).format('DD-MM-YYYY')}</td>
                                    <td style={{ padding: '15px 20px' }}>{invoice.dueDate ? moment(invoice.dueDate).format('DD-MM-YYYY') : '-'}</td>
                                    <td style={{ padding: '15px 20px' }}>{currencySymbol}{invoice.total.toLocaleString()}</td>
                                    <td style={{ padding: '15px 20px' }}>
                                        {invoice.payments && invoice.payments.length > 0 ? invoice.payments[0].method : 'Bank Transfer'}
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <span className={`badge ${invoice.status === 'Paid' ? 'badge-success' : 'badge-danger'}`} style={{
                                            background: invoice.status === 'Paid' ? 'rgba(5, 205, 153, 0.1)' : 'rgba(238, 93, 80, 0.1)',
                                            color: invoice.status === 'Paid' ? '#05cd99' : '#ee5d50'
                                        }}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div className="flex">
                                            <Link to={`/invoice/${invoice._id}`} style={{ marginRight: '10px', color: '#a3aed0' }}><i className="fas fa-eye"></i></Link>
                                            <Link to={`/edit-invoice/${invoice._id}`} style={{ marginRight: '10px', color: '#a3aed0' }}><i className="fas fa-edit"></i></Link>
                                            <button onClick={() => deleteInvoice(invoice._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ee5d50' }}><i className="fas fa-trash"></i></button>
                                        </div>
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

export default Dashboard;
