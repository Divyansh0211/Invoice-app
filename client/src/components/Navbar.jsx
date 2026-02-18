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
        <li className="nav-item flex align-center">
            <div className="dropdown">
                <button className="dropbtn">
                    <i className="fas fa-user-circle"></i> {user && user.name} <i className="fas fa-caret-down"></i>
                </button>
                <div className="dropdown-content">
                    <Link to="/settings" className="text-dark">Settings</Link>
                    <a onClick={onLogout} href="#!" className="text-danger">
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </div>
            <span style={{ fontSize: '0.8rem', background: '#28a745', color: 'white', padding: '2px 5px', borderRadius: '5px', marginLeft: '5px' }}>
                Cloud Synced <i className="fas fa-check-circle"></i>
            </span>
        </li>
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
            <h1>
                Invoice App
            </h1>
            <ul>{isAuthenticated ? authLinks : guestLinks}</ul>
        </div>
    );
};

export default Navbar;
