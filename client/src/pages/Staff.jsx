import React from 'react';
import axios from 'axios';

const Staff = () => {
    const [staffList, setStaffList] = React.useState([]);
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        role: 'Employee'
    });
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    const { name, email, role } = formData;

    const fetchStaff = async () => {
        try {
            const res = await axios.get('/api/staff');
            setStaffList(res.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch staff');
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchStaff();
    }, []);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const body = JSON.stringify(formData);
            const res = await axios.post('/api/staff', body, config);
            setStaffList([res.data, ...staffList]);
            setFormData({ name: '', email: '', role: 'Employee' });
        } catch (err) {
            setError(err.response && err.response.data.msg ? err.response.data.msg : 'Failed to add staff');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await axios.delete(`/api/staff/${id}`);
            setStaffList(staffList.filter(staff => staff._id !== id));
        } catch (err) {
            setError('Failed to delete staff');
        }
    };

    return (
        <div className="container" style={{ padding: '20px' }}>
            <h1 className="large text-primary">Staff Management</h1>
            <p className="lead"><i className="fas fa-user-tie"></i> Manage your team members</p>

            <div className="card mb-2">
                <h3>Add New Staff</h3>
                <form className="form" onSubmit={onSubmit}>
                    <div className="form-group">
                        <input type="text" placeholder="Name" name="name" value={name} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                        <input type="email" placeholder="Email Address" name="email" value={email} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                        <input type="text" placeholder="Role (e.g. Manager, Developer)" name="role" value={role} onChange={onChange} />
                    </div>
                    <input type="submit" className="btn btn-primary" value="Add Staff" />
                </form>
            </div>

            <div className="card">
                <h3>Current Staff</h3>
                {loading ? <p>Loading...</p> : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.map(staff => (
                                <tr key={staff._id}>
                                    <td>{staff.name}</td>
                                    <td>{staff.email}</td>
                                    <td>{staff.role}</td>
                                    <td>
                                        <button className="btn btn-danger" onClick={() => handleDelete(staff._id)} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {staffList.length === 0 && <tr><td colSpan="4">No staff members found.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Staff;
