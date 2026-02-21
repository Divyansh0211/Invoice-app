import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';

const Settings = () => {
    const authContext = useContext(AuthContext);
    const { user, updateProfile, changePassword, generate2FA, verify2FA, disable2FA, switchWorkspace } = authContext;

    const [activeTab, setActiveTab] = useState('profile');
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    // Profile & Site Settings Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        businessName: '',
        website: '',
        logoUrl: '',
        panNumber: '',
        bankAccountNo: '',
        bankIfsc: '',
        bankUpiId: '',
        currency: 'USD',
        themeColor: '#6a1b9a',
        taxRate: 0,
        themeMode: 'light',
        enableTax: true,
        taxType: 'GST',
        decimalPrecision: 2,
        invoicePrefix: 'INV-',
        autoIncrement: true,
        defaultDueDays: 7,
        termsAndConditions: 'Payment is due within {defaultDueDays} days. Please make checks payable to our company.',
        signatureUrl: ''
    });

    const {
        name, email, phoneNumber, address, businessName, website,
        logoUrl, panNumber, bankAccountNo, bankIfsc, bankUpiId,
        currency, themeColor, taxRate, themeMode,
        enableTax, taxType, decimalPrecision, invoicePrefix, autoIncrement, defaultDueDays, termsAndConditions, signatureUrl
    } = formData;

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
                logoUrl: user.logoUrl || '',
                panNumber: user.panNumber || '',
                bankAccountNo: user.bankDetails?.accountNo || '',
                bankIfsc: user.bankDetails?.ifsc || '',
                bankUpiId: user.bankDetails?.upiId || '',
                currency: user.settings?.currency || 'USD',
                themeColor: user.settings?.themeColor || '#6a1b9a',
                taxRate: user.settings?.taxRate || 0,
                themeMode: user.settings?.themeMode || 'light',
                enableTax: user.settings?.enableTax !== false,
                taxType: user.settings?.taxType || 'GST',
                decimalPrecision: user.settings?.decimalPrecision || 2,
                invoicePrefix: user.settings?.invoicePrefix || 'INV-',
                autoIncrement: user.settings?.autoIncrement !== false,
                defaultDueDays: user.settings?.defaultDueDays || 7,
                termsAndConditions: user.settings?.termsAndConditions || 'Payment is due within {defaultDueDays} days. Please make checks payable to our company.',
                signatureUrl: user.settings?.signatureUrl || ''
            });
            setOtpEnabled(user.isTwoFactorEnabled);
        }
    }, [user]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onPasswordChange = e => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    const onSubmitProfile = async e => {
        e.preventDefault();
        setIsSubmittingProfile(true);
        const updatedProfile = {
            name,
            phoneNumber,
            address,
            businessName,
            website,
            logoUrl,
            panNumber,
            bankDetails: {
                accountNo: bankAccountNo,
                ifsc: bankIfsc,
                upiId: bankUpiId
            },
            settings: {
                currency,
                themeColor,
                taxRate,
                themeMode,
                enableTax,
                taxType,
                decimalPrecision,
                invoicePrefix,
                autoIncrement,
                defaultDueDays,
                termsAndConditions,
                signatureUrl
            }
        };
        try {
            const res = await updateProfile(updatedProfile);
            if (res.success) alert('Settings Updated Successfully');
            else alert('Update Failed');
        } finally {
            setIsSubmittingProfile(false);
        }
    };

    const onSubmitPassword = async e => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match');
            return;
        }
        setIsSubmittingPassword(true);
        try {
            const res = await changePassword(currentPassword, newPassword);
            if (res.success) {
                alert('Password Changed Successfully');
                setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            } else {
                alert(res.msg);
            }
        } finally {
            setIsSubmittingPassword(false);
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
                    Business Profile
                </button>
                <button
                    className={`btn ${activeTab === 'invoice' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setActiveTab('invoice')}
                    style={{ marginRight: '10px', borderRadius: '5px 5px 0 0' }}
                >
                    Invoice & Tax
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
                    <div className="card bg-light my-2">
                        <h3>Workspace Switching</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                            You can belong to multiple workspaces (e.g., your own personal workspace plus teams you've joined).
                        </p>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Current Active Workspace</label>
                                <select
                                    className="form-control"
                                    value={user?.activeWorkspace?._id || user?.activeWorkspace || ''}
                                    onChange={(e) => {
                                        if (e.target.value !== user?.activeWorkspace?._id) {
                                            switchWorkspace(e.target.value);
                                        }
                                    }}
                                >
                                    {user?.workspaces?.map((w, idx) => (
                                        <option key={w.workspace._id || w.workspace || idx} value={w.workspace._id || w.workspace}>
                                            Workspace {w.workspace._id || w.workspace} (Role: {w.role})
                                        </option>
                                    ))}
                                </select>
                                <small style={{ display: 'block', marginTop: '5px', color: 'var(--primary-color)' }}>
                                    <strong>Note:</strong> Currently displaying workspace ID until we populate names.
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-light">
                        <h3>Company Information</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Business Name</label>
                                <input type="text" name="businessName" value={businessName} onChange={onChange} placeholder="Enter business name" />
                            </div>
                            <div className="form-group">
                                <label>Your Name</label>
                                <input type="text" name="name" value={name} onChange={onChange} required />
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Email (Cannot be changed)</label>
                                <input type="email" name="email" value={email} disabled />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="text" name="phoneNumber" value={phoneNumber} onChange={onChange} placeholder="Enter phone number" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input type="text" name="address" value={address} onChange={onChange} placeholder="Enter address" />
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Website</label>
                                <input type="text" name="website" value={website} onChange={onChange} placeholder="Enter website URL" />
                            </div>
                            <div className="form-group">
                                <label>Logo URL</label>
                                <input type="text" name="logoUrl" value={logoUrl} onChange={onChange} placeholder="https://example.com/logo.png" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-light my-2">
                        <h3>Tax & Registration Details</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>PAN Number (India)</label>
                                <input type="text" name="panNumber" value={panNumber} onChange={onChange} placeholder="ABCDE1234F" />
                            </div>
                            <div className="form-group">
                                <label>GST / Tax ID</label>
                                <span className="text-secondary" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>The GSTIN is saved on the Invoice form currently. This will be migrated soon.</span>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-light my-2">
                        <h3>Bank Details <small className="text-secondary">(Auto-fills on invoices)</small></h3>
                        <div className="grid-3">
                            <div className="form-group">
                                <label>Account Number</label>
                                <input type="text" name="bankAccountNo" value={bankAccountNo} onChange={onChange} placeholder="Account No" />
                            </div>
                            <div className="form-group">
                                <label>IFSC Code</label>
                                <input type="text" name="bankIfsc" value={bankIfsc} onChange={onChange} placeholder="Bank IFSC" />
                            </div>
                            <div className="form-group">
                                <label>UPI ID</label>
                                <input type="text" name="bankUpiId" value={bankUpiId} onChange={onChange} placeholder="yourname@bank" />
                            </div>
                        </div>
                        <br />
                        <input type="submit" value={isSubmittingProfile ? "Saving..." : "Save Business Profile"} className="btn btn-primary" disabled={isSubmittingProfile} />
                    </div>
                </form>
            )}

            {activeTab === 'invoice' && (
                <form className="form" onSubmit={onSubmitProfile}>
                    <div className="card bg-light">
                        <h3>Tax & Currency Settings</h3>
                        <div className="grid-3">
                            <div className="form-group">
                                <label>Currency</label>
                                <select name="currency" value={currency} onChange={onChange} style={{ width: '100%', padding: '0.4rem', fontSize: '1.2rem', base: '1px solid #ccc' }}>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="JPY">JPY (¥)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tax Type</label>
                                <select name="taxType" value={taxType} onChange={onChange} style={{ width: '100%', padding: '0.4rem', fontSize: '1.2rem', base: '1px solid #ccc' }}>
                                    <option value="GST">GST</option>
                                    <option value="VAT">VAT</option>
                                    <option value="IGST">IGST</option>
                                    <option value="CGST/SGST">CGST / SGST</option>
                                    <option value="Tax">General Tax</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Default Tax Rate (%)</label>
                                <input type="number" name="taxRate" value={taxRate} onChange={onChange} min="0" step="0.1" />
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>
                                    <input type="checkbox" name="enableTax" checked={enableTax} onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })} /> Enable Tax on Invoices
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Decimal Precision</label>
                                <select name="decimalPrecision" value={decimalPrecision} onChange={onChange} style={{ width: '100%', padding: '0.4rem', fontSize: '1.2rem', base: '1px solid #ccc' }}>
                                    <option value={0}>0 (No decimals)</option>
                                    <option value={2}>2 (e.g., 10.50)</option>
                                    <option value={3}>3 (e.g., 10.500)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-light my-2">
                        <h3>Invoice Preferences</h3>
                        <div className="grid-3">
                            <div className="form-group">
                                <label>Invoice Prefix</label>
                                <input type="text" name="invoicePrefix" value={invoicePrefix} onChange={onChange} placeholder="INV-" />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                <label>
                                    <input type="checkbox" name="autoIncrement" checked={autoIncrement} onChange={(e) => setFormData({ ...formData, autoIncrement: e.target.checked })} /> Auto Increment
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Default Due Days</label>
                                <select name="defaultDueDays" value={defaultDueDays} onChange={onChange} style={{ width: '100%', padding: '0.4rem', fontSize: '1.2rem', base: '1px solid #ccc' }}>
                                    <option value={0}>Due on Receipt</option>
                                    <option value={7}>7 Days</option>
                                    <option value={15}>15 Days</option>
                                    <option value={30}>30 Days</option>
                                    <option value={45}>45 Days</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Default Terms & Conditions</label>
                            <textarea name="termsAndConditions" value={termsAndConditions} onChange={onChange} rows="3"></textarea>
                            <small className="text-secondary">Use {"{defaultDueDays}"} to inject the due days automatically.</small>
                        </div>
                        <div className="form-group">
                            <label>Signature URL</label>
                            <input type="text" name="signatureUrl" value={signatureUrl} onChange={onChange} placeholder="https://example.com/signature.png" />
                        </div>
                    </div>

                    <div className="card bg-light my-2">
                        <h3>Appearance Settings</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Theme Color</label>
                                <input type="color" name="themeColor" value={themeColor} onChange={onChange} style={{ width: '100%', height: '40px' }} />
                            </div>
                            <div className="form-group">
                                <label>App Theme Mode</label>
                                <select name="themeMode" value={themeMode} onChange={onChange} style={{ width: '100%', padding: '0.4rem', fontSize: '1.2rem', base: '1px solid #ccc' }}>
                                    <option value="light">Light Mode</option>
                                    <option value="dark">Dark Mode</option>
                                </select>
                            </div>
                        </div>
                        <br />
                        <input type="submit" value={isSubmittingProfile ? "Saving..." : "Save Preferences"} className="btn btn-primary" disabled={isSubmittingProfile} />
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
                            <input type="submit" value={isSubmittingPassword ? "Updating..." : "Update Password"} className="btn btn-dark" disabled={isSubmittingPassword} />
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
