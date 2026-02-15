import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/authContext';

const Navbar = () => {
    const authContext = useContext(AuthContext);
    const { isAuthenticated, logout, user } = authContext;

    const onLogout = () => {
        logout();
    };

    const authLinks = (
        <>
            <li className="nav-item">
                Hello, {user && user.name} <span style={{ fontSize: '0.8rem', background: '#28a745', color: 'white', padding: '2px 5px', borderRadius: '5px', marginLeft: '5px' }}>Cloud Synced <i className="fas fa-check-circle"></i></span>
            </li>
            <li>
                <Link to="/">Dashboard</Link>
            </li>
            <li>
                <Link to="/customers">Customers</Link>
            </li>
            <li>
                <Link to="/products">Products</Link>
            </li>
            <li>
                <Link to="/reports">Reports</Link>
            </li>
            <li>
                <Link to="/create-invoice" className="btn btn-sm">Create Invoice</Link>
            </li>
            <li>
                <a onClick={onLogout} href="#!">
                    <i className="fas fa-sign-out-alt"></i> <span className="hide-sm">Logout</span>
                </a>
            </li>
        </>
    );

    const guestLinks = (
        <>
            <li>
                <Link to="/login">Login</Link>
            </li>
            <li>
                <Link to="/signup">Register</Link>
            </li>
        </>
    );

    return (
        <div className="navbar bg-primary">
            <div className="container flex justify-between align-center">
                <h1>
                    Invoice App
                </h1>
                <ul>{isAuthenticated ? authLinks : guestLinks}</ul>
            </div>
        </div>
    );
};

export default Navbar;
