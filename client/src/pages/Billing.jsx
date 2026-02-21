import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';

const Billing = () => {
    const authContext = useContext(AuthContext);
    const { user } = authContext;
    const [loading, setLoading] = useState(false);

    // Extract the active workspace
    const workspace = user?.activeWorkspace;

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const res = await axios.post('/api/subscriptions/create-checkout-session', {}, config);

            // Redirect to Stripe checkout
            window.location.href = res.data.url;
        } catch (err) {
            console.error('Subscription error:', err);
            alert(err.response?.data?.msg || 'Failed to initialize checkout');
        } finally {
            setLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setLoading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const res = await axios.post('/api/subscriptions/customer-portal', {}, config);

            // Redirect to Stripe Customer Portal
            window.location.href = res.data.url;
        } catch (err) {
            console.error('Portal error:', err);
            alert(err.response?.data?.msg || 'Failed to open billing portal');
        } finally {
            setLoading(false);
        }
    };

    // Check if the current user has permission to manage billing for this workspace
    const hasBillingAccess = () => {
        if (!user || !user.workspaces || !workspace) return false;

        const userWorkspace = user.workspaces.find(w =>
            (w.workspace._id === workspace._id) || (w.workspace === workspace._id)
        );

        return userWorkspace && (userWorkspace.role === 'Owner' || userWorkspace.role === 'Admin');
    };

    if (!workspace) {
        return (
            <div className="container" style={{ padding: '20px' }}>
                <h1 className="large text-primary">Billing & Plans</h1>
                <p>Please select a workspace to view billing details.</p>
            </div>
        );
    }

    const isPro = workspace.plan === 'Pro';
    const canManageBilling = hasBillingAccess();

    return (
        <div className="container" style={{ padding: '20px' }}>
            <h1 className="large text-primary">Billing & Plans</h1>
            <p className="lead">
                <i className="fas fa-credit-card"></i> Manage your subscription for <strong>{workspace.name}</strong>
            </p>

            <div className="card bg-light mb-2">
                <h3>Current Status</h3>
                <div style={{ padding: '15px 0' }}>
                    <p>Current Plan: <strong style={{ color: isPro ? 'var(--primary-color)' : '#666' }}>{workspace.plan}</strong></p>
                    <p>Status: <span className={`badge ${workspace.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'capitalize' }}>{workspace.status}</span></p>
                </div>

                {!canManageBilling && (
                    <div className="alert alert-warning" style={{ marginTop: '10px' }}>
                        <i className="fas fa-info-circle"></i> Only Workspace Owners and Admins can manage billing.
                    </div>
                )}
            </div>

            <div className="grid-2 my-2">
                {/* Free Tier Card */}
                <div className="card" style={{ border: !isPro ? '2px solid var(--primary-color)' : '1px solid #ddd' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>Free Plan</h2>
                    <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>$0 / month</h3>
                    <ul className="list" style={{ marginBottom: '20px' }}>
                        <li><i className="fas fa-check text-success"></i> Up to 5 Invoices per month</li>
                        <li><i className="fas fa-check text-success"></i> Basic Reporting</li>
                        <li><i className="fas fa-check text-success"></i> 1 Team Member</li>
                        <li><i className="fas fa-times text-danger"></i> Remove Watermark</li>
                        <li><i className="fas fa-times text-danger"></i> Custom Domain</li>
                    </ul>
                    {!isPro && canManageBilling ? (
                        <button className="btn btn-light btn-block" disabled>Current Plan</button>
                    ) : (
                        <button className="btn btn-light btn-block" disabled>Downgrade (Contact Support)</button>
                    )}
                </div>

                {/* Pro Tier Card */}
                <div className="card" style={{ border: isPro ? '2px solid var(--primary-color)' : '1px solid #ddd', position: 'relative' }}>
                    {isPro && <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-color)', color: 'white', padding: '5px 10px', fontSize: '0.8rem', borderBottomLeftRadius: '5px' }}>ACTIVE</div>}

                    <h2 style={{ textAlign: 'center', marginBottom: '15px', color: 'var(--primary-color)' }}>Pro Plan</h2>
                    <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>$29 / month</h3>
                    <ul className="list" style={{ marginBottom: '20px' }}>
                        <li><i className="fas fa-check text-success"></i> <strong>Unlimited</strong> Invoices</li>
                        <li><i className="fas fa-check text-success"></i> Advanced React Reports</li>
                        <li><i className="fas fa-check text-success"></i> Unlimited Team Members</li>
                        <li><i className="fas fa-check text-success"></i> Remove Watermark</li>
                        <li><i className="fas fa-check text-success"></i> Priority Support</li>
                    </ul>

                    {isPro ? (
                        canManageBilling && (
                            <button
                                className="btn btn-primary btn-block"
                                onClick={handleManageBilling}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Manage Subscription'}
                            </button>
                        )
                    ) : (
                        canManageBilling && (
                            <button
                                className="btn btn-primary btn-block"
                                onClick={handleSubscribe}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Upgrade to Pro'}
                            </button>
                        )
                    )}
                </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                Payments are processed securely via <strong>Stripe</strong>.
            </div>
        </div>
    );
};

export default Billing;
