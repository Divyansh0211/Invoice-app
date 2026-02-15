import { useState, useEffect } from 'react';
import axios from 'axios';
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Reports = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalPaid: 0,
        totalPending: 0,
        totalInvoices: 0,
        customersCount: 0,
        productsCount: 0
    });

    useEffect(() => {
        getStats();
    }, []);

    const getStats = async () => {
        try {
            const res = await axios.get('/api/reports/dashboard-stats');
            setStats(res.data);
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

    return (
        <div>
            <h1 className="large text-primary">Reports & Analytics</h1>

            <div className="grid-3">
                <div className="card text-center">
                    <h2 className="text-primary">${stats.totalSales.toFixed(2)}</h2>
                    <p>Total Sales</p>
                </div>
                <div className="card text-center">
                    <h2 className="text-success">${stats.totalPaid.toFixed(2)}</h2>
                    <p>Total Paid</p>
                </div>
                <div className="card text-center">
                    <h2 className="text-danger">${stats.totalPending.toFixed(2)}</h2>
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

            <div className="card my-1" style={{ height: '400px' }}>
                <Bar options={options} data={data} />
            </div>
        </div>
    );
};

export default Reports;
