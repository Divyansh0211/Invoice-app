import { useState, useEffect } from 'react';
import axios from 'axios';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gst: '',
        address: ''
    });

    const { name, email, gst, address } = formData;

    useEffect(() => {
        getCustomers();
    }, []);

    const getCustomers = async () => {
        try {
            const res = await axios.get('/api/customers');
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/customers', formData);
            setFormData({ name: '', email: '', gst: '', address: '' });
            getCustomers();
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
            </div>
            <div>
                <h3>Customers List</h3>
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
                        <button onClick={() => deleteCustomer(customer._id)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                ))}
                {customers.length === 0 && <p>No customers found.</p>}
            </div>
        </div>
    );
};

export default Customers;
