import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Link } from 'react-router-dom';

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
            <h1 className="large text-primary">Invoices</h1>
            <p className="lead">
                <i className="fas fa-user"></i> Welcome
            </p>
            <Link to="/create-invoice" className="btn btn-primary my-1">Create Invoice</Link>
            {invoices.length > 0 ? (
                <div className="invoice-grid">
                    {invoices.map(invoice => (
                        <div key={invoice._id} className="card bg-light">
                            <h3>{invoice.clientName}</h3>
                            {invoice.businessName && <p><strong>Business:</strong> {invoice.businessName}</p>}
                            <p>{invoice.clientEmail}</p>
                            <p>Total: ${invoice.total}</p>
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
