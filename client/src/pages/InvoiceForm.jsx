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
        currency: user?.settings?.currency || 'USD',
        dueDate: '',
        discountRate: 0,
        invoiceNumber: '',
        termsAndConditions: '',
        logoUrl: '',
        signatureUrl: '',
        bankDetails: { accountNo: '', ifsc: '', upiId: '' },
        items: [{ description: '', quantity: 1, price: 0 }]
    });

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { clientName, clientEmail, businessName, businessGST, clientGST, gstRate, status, currency, dueDate, discountRate, invoiceNumber, termsAndConditions, logoUrl, signatureUrl, bankDetails, items } = invoice;

    useEffect(() => {
        if (id) {
            getInvoice(id);
        } else if (user) {
            let defaultDays = user.settings?.defaultDueDays || 7;
            let dDate = new Date();
            dDate.setDate(dDate.getDate() + defaultDays);

            let terms = user.settings?.termsAndConditions || '';
            terms = terms.replace('{defaultDueDays}', defaultDays);

            setInvoice(prev => ({
                ...prev,
                currency: user.settings?.currency || 'USD',
                businessName: user.businessName || '',
                gstRate: user.settings?.enableTax === false ? 0 : (user.settings?.taxRate || 0),
                dueDate: dDate.toISOString().split('T')[0],
                termsAndConditions: terms,
                logoUrl: user.logoUrl || '',
                signatureUrl: user.settings?.signatureUrl || '',
                bankDetails: user.bankDetails || { accountNo: '', ifsc: '', upiId: '' }
            }));
        }
        getCustomers();
        getProducts();
    }, [id, user]);

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
        const discountAmount = (subTotal * (discountRate || 0)) / 100;
        const taxableAmount = subTotal - discountAmount;
        const gstAmount = (taxableAmount * gstRate) / 100;
        return taxableAmount + gstAmount;
    };

    const onSubmit = async e => {
        e.preventDefault();
        setIsSubmitting(true);
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
            if (err.response && err.response.status === 403) {
                alert(err.response.data.msg);
                navigate('/billing');
            } else {
                alert('An error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
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
                        <label>Discount (%)</label>
                        <input type="number" name="discountRate" value={discountRate} onChange={onChange} min="0" step="0.1" />
                    </div>
                </div>

                <h3>Additional Details</h3>
                <div className="grid-2">
                    <div className="form-group">
                        <label>Invoice Number (Optional)</label>
                        <input type="text" name="invoiceNumber" value={invoiceNumber} onChange={onChange} placeholder="Auto-generated if blank" />
                    </div>
                    <div className="form-group">
                        <label>Logo URL (Optional)</label>
                        <input type="text" name="logoUrl" value={logoUrl} onChange={onChange} placeholder="https://example.com/logo.png" />
                    </div>
                </div>
                <div className="grid-2">
                    <div className="form-group">
                        <label>Terms & Conditions (Optional)</label>
                        <textarea name="termsAndConditions" value={termsAndConditions} onChange={onChange} rows="2"></textarea>
                    </div>
                    <div className="form-group">
                        <label>Signature URL (Optional)</label>
                        <input type="text" name="signatureUrl" value={signatureUrl} onChange={onChange} placeholder="https://.../sig.png" />
                    </div>
                </div>

                <h3>Bank Details</h3>
                <div className="grid-3">
                    <div className="form-group">
                        <label>Account Number</label>
                        <input type="text" name="accountNo" value={bankDetails?.accountNo || ''} onChange={(e) => setInvoice({ ...invoice, bankDetails: { ...bankDetails, accountNo: e.target.value } })} />
                    </div>
                    <div className="form-group">
                        <label>IFSC Code</label>
                        <input type="text" name="ifsc" value={bankDetails?.ifsc || ''} onChange={(e) => setInvoice({ ...invoice, bankDetails: { ...bankDetails, ifsc: e.target.value } })} />
                    </div>
                    <div className="form-group">
                        <label>UPI ID</label>
                        <input type="text" name="upiId" value={bankDetails?.upiId || ''} onChange={(e) => setInvoice({ ...invoice, bankDetails: { ...bankDetails, upiId: e.target.value } })} />
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

                <div id="invoice-preview" style={{ padding: '30px', border: '1px solid #ccc', margin: '20px 0', background: '#fff', color: '#333', position: 'relative' }}>
                    {/* Watermark Logic */}
                    {(status === 'Paid' || status === 'Overdue' || !id) && (
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
                            fontSize: '8rem', color: status === 'Paid' ? 'rgba(5,205,153,0.1)' : status === 'Overdue' ? 'rgba(238,93,80,0.1)' : 'rgba(0,0,0,0.05)',
                            fontWeight: 'bold', zIndex: 0, pointerEvents: 'none', whiteSpace: 'nowrap'
                        }}>
                            {status === 'Paid' ? 'PAID' : status === 'Overdue' ? 'OVERDUE' : 'DRAFT'}
                        </div>
                    )}

                    <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            {logoUrl && <img src={logoUrl} alt="Logo" style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', marginBottom: '10px' }} />}
                            <h2 style={{ color: '#333', margin: '0 0 5px 0' }}>INVOICE {invoiceNumber ? `#${invoiceNumber}` : `(Auto-generated)`}</h2>
                            <p style={{ margin: 0, color: '#666' }}>Date: {new Date().toLocaleDateString()}</p>
                            {dueDate && <p style={{ margin: 0, color: '#666' }}>Due Date: {new Date(dueDate).toLocaleDateString()}</p>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <strong>From:</strong><br />
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{businessName || user?.name || 'Your Business'}</span><br />
                            {businessGST && <span>GST/Tax ID: {businessGST}</span>}
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px', position: 'relative', zIndex: 1 }}>
                        <strong>Billed To:</strong><br />
                        <span style={{ fontSize: '1.2rem' }}>{clientName}</span><br />
                        {clientEmail}<br />
                        {clientGST && <span>GST/Tax ID: {clientGST}</span>}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left', backgroundColor: '#f9f9f9' }}>
                                <th style={{ padding: '12px' }}>Item Description</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Price</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{item.description}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>{currency} {Number(item.price).toFixed(user?.settings?.decimalPrecision || 2)}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>{currency} {(item.quantity * item.price).toFixed(user?.settings?.decimalPrecision || 2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', position: 'relative', zIndex: 1 }}>
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                            {(bankDetails?.accountNo || bankDetails?.ifsc || bankDetails?.upiId) && (
                                <div style={{ marginBottom: '20px' }}>
                                    <strong>Bank Details:</strong>
                                    {bankDetails.accountNo && <p style={{ margin: 0 }}>Account No: {bankDetails.accountNo}</p>}
                                    {bankDetails.ifsc && <p style={{ margin: 0 }}>IFSC: {bankDetails.ifsc}</p>}
                                    {bankDetails.upiId && <p style={{ margin: 0 }}>UPI: {bankDetails.upiId}</p>}
                                </div>
                            )}
                            {termsAndConditions && (
                                <div>
                                    <strong>Terms & Conditions:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', whiteSpace: 'pre-wrap' }}>{termsAndConditions}</p>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 0.8, textAlign: 'right' }}>
                            <p style={{ margin: '5px 0' }}>Subtotal: {currency} {calculateSubTotal().toFixed(user?.settings?.decimalPrecision || 2)}</p>
                            {discountRate > 0 && <p style={{ margin: '5px 0', color: '#d9534f' }}>Discount ({discountRate}%): -{currency} {((calculateSubTotal() * discountRate) / 100).toFixed(user?.settings?.decimalPrecision || 2)}</p>}
                            {gstRate > 0 && <p style={{ margin: '5px 0' }}>{user?.settings?.taxType || 'Tax'} ({gstRate}%): {currency} {(((calculateSubTotal() - ((calculateSubTotal() * discountRate) / 100)) * gstRate) / 100).toFixed(user?.settings?.decimalPrecision || 2)}</p>}
                            <h3 style={{ marginTop: '15px', borderTop: '2px solid #333', paddingTop: '10px' }}>Total Amount: {currency} {calculateTotal().toFixed(user?.settings?.decimalPrecision || 2)}</h3>

                            {signatureUrl && (
                                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                    <img src={signatureUrl} alt="Signature" style={{ maxHeight: '60px', maxWidth: '150px', objectFit: 'contain', borderBottom: '1px solid #ccc', paddingBottom: '5px' }} />
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#666' }}>Authorized Signature</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <input type="submit" value={isSubmitting ? 'Saving...' : (id ? 'Update Invoice' : 'Create Invoice')} className="btn btn-primary btn-block" disabled={isSubmitting} />
            </form >
        </div >
    );
};

export default InvoiceForm;
