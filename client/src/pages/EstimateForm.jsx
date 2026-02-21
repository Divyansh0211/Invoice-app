import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EstimateForm = () => {
    const authContext = useContext(AuthContext);
    const { user } = authContext;
    const navigate = useNavigate();
    const { id } = useParams();

    const [estimate, setEstimate] = useState({
        customer: '',
        status: 'Draft',
        currency: user?.settings?.currency || 'USD',
        date: '',
        expiryDate: '',
        estimateNumber: '',
        notes: '',
        items: [{ description: '', quantity: 1, price: 0 }]
    });

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { customer, status, currency, date, expiryDate, estimateNumber, notes, items } = estimate;

    useEffect(() => {
        if (id) {
            getEstimate(id);
        } else {
            let defaultDays = user?.settings?.defaultDueDays || 7;
            let dDate = new Date();
            let expDate = new Date();
            expDate.setDate(expDate.getDate() + defaultDays);

            setEstimate(prev => ({
                ...prev,
                currency: user?.settings?.currency || 'USD',
                date: dDate.toISOString().split('T')[0],
                expiryDate: expDate.toISOString().split('T')[0]
            }));
        }
        getCustomers();
        getProducts();
    }, [id, user]);

    const getEstimate = async (estimateId) => {
        try {
            const res = await axios.get(`/api/estimates/${estimateId}`);
            const foundObj = res.data;
            if (foundObj) {
                if (foundObj.date) foundObj.date = foundObj.date.split('T')[0];
                if (foundObj.expiryDate) foundObj.expiryDate = foundObj.expiryDate.split('T')[0];
                if (foundObj.customer && foundObj.customer._id) foundObj.customer = foundObj.customer._id;
                setEstimate(foundObj);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const getCustomers = async () => {
        try {
            const res = await axios.get('/api/customers');
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const getProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const onChange = e => setEstimate({ ...estimate, [e.target.name]: e.target.value });

    const onProductSelect = (e) => {
        const productId = e.target.value;
        if (productId === "") return;

        const product = products.find(p => p._id === productId);
        if (product) {
            setEstimate({
                ...estimate,
                items: [...items, { product: product._id, description: product.name, quantity: 1, price: product.price }]
            });
        }
    };

    const onItemChange = (e, index) => {
        const newItems = items.map((item, i) => {
            if (index === i) {
                return { ...item, [e.target.name]: e.target.value };
            }
            return item;
        });
        setEstimate({ ...estimate, items: newItems });
    };

    const addItem = () => {
        setEstimate({ ...estimate, items: [...items, { description: '', quantity: 1, price: 0 }] });
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setEstimate({ ...estimate, items: newItems });
    };

    const calculateSubTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    };

    const calculateTotal = () => {
        // Estimates might not use discount right now, sticking to subtotal = total for simplicity
        const subTotal = calculateSubTotal();
        const taxRate = user?.settings?.enableTax === false ? 0 : (user?.settings?.taxRate || 0);
        const taxAmount = (subTotal * taxRate) / 100;
        return subTotal + taxAmount;
    };

    const calculateTax = () => {
        const subTotal = calculateSubTotal();
        const taxRate = user?.settings?.enableTax === false ? 0 : (user?.settings?.taxRate || 0);
        return (subTotal * taxRate) / 100;
    }

    const onSubmit = async e => {
        e.preventDefault();

        if (!customer) {
            alert("Please select a customer.");
            return;
        }

        setIsSubmitting(true);
        const subTotal = calculateSubTotal();
        const taxAmount = calculateTax();
        const totalAmount = calculateTotal();

        let estNum = estimateNumber;
        if (!estNum && !id) {
            estNum = 'EST-' + Date.now();
        }

        const formData = { ...estimate, estimateNumber: estNum, subTotal, taxAmount, totalAmount };

        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            if (id) {
                await axios.put(`/api/estimates/${id}`, formData, config);
            } else {
                await axios.post('/api/estimates', formData, config);
            }
            navigate('/estimates');
        } catch (err) {
            console.error(err);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card">
            <h1>{id ? 'Edit' : 'Create'} <span className="text-primary">Estimate</span></h1>

            <div className="grid-2 my-1">
                <div className="form-group">
                    <label>Select Customer</label>
                    <select name="customer" value={customer} onChange={onChange} required>
                        <option value="">-- Select Customer --</option>
                        {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Add Saved Product</label>
                    <select onChange={onProductSelect}>
                        <option value="">-- Add Product --</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>)}
                    </select>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid-3">
                    <div className="form-group">
                        <label>Estimate Number (Optional)</label>
                        <input type="text" name="estimateNumber" value={estimateNumber} onChange={onChange} placeholder="Auto-generated if blank" />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={status} onChange={onChange}>
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label>Issue Date</label>
                        <input type="date" name="date" value={date} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                        <label>Valid Until</label>
                        <input type="date" name="expiryDate" value={expiryDate} onChange={onChange} required />
                    </div>
                </div>

                <div className="form-group">
                    <label>Notes</label>
                    <textarea name="notes" value={notes} onChange={onChange} placeholder="Any notes for the customer..." rows="2"></textarea>
                </div>

                <h3>Items</h3>
                {
                    items.map((item, index) => (
                        <div key={index} className="item-row my-1" style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                name="description"
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => onItemChange(e, index)}
                                required
                                style={{ flex: 3 }}
                            />
                            <input
                                type="number"
                                name="quantity"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => onItemChange(e, index)}
                                required
                                min="1"
                                style={{ flex: 1 }}
                            />
                            <input
                                type="number"
                                name="price"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => onItemChange(e, index)}
                                required
                                min="0"
                                style={{ flex: 1 }}
                            />
                            <button type="button" onClick={() => removeItem(index)} className="btn btn-danger">x</button>
                        </div>
                    ))
                }
                <button type="button" onClick={addItem} className="btn btn-light my-1">+ Add Item</button>

                <div style={{ textAlign: 'right', margin: '20px 0', fontSize: '1.2rem' }}>
                    <p>Subtotal: {currency} {calculateSubTotal().toFixed(2)}</p>
                    <p>Tax: {currency} {calculateTax().toFixed(2)}</p>
                    <h3>Total: {currency} {calculateTotal().toFixed(2)}</h3>
                </div>

                <input type="submit" value={isSubmitting ? 'Saving...' : (id ? 'Update Estimate' : 'Save Estimate')} className="btn btn-primary btn-block" disabled={isSubmitting} />
            </form >
        </div >
    );
};

export default EstimateForm;
