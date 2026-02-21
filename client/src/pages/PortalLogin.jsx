import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const PortalLogin = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(token ? 'verifying' : 'idle');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (token) {
            verifyToken(token);
        }
    }, [token]);

    const verifyToken = async (authToken) => {
        try {
            const res = await axios.post(`/api/portal/verify/${authToken}`);
            // Success, we have the JWT
            localStorage.setItem('portalToken', res.data.token);
            navigate('/portal/dashboard');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMsg(err.response?.data?.msg || 'Invalid or expired token.');
        }
    };

    const requestLink = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            const res = await axios.post('/api/portal/request-link', { email });
            setStatus('success');
            setMsg(res.data.msg);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMsg(err.response?.data?.msg || 'Error requesting link. Make sure your email is correct.');
        }
    };

    if (status === 'verifying') {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <h2>Verifying your secure link...</h2>
                <p>Please wait.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '500px', margin: '100px auto', padding: '30px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--primary-color)' }}>Client Portal Access</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Enter your email address to receive a secure login link.</p>

            {msg && (
                <div style={{ padding: '10px', background: status === 'success' ? '#d4edda' : '#f8d7da', color: status === 'success' ? '#155724' : '#721c24', marginBottom: '20px', borderRadius: '4px', textAlign: 'center' }}>
                    {msg}
                </div>
            )}

            {status !== 'success' && (
                <form onSubmit={requestLink}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                            placeholder="you@example.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        style={{ width: '100%', padding: '12px', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {status === 'submitting' ? 'Sending...' : 'Send Magic Link'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default PortalLogin;
