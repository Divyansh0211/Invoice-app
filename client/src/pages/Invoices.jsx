import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { getCurrencySymbol } from '../utils/currencyMap';

const Invoices = () => {
    const authContext = useContext(AuthContext);
    const { isAuthenticated, loading } = authContext;
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

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
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await axios.delete(`/api/invoices/${id}`);
                setInvoices(invoices.filter(invoice => invoice._id !== id));
            } catch (err) {
                console.error(err);
            }
        }
    }

    const sendReminder = async (id) => {
        if (window.confirm('Send payment reminder email to client?')) {
            try {
                await axios.post(`/api/invoices/${id}/remind`);
                alert('Reminder sent successfully!');
            } catch (err) {
                console.error(err);
                alert('Failed to send reminder.');
            }
        }
    };

    const filteredInvoices = invoices.filter(invoice =>
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice._id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <div className="flex justify-between align-center mb-2">
                <h1 className="large">Invoices</h1>
                <Link to="/create-invoice" className="btn btn-create">
                    <i className="fas fa-plus"></i> Create New
                </Link>
            </div>

            <div className="card mb-2">
                <div className="flex align-center p-2" style={{ borderBottom: '1px solid #e0e5f2' }}>
                    <i className="fas fa-search" style={{ color: '#a3aed0', marginRight: '10px' }}></i>
                    <input
                        type="text"
                        placeholder="Search by Client or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem', color: '#2b3674' }}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f4f7fe' }}>
                                <th>Invoice ID</th>
                                <th>Client</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map(invoice => (
                                    <tr key={invoice._id} style={{ borderBottom: '1px solid #f4f7fe' }}>
                                        <td>
                                            <Link to={`/invoice/${invoice._id}`} style={{ fontWeight: '500', color: '#1a73e8' }}>
                                                {invoice._id.substring(0, 8).toUpperCase()}
                                            </Link>
                                        </td>
                                        <td>
                                            <div className="flex align-center">
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e0e5f2', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                    {invoice.clientName.charAt(0)}
                                                </div>
                                                {invoice.clientName}
                                            </div>
                                        </td>
                                        <td>{moment(invoice.date).format('DD MMM YYYY')}</td>
                                        <td>{invoice.dueDate ? moment(invoice.dueDate).format('DD MMM YYYY') : '-'}</td>
                                        <td>{getCurrencySymbol(invoice.currency)}{invoice.total.toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${invoice.status === 'Paid' ? 'badge-success' : 'badge-danger'}`} style={{
                                                background: invoice.status === 'Paid' ? 'rgba(5, 205, 153, 0.1)' : 'rgba(238, 93, 80, 0.1)',
                                                color: invoice.status === 'Paid' ? '#05cd99' : '#ee5d50'
                                            }}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/invoice/${invoice._id}`} className="btn btn-sm btn-light"><i className="fas fa-eye"></i></Link>
                                            <Link to={`/edit-invoice/${invoice._id}`} className="btn btn-sm btn-light"><i className="fas fa-edit"></i></Link>
                                            <button onClick={() => deleteInvoice(invoice._id)} className="btn btn-sm btn-light" style={{ color: '#ee5d50' }}><i className="fas fa-trash"></i></button>
                                            {invoice.status !== 'Paid' && (
                                                <button onClick={() => sendReminder(invoice._id)} className="btn btn-sm btn-dark" style={{ marginLeft: '5px' }} title="Send Payment Reminder">
                                                    <i className="fas fa-bell"></i> Remind
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center p-2">No invoices found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Invoices;
