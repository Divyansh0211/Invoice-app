import { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
        case 'REGISTER_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                token: action.payload.token,
                isAuthenticated: true,
                loading: false
            };
        case 'AUTH_ERROR':
        case 'LOGIN_FAIL':
        case 'REGISTER_FAIL':
        case 'LOGOUT':
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null,
                error: action.payload
            };
        case 'CLEAR_ERRORS':
            return {
                ...state,
                error: null
            };
        case 'USER_LOADED':
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const initialState = {
        token: localStorage.getItem('token'),
        isAuthenticated: null,
        loading: true,
        user: null,
        error: null
    };

    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load User
    const loadUser = async () => {
        if (localStorage.token) {
            setAuthToken(localStorage.token);
        }

        try {
            const res = await axios.get('/api/auth/user');
            console.log('User loaded:', res.data); // Debug log

            dispatch({
                type: 'USER_LOADED',
                payload: res.data
            });
        } catch (err) {
            console.error('Load user error:', err.response?.data || err.message); // Debug log
            dispatch({ type: 'AUTH_ERROR' });
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    // Register User
    const register = async formData => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/signup', formData, config);
            return { success: true, msg: res.data.msg };
        } catch (err) {
            dispatch({
                type: 'REGISTER_FAIL',
                payload: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Registration failed'
            });
            return { success: false };
        }
    };

    // Verify OTP
    const verifyOtp = async formData => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/verify-otp', formData, config);

            localStorage.setItem('token', res.data.token);
            setAuthToken(res.data.token);

            dispatch({
                type: 'REGISTER_SUCCESS',
                payload: res.data
            });

            loadUser();
            return { success: true };
        } catch (err) {
            dispatch({
                type: 'REGISTER_FAIL',
                payload: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Verification failed'
            });
            return { success: false };
        }
    };

    // Resend OTP
    const resendOtp = async email => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/resend-otp', { email }, config);
            return { success: true, msg: res.data.msg };
        } catch (err) {
            return {
                success: false,
                msg: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Resend failed'
            };
        }
    };

    // Login User
    const login = async formData => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/login', formData, config);

            localStorage.setItem('token', res.data.token);
            setAuthToken(res.data.token);

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: res.data
            });

            loadUser();
        } catch (err) {
            dispatch({
                type: 'LOGIN_FAIL',
                payload: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Login failed'
            });
            throw err;
        }
    };

    // Update Profile
    const updateProfile = async formData => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.put('/api/auth/profile', formData, config);

            dispatch({
                type: 'USER_LOADED',
                payload: res.data
            });

            return { success: true };
        } catch (err) {
            dispatch({
                type: 'AUTH_ERROR',
                payload: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Update failed'
            });
            return { success: false };
        }
    };

    // Forgot Password
    const forgotPassword = async email => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/forgot-password', { email }, config);
            return { success: true, msg: res.data.msg };
        } catch (err) {
            return {
                success: false,
                msg: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Request failed'
            };
        }
    };

    // Reset Password
    const resetPassword = async (email, otp, newPassword) => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/reset-password', { email, otp, newPassword }, config);
            return { success: true, msg: res.data.msg };
        } catch (err) {
            return {
                success: false,
                msg: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Reset failed'
            };
        }
    };

    // Change Password
    const changePassword = async (currentPassword, newPassword) => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/change-password', { currentPassword, newPassword }, config);
            return { success: true, msg: res.data.msg };
        } catch (err) {
            return {
                success: false,
                msg: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Password change failed'
            };
        }
    };

    // Generate 2FA
    const generate2FA = async () => {
        try {
            const res = await axios.post('/api/auth/2fa/generate');
            return { success: true, msg: res.data.msg };
        } catch (err) {
            return {
                success: false,
                msg: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Generation failed'
            };
        }
    };

    // Verify 2FA
    const verify2FA = async (token) => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/2fa/verify', { token }, config);

            // Reload user to update isTwoFactorEnabled status
            loadUser();

            return { success: true, msg: res.data.msg };
        } catch (err) {
            return {
                success: false,
                msg: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Verification failed'
            };
        }
    };

    // Disable 2FA
    const disable2FA = async (password) => {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/auth/2fa/disable', { password }, config);

            // Reload user to update isTwoFactorEnabled status
            loadUser();

            return { success: true, msg: res.data.msg };
        } catch (err) {
            return {
                success: false,
                msg: err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Disable failed'
            };
        }
    };

    // Logout
    const logout = () => dispatch({ type: 'LOGOUT' });

    // Clear Errors
    const clearErrors = () => dispatch({ type: 'CLEAR_ERRORS' });

    return (
        <AuthContext.Provider
            value={{
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                loading: state.loading,
                user: state.user,
                error: state.error,
                register,
                login,
                logout,
                clearErrors,
                loadUser,
                verifyOtp,
                resendOtp,
                updateProfile,
                forgotPassword,
                resetPassword,
                changePassword,
                generate2FA,
                verify2FA,
                disable2FA
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

const setAuthToken = token => {
    if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete axios.defaults.headers.common['x-auth-token'];
    }
};
