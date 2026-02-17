import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/authContext';

const Sidebar = () => {
    const authContext = useContext(AuthContext);
    const { isAuthenticated } = authContext;

    if (!isAuthenticated) return null;

    const [showReports, setShowReports] = useState(false);

    return (
        <div className="sidebar">
            <ul>
                <li><Link to="/"><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
                <li><Link to="/customers"><i className="fas fa-users"></i> Customers</Link></li>
                <li><Link to="/products"><i className="fas fa-box"></i> Products</Link></li>
                <li>
                    <div onClick={() => setShowReports(!showReports)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '1rem' }}>
                        <span><i className="fas fa-chart-line"></i> Reports</span>
                        <i className={`fas fa-chevron-${showReports ? 'up' : 'down'}`}></i>
                    </div>
                    {showReports && (
                        <ul style={{ paddingLeft: '20px', fontSize: '0.9rem' }}>
                            <li><Link to="/reports?view=overview">Overview</Link></li>
                            <li><Link to="/reports?view=pendingCustomers">Pending Customers</Link></li>
                            <li><Link to="/reports?view=partial">Partial Payments</Link></li>
                            <li><Link to="/reports?view=overdue">Overdue Invoices</Link></li>
                            <li><Link to="/reports?view=dueDates">Sorted by Due Date</Link></li>
                        </ul>
                    )}
                </li>
                <li><Link to="/create-invoice"><i className="fas fa-file-invoice"></i> Create Invoice</Link></li>
                <li><Link to="/settings"><i className="fas fa-cog"></i> Settings</Link></li>
            </ul>
        </div>
    );
};

export default Sidebar;
