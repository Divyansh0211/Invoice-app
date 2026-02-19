import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const authContext = useContext(AuthContext);
    const { register, verifyOtp, resendOtp, isAuthenticated, error, clearErrors } = authContext;
    const navigate = useNavigate();

    const [user, setUser] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });

    const [step, setStep] = useState(1);

    const { name, email, password, confirmPassword, otp } = user;

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
        if (error) {
            alert(error);
            clearErrors();
        }
    }, [isAuthenticated, navigate, error, clearErrors]);

    const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });

    const handleResendOtp = async () => {
        const res = await resendOtp(email);
        alert(res.msg);
    };

    const onSubmit = async e => {
        e.preventDefault();
        if (step === 1) {
            if (name === '' || email === '' || password === '') {
                alert('Please enter all fields');
            } else if (password !== confirmPassword) {
                alert('Passwords do not match');
            } else {
                const res = await register({
                    name,
                    email,
                    password
                });
                if (res.success) {
                    setStep(2);
                    alert(res.msg);
                }
            }
        } else {
            if (otp === '') {
                alert('Please enter OTP');
            } else {
                const res = await verifyOtp({
                    email,
                    otp
                });
                if (!res.success) {
                    alert('Verification failed');
                }
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
                    <h1>{step === 1 ? 'Sign Up' : 'Verify Account'}</h1>
                    <p>{step === 1 ? 'Enter your details to create your account!' : 'Enter the OTP sent to your email.'}</p>
                    <form onSubmit={onSubmit}>
                        {step === 1 && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={name}
                                        onChange={onChange}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>
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
                                        minLength="6"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        onChange={onChange}
                                        required
                                        minLength="6"
                                        placeholder="Confirm Password"
                                    />
                                </div>
                            </>
                        )}
                        {step === 2 && (
                            <div className="form-group">
                                <label htmlFor="otp">Enter OTP</label>
                                <input
                                    type="text"
                                    name="otp"
                                    value={otp}
                                    onChange={onChange}
                                    required
                                    placeholder="Check your email for OTP"
                                />
                            </div>
                        )}
                        <input type="submit" value={step === 1 ? "Sign Up" : "Verify"} className="btn btn-primary btn-block" style={{ width: '100%', padding: '15px' }} />
                        {step === 2 && (
                            <button type="button" onClick={handleResendOtp} className="btn btn-light btn-block my-1" style={{ width: '100%' }}>
                                Resend OTP
                            </button>
                        )}
                    </form>
                    {step === 1 && (
                        <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            Already have an account? <Link to="/login" style={{ color: '#1a73e8', fontWeight: '500' }}>Sign In</Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Signup;
