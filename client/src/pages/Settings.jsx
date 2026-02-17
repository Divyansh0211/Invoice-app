import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';

const Settings = () => {
    const authContext = useContext(AuthContext);
    const { user, updateProfile } = authContext;

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
        }
    }, [user]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();

        const updatedProfile = {
            name,
            phoneNumber,
            address,
            businessName,
            website,
            settings: {
                currency,
                themeColor,
                taxRate
            }
        };

        console.log('Settings: Submitting profile update:', updatedProfile);

        const res = await updateProfile(updatedProfile);
        console.log('Settings: Update response:', res);

        if (res.success) {
            alert('Settings Updated Successfully');
        } else {
            alert('Update Failed');
        }
    };

    return (
        <div>
            <h1 className="large text-primary">Settings</h1>
            <p className="lead"><i className="fas fa-user-cog"></i> Profile & Site Settings</p>
            <form className="form" onSubmit={onSubmit}>
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
        </div>
    );
};

export default Settings;
