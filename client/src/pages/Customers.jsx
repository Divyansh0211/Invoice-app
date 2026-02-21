import { useState, useEffect } from 'react';
import axios from 'axios';

import AuthContext from '../context/authContext';
import { useContext } from 'react';

const Customers = () => {
    const authContext = useContext(AuthContext);
    const { user } = authContext;
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dataFetched, setDataFetched] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gst: '',
        address: ''
    });

    const { name, email, gst, address } = formData;

    const activeWorkspaceId = user?.activeWorkspace?._id || user?.activeWorkspace;
    const userRole = user?.workspaces?.find(w => w.workspace === activeWorkspaceId || w.workspace?._id === activeWorkspaceId)?.role || 'Staff';
    const isPrivileged = userRole === 'Owner' || userRole === 'Admin';

    const getCustomers = async () => {
        try {
            const res = await axios.get('/api/customers');
            setCustomers(res.data);
            setDataFetched(true);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        getCustomers();
    }, [user?.activeWorkspace]);

    const exportToCSV = () => {
        if (customers.length === 0) return;

        const headers = ['Name', 'Email', 'GSTIN', 'Address'];
        const rows = customers.map(customer => [
            `"${customer.name}"`,
            `"${customer.email}"`,
            `"${customer.gst || ''}"`,
            `"${customer.address || ''}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'customers.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/customers', formData);
            setFormData({ name: '', email: '', gst: '', address: '' });
            if (dataFetched) {
                getCustomers();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteCustomer = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await axios.delete(`/api/customers/${id}`);
                getCustomers();
            } catch (err) {
                console.error(err);
            }
        }
    }

    return (
        <div className="grid-2">
            <div>
                {isPrivileged ? (
                    <div className="card">
                        <h3>Add Customer</h3>
                        <form onSubmit={onSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" name="name" value={name} onChange={onChange} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={email} onChange={onChange} required />
                            </div>
                            <div className="form-group">
                                <label>GSTIN</label>
                                <input type="text" name="gst" value={gst} onChange={onChange} />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input type="text" name="address" value={address} onChange={onChange} />
                            </div>
                            <input type="submit" value={isSubmitting ? "Adding..." : "Add Customer"} className="btn btn-primary btn-block" disabled={isSubmitting} />
                        </form>
                    </div>
                ) : (
                    <div className="card">
                        <h3>View Customers</h3>
                        <p>Only Admins or Owners can add new customers.</p>
                    </div>
                )}
            </div>
            <div>
                <h3>Customers List</h3>
                {!dataFetched ? (
                    <button onClick={getCustomers} className="btn btn-primary" style={{ marginTop: '10px' }}>
                        Fetch Customers
                    </button>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', marginTop: '10px' }}>
                            <button onClick={getCustomers} className="btn btn-dark btn-sm">Refresh Data</button>
                            <button onClick={exportToCSV} className="btn btn-success btn-sm" style={{ backgroundColor: '#28a745', color: '#fff', border: 'none' }}>Export to Excel</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-control mb-2"
                            style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                        {customers.filter(customer =>
                            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customer.email.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(customer => (
                            <div key={customer._id} className="card my-1">
                                <h4>{customer.name}</h4>
                                <p>{customer.email}</p>
                                {customer.gst && <p>GST: {customer.gst}</p>}
                                {isPrivileged && <button onClick={() => deleteCustomer(customer._id)} className="btn btn-danger btn-sm">Delete</button>}
                            </div>
                        ))}
                        {customers.length === 0 && <p>No customers found.</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default Customers;
