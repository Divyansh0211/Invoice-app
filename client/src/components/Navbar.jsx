import React, { useContext, useState } from 'react';

import CalculatorModal from './CalculatorModal';
import { Link } from 'react-router-dom';
import AuthContext from '../context/authContext';

const Navbar = () => {
    const [showCalculator, setShowCalculator] = useState(false);
    const authContext = useContext(AuthContext);
    const { isAuthenticated, logout, user } = authContext;

    const onLogout = () => {
        logout();
    };

    const authLinks = (
        <li className="nav-item flex align-center" style={{ gap: '15px' }}>
            <div className="workspace-badge" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500', border: '1px solid #e0e5f2' }}>
                <i className="fas fa-building" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                {authContext.activeWorkspace ? authContext.activeWorkspace.name : 'Personal Workspace'}
            </div>
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', fontWeight: '500', color: 'var(--text-main)' }}>
                <i className="fas fa-user-circle" style={{ marginRight: '8px', fontSize: '1.5rem', color: 'var(--text-secondary)' }}></i>
                {user && user.name}
            </div>
            <span style={{ fontSize: '0.8rem', background: 'rgba(5, 205, 153, 0.1)', color: 'var(--success-color)', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                Cloud Synced <i className="fas fa-check-circle" style={{ marginLeft: '6px' }}></i>
            </span>
        </li>
    );

    const guestLinks = (
        <li className="flex align-center" style={{ gap: '15px' }}>
            <Link to="/login" className="btn btn-light" style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '500' }}>Login</Link>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '500' }}>Register</Link>
        </li>
    );

    return (
        <div className="navbar">
            <h1 className="text-primary" style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-file-invoice-dollar"></i> BillSphere
            </h1>
            <div className="flex align-center" style={{ gap: '20px' }}>
                <ul className="flex align-center" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {isAuthenticated ? authLinks : guestLinks}
                </ul>
                <div style={{ width: '1px', height: '30px', background: '#e0e5f2', margin: '0 5px' }}></div>
                {/* Calculator Icon */}
                <button
                    className="icon-btn"
                    onClick={() => setShowCalculator(true)}
                    style={{
                        background: 'var(--primary-color)',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '42px',
                        height: '42px',
                        boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(26, 115, 232, 0.4)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 115, 232, 0.3)'; }}
                    title="Calculator"
                >
                    <i className="fas fa-calculator"></i>
                </button>
            </div>
            {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}
        </div>
    );
};


export default Navbar;
