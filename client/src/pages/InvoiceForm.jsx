import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceForm = () => {
    const authContext = useContext(AuthContext);
    const { user } = authContext;
    const navigate = useNavigate();
    const { id } = useParams();

    const [invoice, setInvoice] = useState({
        clientName: '',
        clientEmail: '',
        businessName: '',
        businessGST: '',
        clientGST: '',
        gstRate: 0,
        status: 'Pending',
        currency: 'USD',
        dueDate: '',
        discount: 0,
        items: [{ description: '', quantity: 1, price: 0 }]
    });

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const { clientName, clientEmail, businessName, businessGST, clientGST, gstRate, status, currency, dueDate, discount, items } = invoice;

    useEffect(() => {
        if (id) {
            getInvoice(id);
        }
        getCustomers();
        getProducts();
    }, [id]);

    const getInvoice = async (invoiceId) => {
        try {
            const res = await axios.get(`/api/invoices`);
            const foundInvoice = res.data.find(inv => inv._id === invoiceId);
            if (foundInvoice) {
                // Format date for input type="date"
                if (foundInvoice.dueDate) {
                    foundInvoice.dueDate = foundInvoice.dueDate.split('T')[0];
                }
                setInvoice(foundInvoice);
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

    const onChange = e => setInvoice({ ...invoice, [e.target.name]: e.target.value });

    const onCustomerSelect = e => {
        const customerId = e.target.value;
        if (customerId === "") return;

        const customer = customers.find(c => c._id === customerId);
        if (customer) {
            setInvoice({
                ...invoice,
                clientName: customer.name,
                clientEmail: customer.email,
                clientGST: customer.gst || '',
            });
        }
    };

    const onProductSelect = (e) => {
        const productId = e.target.value;
        if (productId === "") return;

        const product = products.find(p => p._id === productId);
        if (product) {
            setInvoice({
                ...invoice,
                items: [...items, { description: product.name, quantity: 1, price: product.price }]
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
        setInvoice({ ...invoice, items: newItems });
    };

    const addItem = () => {
        setInvoice({ ...invoice, items: [...items, { description: '', quantity: 1, price: 0 }] });
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setInvoice({ ...invoice, items: newItems });
    };

    const calculateSubTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    };

    const calculateTotal = () => {
        const subTotal = calculateSubTotal();
        const taxableAmount = subTotal - (discount || 0);
        const gstAmount = (taxableAmount * gstRate) / 100;
        return taxableAmount + gstAmount;
    };

    const onSubmit = async e => {
        e.preventDefault();
        const total = calculateTotal();
        const formData = { ...invoice, total };

        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            if (id) {
                await axios.put(`/api/invoices/${id}`, formData, config);
            } else {
                await axios.post('/api/invoices', formData, config);
            }
            navigate('/');
        } catch (err) {
            console.error(err);
        }
    };

    const downloadPDF = () => {
        const input = document.getElementById('invoice-preview');
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`invoice_${clientName}.pdf`);
        });
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>{id ? 'Edit' : 'Create'} <span className="text-primary">Invoice</span></h1>
                <button onClick={downloadPDF} className="btn btn-secondary">Download PDF</button>
            </div>

            <div className="grid-2 my-1">
                <div className="form-group">
                    <label>Select Saved Customer</label>
                    <select onChange={onCustomerSelect}>
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
                <div className="grid-2">
                    <div className="form-group">
                        <label>Client Name</label>
                        <input type="text" name="clientName" value={clientName} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                        <label>Client Email</label>
                        <input type="email" name="clientEmail" value={clientEmail} onChange={onChange} required />
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label>Business Name (Optional)</label>
                        <input type="text" name="businessName" value={businessName} onChange={onChange} />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={status} onChange={onChange}>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label>Due Date</label>
                        <input type="date" name="dueDate" value={dueDate} onChange={onChange} />
                    </div>
                </div>

                <div className="grid-3">
                    <div className="form-group">
                        <label>Business GST (Optional)</label>
                        <input type="text" name="businessGST" value={businessGST} onChange={onChange} placeholder="Your GSTIN" />
                    </div>
                    <div className="form-group">
                        <label>Client GST (Optional)</label>
                        <input type="text" name="clientGST" value={clientGST} onChange={onChange} placeholder="Client GSTIN" />
                    </div>
                    <div className="form-group">
                        <label>Currency</label>
                        <select name="currency" value={currency} onChange={onChange}>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label>GST Rate (%)</label>
                        <input type="number" name="gstRate" value={gstRate} onChange={onChange} min="0" step="0.1" />
                    </div>
                    <div className="form-group">
                        <label>Discount</label>
                        <input type="number" name="discount" value={discount} onChange={onChange} min="0" step="0.01" />
                    </div>
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

                <div id="invoice-preview" style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0', background: '#fff', color: '#333' }}>
                    <div style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                        <h2 style={{ color: '#333' }}>INVOICE</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <strong>From:</strong><br />
                                {businessName || user?.name || 'Your Business'}<br />
                                {businessGST && <span>GST: {businessGST}</span>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <strong>To:</strong><br />
                                {clientName}<br />
                                {clientEmail}<br />
                                {clientGST && <span>GST: {clientGST}</span>}
                            </div>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>Item</th>
                                <th style={{ padding: '10px' }}>Qty</th>
                                <th style={{ padding: '10px' }}>Price</th>
                                <th style={{ padding: '10px' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{item.description}</td>
                                    <td style={{ padding: '10px' }}>{item.quantity}</td>

                                    <td style={{ padding: '10px' }}>{currency} {item.price}</td>
                                    <td style={{ padding: '10px' }}>{currency} {item.quantity * item.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ textAlign: 'right' }}>
                        <p>Subtotal: {currency} {calculateSubTotal()}</p>
                        <p>Discount: {currency} {discount}</p>
                        <p>GST ({gstRate}%): {currency} {(((calculateSubTotal() - discount) * gstRate) / 100).toFixed(2)}</p>
                        <h3>Total: {currency} {calculateTotal().toFixed(2)}</h3>
                    </div>
                </div>

                <input type="submit" value={id ? 'Update Invoice' : 'Create Invoice'} className="btn btn-primary btn-block" />
            </form >
        </div >
    );
};

export default InvoiceForm;
