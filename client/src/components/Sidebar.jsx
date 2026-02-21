import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/authContext';

const Sidebar = () => {
    const authContext = useContext(AuthContext);
    const { isAuthenticated, logout } = authContext;
    const location = useLocation();

    if (!isAuthenticated) return null;

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    }

    return (
        <div className="sidebar">
            <h3 className="mb-2" style={{ paddingLeft: '20px', fontSize: '0.8rem', color: '#a3aed0', textTransform: 'uppercase' }}>General</h3>
            <ul>
                <li>
                    <Link to="/" className={isActive('/')}>
                        <i className="fas fa-home"></i> Dashboard
                    </Link>
                </li>
                <li>
                    <Link to="/invoices"> {/* Placeholder link if no specific invoices page yet, or reuse existing */}
                        <i className="fas fa-file-invoice"></i> Invoices
                    </Link>
                </li>
                <li>
                    <Link to="/estimates" className={isActive('/estimates')}>
                        <i className="fas fa-file-signature"></i> Estimates
                    </Link>
                </li>
                <li>
                    <Link to="/customers" className={isActive('/customers')}>
                        <i className="fas fa-users"></i> Clients
                    </Link>
                </li>
                <li>
                    <Link to="/staff" className={isActive('/staff')}>
                        <i className="fas fa-user-tie"></i> Staff
                    </Link>
                </li>
                <li>
                    <Link to="/communication" className={isActive('/communication')}>
                        <i className="fas fa-comment-dots"></i> Communication
                    </Link>
                </li>
                <li>
                    <Link to="/products" className={isActive('/products')}>
                        <i className="fas fa-box"></i> Products
                    </Link>
                </li>
                <li>
                    <Link to="/expenses" className={isActive('/expenses')}>
                        <i className="fas fa-money-bill-wave"></i> Expenses
                    </Link>
                </li>
                <li>
                    <Link to="/reports" className={isActive('/reports')}>
                        <i className="fas fa-chart-line"></i> Reports
                    </Link>
                </li>
                <li>
                    <Link to="/billing" className={isActive('/billing')}>
                        <i className="fas fa-credit-card"></i> Billing
                    </Link>
                </li>
                <li>
                    <Link to="/settings" className={isActive('/settings')}>
                        <i className="fas fa-cog"></i> Settings
                    </Link>
                </li>
            </ul>

        </div >
    );
};

export default Sidebar;
