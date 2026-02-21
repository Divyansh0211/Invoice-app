import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/authContext';

const Estimates = () => {
    const { user } = useContext(AuthContext);
    const [estimates, setEstimates] = useState([]);
    const navigate = useNavigate();

    const activeWorkspaceId = user?.activeWorkspace?._id || user?.activeWorkspace;
    const userRole = user?.workspaces?.find(w => w.workspace === activeWorkspaceId || w.workspace?._id === activeWorkspaceId)?.role || 'Staff';
    const isPrivileged = userRole === 'Owner' || userRole === 'Admin' || userRole === 'Staff'; // Often all can create estimates

    const getEstimates = async () => {
        try {
            const res = await axios.get('/api/estimates');
            setEstimates(res.data);
        } catch (err) {
            console.error('Error fetching estimates', err);
        }
    };

    useEffect(() => {
        getEstimates();
    }, [user?.activeWorkspace]);

    const deleteEstimate = async id => {
        if (window.confirm('Are you sure you want to delete this estimate?')) {
            try {
                await axios.delete(`/api/estimates/${id}`);
                setEstimates(estimates.filter(e => e._id !== id));
            } catch (err) {
                console.error('Error deleting estimate', err);
                alert('Only Owners and Admins can delete estimates.');
            }
        }
    };

    const getCurrencySymbol = (currency) => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            case 'JPY': return '¥';
            default: return '$';
        }
    };

    return (
        <div>
            <h1 className="large text-primary">Quotes & Estimates</h1>
            <p className="lead"><i className="fas fa-file-signature"></i> Create and manage your estimates</p>

            {isPrivileged && (
                <div style={{ marginBottom: '20px' }}>
                    <Link to="/create-estimate" className="btn btn-primary">
                        <i className="fas fa-plus"></i> Create New Estimate
                    </Link>
                </div>
            )}

            <div className="card">
                <h3>Recent Estimates</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Number</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estimates.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center' }}>No estimates found.</td>
                            </tr>
                        ) : null}
                        {estimates.map(e => (
                            <tr key={e._id}>
                                <td>{e.estimateNumber}</td>
                                <td>{e.customer ? e.customer.name : 'Unknown Customer'}</td>
                                <td>{new Date(e.date).toLocaleDateString()}</td>
                                <td>{getCurrencySymbol(user?.settings?.currency)} {e.totalAmount.toFixed(2)}</td>
                                <td>
                                    <span className={`badge ${e.status === 'Draft' ? 'badge-light' : e.status === 'Sent' ? 'badge-primary' : e.status === 'Approved' ? 'badge-success' : e.status === 'Converted' ? 'badge-dark' : 'badge-danger'}`}>
                                        {e.status}
                                    </span>
                                </td>
                                <td>
                                    <Link to={`/estimate/${e._id}`} className="btn btn-dark btn-sm" style={{ marginRight: '5px' }}>View</Link>
                                    <Link to={`/edit-estimate/${e._id}`} className="btn btn-light btn-sm" style={{ marginRight: '5px' }}>Edit</Link>
                                    {(userRole === 'Owner' || userRole === 'Admin') && (
                                        <button onClick={() => deleteEstimate(e._id)} className="btn btn-danger btn-sm">Delete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Estimates;
