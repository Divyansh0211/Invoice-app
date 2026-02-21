import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// We need a custom Axios instance because the portal uses `x-auth-token` 
// differently from the main app, or we just pass the headers manually.
const portalAxios = axios.create();
portalAxios.interceptors.request.use(config => {
    const token = localStorage.getItem('portalToken');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

const PortalDashboard = () => {
    const [invoices, setInvoices] = useState([]);
    const [estimates, setEstimates] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'estimates'
    const [selectedDocument, setSelectedDocument] = useState(null); // to preview PDF
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('portalToken');
        if (!token) {
            navigate('/portal/login');
            return;
        }

        const fetchPortalData = async () => {
            try {
                // Get user info
                const meRes = await portalAxios.get('/api/portal/me');
                setUserEmail(meRes.data.email);

                // Get invoices and estimates in parallel
                const [invRes, estRes] = await Promise.all([
                    portalAxios.get('/api/portal/invoices'),
                    portalAxios.get('/api/portal/estimates')
                ]);

                setInvoices(invRes.data);
                setEstimates(estRes.data);
            } catch (err) {
                console.error('Error fetching portal data', err);
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('portalToken');
                    navigate('/portal/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPortalData();
    }, [navigate]);

    const logout = () => {
        localStorage.removeItem('portalToken');
        navigate('/portal/login');
    };

    const getCurrencySymbol = (currency) => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            case 'JPY': return '¥';
            default: return currency + ' ';
        }
    };

    // Very basic PDF view. Real-world we'd likely generate the PDF entirely on the backend
    // and serve a download link, or have a hidden DIV to render into canvas.
    // For now we'll just show the details or let them download the simple representation.
    const downloadPDF = async (docType, docId) => {
        alert("In a production app, this would download the PDF for " + docType + " #" + docId + ". Implementing backend PDF generation for the portal is recommended for security and rendering consistency.");
    };

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading your dashboard...</div>;
    }

    const totalDue = invoices
        .filter(inv => inv.status !== 'Paid')
        .reduce((sum, inv) => {
            const paid = inv.payments ? inv.payments.reduce((acc, p) => acc + p.amount, 0) : 0;
            return sum + (inv.total - paid);
        }, 0);

    return (
        <div style={{ background: '#f4f7f6', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <nav style={{ background: '#2c3e50', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Client Portal</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span><i className="fas fa-user-circle"></i> {userEmail}</span>
                    <button onClick={logout} style={{ background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                </div>
            </nav>

            <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                        <h3 style={{ color: '#7f8c8d', margin: '0 0 10px 0', fontSize: '1rem', textTransform: 'uppercase' }}>Total Outstanding</h3>
                        <h2 style={{ fontSize: '2.5rem', color: '#e74c3c', margin: 0 }}>${totalDue.toFixed(2)}</h2>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                        <h3 style={{ color: '#7f8c8d', margin: '0 0 10px 0', fontSize: '1rem', textTransform: 'uppercase' }}>Invoices</h3>
                        <h2 style={{ fontSize: '2.5rem', color: '#2c3e50', margin: 0 }}>{invoices.length}</h2>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                        <h3 style={{ color: '#7f8c8d', margin: '0 0 10px 0', fontSize: '1rem', textTransform: 'uppercase' }}>Estimates</h3>
                        <h2 style={{ fontSize: '2.5rem', color: '#2c3e50', margin: 0 }}>{estimates.length}</h2>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #ecf0f1' }}>
                        <button
                            style={{ flex: 1, padding: '15px', border: 'none', background: activeTab === 'invoices' ? '#ecf0f1' : 'transparent', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', color: activeTab === 'invoices' ? '#2c3e50' : '#7f8c8d' }}
                            onClick={() => setActiveTab('invoices')}
                        >
                            <i className="fas fa-file-invoice"></i> My Invoices
                        </button>
                        <button
                            style={{ flex: 1, padding: '15px', border: 'none', background: activeTab === 'estimates' ? '#ecf0f1' : 'transparent', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', color: activeTab === 'estimates' ? '#2c3e50' : '#7f8c8d' }}
                            onClick={() => setActiveTab('estimates')}
                        >
                            <i className="fas fa-file-signature"></i> My Estimates
                        </button>
                    </div>

                    <div style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '0.8rem', textAlign: 'left' }}>
                                    <th style={{ padding: '15px 20px', borderBottom: '2px solid #ecf0f1' }}>Number</th>
                                    <th style={{ padding: '15px 20px', borderBottom: '2px solid #ecf0f1' }}>Date</th>
                                    <th style={{ padding: '15px 20px', borderBottom: '2px solid #ecf0f1' }}>Amount</th>
                                    <th style={{ padding: '15px 20px', borderBottom: '2px solid #ecf0f1' }}>Status</th>
                                    <th style={{ padding: '15px 20px', borderBottom: '2px solid #ecf0f1', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === 'invoices' && invoices.length === 0 && (
                                    <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>No invoices found.</td></tr>
                                )}
                                {activeTab === 'invoices' && invoices.map(inv => {
                                    const totalPaid = inv.payments ? inv.payments.reduce((acc, p) => acc + p.amount, 0) : 0;
                                    const balance = inv.total - totalPaid;
                                    return (
                                        <tr key={inv._id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                                            <td style={{ padding: '15px 20px', fontWeight: '500' }}>{inv.invoiceNumber}</td>
                                            <td style={{ padding: '15px 20px' }}>{new Date(inv.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '15px 20px' }}>{getCurrencySymbol(inv.currency)} {inv.total.toFixed(2)}</td>
                                            <td style={{ padding: '15px 20px' }}>
                                                <span style={{
                                                    padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold',
                                                    background: inv.status === 'Paid' ? '#d4edda' : inv.status === 'Overdue' ? '#f8d7da' : '#cce5ff',
                                                    color: inv.status === 'Paid' ? '#155724' : inv.status === 'Overdue' ? '#721c24' : '#004085'
                                                }}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                                <button onClick={() => downloadPDF('Invoice', inv.invoiceNumber)} style={{ background: 'transparent', border: '1px solid #bdc3c7', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', color: '#7f8c8d' }}>
                                                    <i className="fas fa-download"></i> PDF
                                                </button>
                                                {inv.status !== 'Paid' && (
                                                    <button style={{ background: '#2ecc71', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', color: 'white', marginLeft: '10px', fontWeight: 'bold' }}>
                                                        Pay {getCurrencySymbol(inv.currency)}{balance.toFixed(2)}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {activeTab === 'estimates' && estimates.length === 0 && (
                                    <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>No estimates found.</td></tr>
                                )}
                                {activeTab === 'estimates' && estimates.map(est => (
                                    <tr key={est._id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: '500' }}>{est.estimateNumber}</td>
                                        <td style={{ padding: '15px 20px' }}>{new Date(est.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px 20px' }}>{getCurrencySymbol(est.currency)} {est.totalAmount.toFixed(2)}</td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <span style={{
                                                padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold',
                                                background: est.status === 'Approved' ? '#d4edda' : est.status === 'Rejected' ? '#f8d7da' : '#e2e3e5',
                                                color: est.status === 'Approved' ? '#155724' : est.status === 'Rejected' ? '#721c24' : '#383d41'
                                            }}>
                                                {est.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                            <button onClick={() => downloadPDF('Estimate', est.estimateNumber)} style={{ background: 'transparent', border: '1px solid #bdc3c7', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', color: '#7f8c8d' }}>
                                                <i className="fas fa-download"></i> PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortalDashboard;
