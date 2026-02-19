import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const authContext = useContext(AuthContext);
    const { login, isAuthenticated, error, clearErrors } = authContext;
    const navigate = useNavigate();

    const [user, setUser] = useState({
        email: '',
        password: ''
    });
    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);

    const { email, password } = user;

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
        if (error === '2FA_REQUIRED') {
            setShowOtp(true);
            clearErrors();
        } else if (error) {
            alert(error);
            clearErrors();
        }
    }, [isAuthenticated, navigate, error, clearErrors]);

    const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });

    const onSubmit = e => {
        e.preventDefault();
        if (showOtp) {
            if (otp === '') {
                alert('Please enter the OTP');
            } else {
                login({ email, password, otp });
            }
        } else {
            if (email === '' || password === '') {
                alert('Please fill in all fields');
            } else {
                login({ email, password });
            }
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-image">
                {/* Background image handled by CSS */}
            </div>
            <div className="auth-form-side">
                <div className="auth-form-container">
                    <h1>Sign In</h1>
                    <p>Enter your email and password to sign in!</p>
                    <form onSubmit={onSubmit}>
                        {!showOtp ? (
                            <>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={onChange}
                                        required
                                        placeholder="mail@simmmple.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={password}
                                        onChange={onChange}
                                        required
                                        placeholder="Min. 8 characters"
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="checkbox" id="keep-logged-in" style={{ width: 'auto', marginRight: '0.5rem' }} />
                                        <label htmlFor="keep-logged-in" style={{ margin: 0, fontWeight: 'normal', color: '#a3aed0' }}>Keep me logged in</label>
                                    </div>
                                    <Link to="/forgot-password" style={{ color: '#1a73e8', fontSize: '0.9rem', fontWeight: '500' }}>Forgot Password?</Link>
                                </div>
                                <input type="submit" value="Sign In" className="btn btn-primary btn-block" style={{ width: '100%', padding: '15px' }} />
                            </>
                        ) : (
                            <>
                                <div className="alert alert-info">
                                    Two-Factor Authentication is enabled. Please enter the OTP sent to your email.
                                </div>
                                <div className="form-group">
                                    <label htmlFor="otp">Email OTP</label>
                                    <input
                                        type="text"
                                        name="otp"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        placeholder="Enter 6-digit code"
                                        autoFocus
                                    />
                                </div>
                                <input type="submit" value="Verify Request" className="btn btn-primary btn-block" style={{ width: '100%', padding: '15px' }} />
                                <button
                                    type="button"
                                    className="btn btn-light btn-block"
                                    onClick={() => setShowOtp(false)}
                                    style={{ marginTop: '10px' }}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </form>
                    <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        Not registered yet? <Link to="/signup" style={{ color: '#1a73e8', fontWeight: '500' }}>Create an Account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
