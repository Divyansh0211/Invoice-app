import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/authContext';

const ForgotPassword = () => {
    const authContext = useContext(AuthContext);
    const { forgotPassword, resetPassword } = authContext;
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert(null);
        if (email === '') {
            setAlert({ type: 'danger', msg: 'Please enter your email' });
            setLoading(false);
            return;
        }

        const res = await forgotPassword(email);
        setLoading(false);

        if (res.success) {
            setStep(2);
            setAlert({ type: 'success', msg: res.msg });
        } else {
            setAlert({ type: 'danger', msg: res.msg });
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert(null);

        if (otp === '' || newPassword === '') {
            setAlert({ type: 'danger', msg: 'Please fill in all fields' });
            setLoading(false);
            return;
        }

        const res = await resetPassword(email, otp, newPassword);
        setLoading(false);

        if (res.success) {
            setAlert({ type: 'success', msg: res.msg });
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setAlert({ type: 'danger', msg: res.msg });
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-image"></div>
            <div className="auth-form-side">
                <div className="auth-form-container">
                    <h1>Forgot Password</h1>
                    <p>
                        {step === 1
                            ? "Enter your email to receive a verification code."
                            : "Enter the code sent to your email and your new password."}
                    </p>

                    {alert && (
                        <div className={`alert alert-${alert.type}`} style={{
                            padding: '10px',
                            borderRadius: '5px',
                            marginBottom: '15px',
                            background: alert.type === 'danger' ? '#fee2e2' : '#dcfce7',
                            color: alert.type === 'danger' ? '#ef4444' : '#22c55e'
                        }}>
                            <i className={`fas ${alert.type === 'danger' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i> {alert.msg}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp}>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label htmlFor="otp">OTP Code</label>
                                <input
                                    type="text"
                                    name="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Processing...' : 'Reset Password'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-light btn-block"
                                onClick={() => setStep(1)}
                                style={{ marginTop: '10px' }}
                            >
                                Back
                            </button>
                        </form>
                    )}

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <p style={{ margin: 0 }}>
                            Remember your password? <Link to="/login" style={{ color: '#1a73e8', fontWeight: '500' }}>Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
