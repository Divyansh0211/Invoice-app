import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';

const Settings = () => {
    const authContext = useContext(AuthContext);
    const { user, updateProfile, changePassword, generate2FA, verify2FA, disable2FA } = authContext;

    const [activeTab, setActiveTab] = useState('profile');

    // Profile & Site Settings Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        businessName: '',
        website: '',
        currency: 'USD',
        themeColor: '#6a1b9a',
        taxRate: 0
    });

    const { name, email, phoneNumber, address, businessName, website, currency, themeColor, taxRate } = formData;

    // Change Password Data
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const { currentPassword, newPassword, confirmNewPassword } = passwordData;

    // 2FA Data
    const [qrCode, setQrCode] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [otpEnabled, setOtpEnabled] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [showDisableConfirm, setShowDisableConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                businessName: user.businessName || '',
                website: user.website || '',
                currency: user.settings?.currency || 'USD',
                themeColor: user.settings?.themeColor || '#6a1b9a',
                taxRate: user.settings?.taxRate || 0
            });
            setOtpEnabled(user.isTwoFactorEnabled);
        }
    }, [user]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onPasswordChange = e => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    const onSubmitProfile = async e => {
        e.preventDefault();
        const updatedProfile = {
            name,
            phoneNumber,
            address,
            businessName,
            website,
            settings: { currency, themeColor, taxRate }
        };
        const res = await updateProfile(updatedProfile);
        if (res.success) alert('Settings Updated Successfully');
        else alert('Update Failed');
    };

    const onSubmitPassword = async e => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match');
            return;
        }
        const res = await changePassword(currentPassword, newPassword);
        if (res.success) {
            alert('Password Changed Successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } else {
            alert(res.msg);
        }
    };

    const handleEnable2FA = async () => {
        const res = await generate2FA();
        if (res.success) {
            alert(res.msg);
            setQrCode(true); // Using qrCode state to trigger UI switch, though it's just a boolean now
        } else {
            alert(res.msg);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        const res = await verify2FA(verificationCode);
        if (res.success) {
            alert('2FA Enabled Successfully');
            setQrCode(null);
            setVerificationCode('');
            setOtpEnabled(true);
        } else {
            alert(res.msg);
        }
    };

    const handleDisable2FA = async (e) => {
        e.preventDefault();
        const res = await disable2FA(disablePassword);
        if (res.success) {
            alert('2FA Disabled Successfully');
            setOtpEnabled(false);
            setShowDisableConfirm(false);
            setDisablePassword('');
        } else {
            alert(res.msg);
        }
    };

    return (
        <div>
            <h1 className="large text-primary">Settings</h1>
            <p className="lead"><i className="fas fa-cog"></i> Manage your account settings</p>

            <div className="settings-tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                <button
                    className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setActiveTab('profile')}
                    style={{ marginRight: '10px', borderRadius: '5px 5px 0 0' }}
                >
                    Profile & Site
                </button>
                <button
                    className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setActiveTab('security')}
                    style={{ borderRadius: '5px 5px 0 0' }}
                >
                    Security
                </button>
            </div>

            {activeTab === 'profile' && (
                <form className="form" onSubmit={onSubmitProfile}>
                    <div className="card bg-light">
                        <h3>Edit Profile</h3>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" name="name" value={name} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email (Cannot be changed)</label>
                            <input type="email" name="email" value={email} disabled />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="text" name="phoneNumber" value={phoneNumber} onChange={onChange} placeholder="Enter phone number" />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input type="text" name="address" value={address} onChange={onChange} placeholder="Enter address" />
                        </div>
                        <div className="form-group">
                            <label>Business Name</label>
                            <input type="text" name="businessName" value={businessName} onChange={onChange} placeholder="Enter business name" />
                        </div>
                        <div className="form-group">
                            <label>Website</label>
                            <input type="text" name="website" value={website} onChange={onChange} placeholder="Enter website URL" />
                        </div>
                    </div>
                    <div className="card bg-light my-2">
                        <h3>Site Settings</h3>
                        <div className="form-group">
                            <label>Currency</label>
                            <select name="currency" value={currency} onChange={onChange} style={{ width: '100%', padding: '0.4rem', fontSize: '1.2rem', border: '1px solid #ccc' }}>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="JPY">JPY (¥)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Theme Color</label>
                            <input type="color" name="themeColor" value={themeColor} onChange={onChange} style={{ width: '100%', height: '40px' }} />
                        </div>
                        <div className="form-group">
                            <label>Default GST/Tax Rate (%)</label>
                            <input type="number" name="taxRate" value={taxRate} onChange={onChange} min="0" step="0.1" />
                        </div>
                        <input type="submit" value="Save Settings" className="btn btn-primary" />
                    </div>
                </form>
            )}

            {activeTab === 'security' && (
                <div>
                    <div className="card bg-light">
                        <h3>Change Password</h3>
                        <form className="form" onSubmit={onSubmitPassword}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input type="password" name="currentPassword" value={currentPassword} onChange={onPasswordChange} required />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" name="newPassword" value={newPassword} onChange={onPasswordChange} required minLength="6" />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" name="confirmNewPassword" value={confirmNewPassword} onChange={onPasswordChange} required minLength="6" />
                            </div>
                            <input type="submit" value="Update Password" className="btn btn-dark" />
                        </form>
                    </div>

                    <div className="card bg-light my-2">
                        <h3>Two-Factor Authentication (2FA)</h3>
                        <p>Protect your account with an extra layer of security using a mobile authenticator app (e.g., Google Authenticator).</p>

                        {otpEnabled ? (
                            <div>
                                <div className="alert alert-success">
                                    <i className="fas fa-check-circle"></i> 2FA is currently <strong>ENABLED</strong>.
                                </div>
                                {!showDisableConfirm ? (
                                    <button className="btn btn-danger" onClick={() => setShowDisableConfirm(true)}>Disable 2FA</button>
                                ) : (
                                    <form onSubmit={handleDisable2FA} style={{ marginTop: '10px' }}>
                                        <p>Enter your password to disable 2FA:</p>
                                        <div className="form-group">
                                            <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="Current Password" required />
                                        </div>
                                        <button type="submit" className="btn btn-danger">Confirm Disable</button>
                                        <button type="button" className="btn btn-light" onClick={() => setShowDisableConfirm(false)} style={{ marginLeft: '10px' }}>Cancel</button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-triangle"></i> 2FA is currently <strong>DISABLED</strong>.
                                </div>
                                {!qrCode ? (
                                    <button className="btn btn-primary" onClick={handleEnable2FA}>Setup 2FA (Send Email OTP)</button>
                                ) : (
                                    <div style={{ marginTop: '20px' }}>
                                        <h4>1. Check your Email</h4>
                                        <p>An OTP has been sent to your registered email address.</p>
                                        <h4 style={{ marginTop: '15px' }}>2. Enter Verification Code</h4>
                                        <form onSubmit={handleVerify2FA} className="form">
                                            <div className="form-group">
                                                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Enter OTP" required />
                                            </div>
                                            <button type="submit" className="btn btn-success">Verify & Enable</button>
                                            <button type="button" className="btn btn-light" onClick={() => setQrCode(null)} style={{ marginLeft: '10px' }}>Cancel</button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
