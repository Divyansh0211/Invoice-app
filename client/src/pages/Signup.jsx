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
        <div className="auth-form-container">
            <h1>Account <span className="text-primary">{step === 1 ? 'Register' : 'Verify OTP'}</span></h1>
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
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                required
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
                            />
                        </div>
                    </>
                )}
                {step === 2 && (
                    <div className="form-group">
                        <label htmlFor="otp">Enter OTP sent to your email</label>
                        <input
                            type="text"
                            name="otp"
                            value={otp}
                            onChange={onChange}
                            required
                        />
                    </div>
                )}
                <input type="submit" value={step === 1 ? "Register" : "Verify"} className="btn btn-primary btn-block" />
                {step === 2 && (
                    <button type="button" onClick={handleResendOtp} className="btn btn-light btn-block my-1">
                        Resend OTP
                    </button>
                )}
            </form>
            {step === 1 && (
                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            )}
        </div>
    );
};

export default Signup;
