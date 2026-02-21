import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getCurrencySymbol } from '../utils/currencyMap';
import PaymentModal from '../components/PaymentModal';

const InvoiceDetails = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'Cash',
        note: ''
    });
    const [payingInvoice, setPayingInvoice] = useState(null);

    const { amount, date, method, note } = paymentData;

    useEffect(() => {
        getInvoice();

        // Check for success/canceled stripe params
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')) {
            alert('Payment initiated successfully! Please check status later or record payment manually if your webhook is not set up.');
            // remove query params
            window.history.replaceState(null, '', window.location.pathname);
        }
        if (query.get('canceled')) {
            alert('Payment was canceled.');
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [id]);

    const getInvoice = async () => {
        try {
            const res = await axios.get('/api/invoices');
            const foundInvoice = res.data.find(inv => inv._id === id);
            setInvoice(foundInvoice);
        } catch (err) {
            console.error(err);
        }
    };

    const onChange = e => setPaymentData({ ...paymentData, [e.target.name]: e.target.value });

    const onPaymentSubmit = async e => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            await axios.post(`/api/invoices/${id}/payments`, paymentData, config);
            setPaymentData({
                amount: '',
                date: new Date().toISOString().split('T')[0],
                method: 'Cash',
                note: ''
            });
            getInvoice();
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
            pdf.save(`invoice_${invoice.clientName}.pdf`);
        });
    };

    const sendEmail = async () => {
        try {
            await axios.post(`/api/invoices/${id}/send`);
            alert('Invoice sent to email successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to send email.');
        }
    };

    const sendReminder = async () => {
        if (window.confirm('Send payment reminder email to client?')) {
            try {
                await axios.post(`/api/invoices/${id}/remind`);
                alert('Payment Reminder sent successfully!');
            } catch (err) {
                console.error(err);
                alert('Failed to send reminder.');
            }
        }
    };

    const handlePay = async () => {
        setPayingInvoice(invoice);
    };

    const handlePaymentSuccess = async (invoiceId) => {
        try {
            // Wait for Modal delay, then just use our existing backend endpoint to register payment.
            // In a real flow, this would hit Stripe/UPI callback, we'll hit our local payment API to mock.
            const paymentPayload = {
                amount: balanceDue,
                date: new Date().toISOString().split('T')[0],
                method: 'Online',
                note: 'Paid via Client Portal / Direct Link'
            };
            await axios.post(`/api/invoices/${invoiceId}/payments`, paymentPayload, { headers: { 'Content-Type': 'application/json' } });

            setPayingInvoice(null);
            getInvoice(); // refresh data
            alert('Payment successfully recorded!');
        } catch (err) {
            console.error(err);
            alert('Failed to record payment');
        }
    };

    if (!invoice) return <div>Loading...</div>;

    const totalPaid = invoice.payments ? invoice.payments.reduce((acc, p) => acc + p.amount, 0) : 0;
    const balanceDue = invoice.total - totalPaid;

    return (
        <div className="grid-2">
            <div>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to="/" className="btn btn-light">Back</Link>
                        <div>
                            <button onClick={sendEmail} className="btn btn-primary" style={{ marginRight: '10px' }}>
                                <i className="fas fa-envelope"></i> Send Email
                            </button>
                            {invoice.status !== 'Paid' && (
                                <button onClick={sendReminder} className="btn btn-dark" style={{ marginRight: '10px' }}>
                                    <i className="fas fa-bell"></i> Send Reminder
                                </button>
                            )}
                            {balanceDue > 0 && (
                                <button onClick={handlePay} className="btn btn-success" style={{ marginRight: '10px', backgroundColor: '#28a745', color: 'white', border: 'none' }}>
                                    Pay for Product
                                </button>
                            )}
                            <button onClick={downloadPDF} className="btn btn-secondary">Download PDF</button>
                        </div>
                    </div>

                    <div id="invoice-preview" style={{ padding: '30px', margin: '20px 0', border: '1px solid #ccc', background: '#fff', color: '#333', position: 'relative' }}>
                        {/* Watermark Logic */}
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
                            fontSize: '8rem', color: invoice.status === 'Paid' ? 'rgba(5,205,153,0.1)' : invoice.status === 'Overdue' ? 'rgba(238,93,80,0.1)' : 'rgba(0,0,0,0.05)',
                            fontWeight: 'bold', zIndex: 0, pointerEvents: 'none', whiteSpace: 'nowrap'
                        }}>
                            {invoice.status === 'Paid' ? 'PAID' : invoice.status === 'Overdue' ? 'OVERDUE' : 'DRAFT'}
                        </div>

                        <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                {invoice.logoUrl && <img src={invoice.logoUrl} alt="Logo" style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', marginBottom: '10px' }} />}
                                <h2 style={{ color: '#333', margin: '0 0 5px 0' }}>INVOICE {invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : ''}</h2>
                                <p style={{ margin: 0, color: '#666' }}>Date: {new Date(invoice.date).toLocaleDateString()}</p>
                                {invoice.dueDate && <p style={{ margin: 0, color: '#666' }}>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>}
                                <span className={`badge badge-${invoice.status === 'Paid' ? 'success' : invoice.status === 'Overdue' ? 'danger' : 'primary'}`} style={{ marginTop: '10px', display: 'inline-block' }}>
                                    {invoice.status}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <strong>From:</strong><br />
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{invoice.businessName || 'Your Business'}</span><br />
                                {invoice.businessGST && <span>GST/Tax ID: {invoice.businessGST}</span>}
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px', position: 'relative', zIndex: 1 }}>
                            <strong>Billed To:</strong><br />
                            <span style={{ fontSize: '1.2rem' }}>{invoice.clientName}</span><br />
                            {invoice.clientEmail}<br />
                            {invoice.clientGST && <span>GST/Tax ID: {invoice.clientGST}</span>}
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
                                {invoice.items.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{item.description}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{getCurrencySymbol(invoice.currency)} {Number(item.price).toFixed(2)}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{getCurrencySymbol(invoice.currency)} {(item.quantity * item.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', position: 'relative', zIndex: 1 }}>
                            <div style={{ flex: 1, paddingRight: '20px' }}>
                                {(invoice.bankDetails?.accountNo || invoice.bankDetails?.ifsc || invoice.bankDetails?.upiId) && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <strong>Bank Details:</strong>
                                        {invoice.bankDetails.accountNo && <p style={{ margin: 0 }}>Account No: {invoice.bankDetails.accountNo}</p>}
                                        {invoice.bankDetails.ifsc && <p style={{ margin: 0 }}>IFSC: {invoice.bankDetails.ifsc}</p>}
                                        {invoice.bankDetails.upiId && <p style={{ margin: 0 }}>UPI: {invoice.bankDetails.upiId}</p>}
                                    </div>
                                )}
                                {invoice.termsAndConditions && (
                                    <div>
                                        <strong>Terms & Conditions:</strong>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', whiteSpace: 'pre-wrap' }}>{invoice.termsAndConditions}</p>
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 0.8, textAlign: 'right' }}>
                                <p style={{ margin: '5px 0' }}>Subtotal: {getCurrencySymbol(invoice.currency)} {invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0).toFixed(2)}</p>
                                {invoice.discountRate > 0 && <p style={{ margin: '5px 0', color: '#d9534f' }}>Discount ({invoice.discountRate}%): -{getCurrencySymbol(invoice.currency)} {((invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) * invoice.discountRate) / 100).toFixed(2)}</p>}
                                {invoice.gstRate > 0 && <p style={{ margin: '5px 0' }}>Tax ({invoice.gstRate}%): {getCurrencySymbol(invoice.currency)} {(((invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) - ((invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) * (invoice.discountRate || 0)) / 100)) * invoice.gstRate) / 100).toFixed(2)}</p>}

                                <h3 style={{ marginTop: '15px', borderTop: '2px solid #333', paddingTop: '10px' }}>Total Amount: {getCurrencySymbol(invoice.currency)} {invoice.total.toFixed(2)}</h3>
                                <p style={{ margin: '5px 0' }}>Amount Paid: {getCurrencySymbol(invoice.currency)} {totalPaid.toFixed(2)}</p>
                                <h4 className={balanceDue > 0 ? "text-danger" : "text-success"} style={{ marginTop: '10px' }}>Balance Due: {getCurrencySymbol(invoice.currency)} {balanceDue.toFixed(2)}</h4>

                                {invoice.signatureUrl && (
                                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                        <img src={invoice.signatureUrl} alt="Signature" style={{ maxHeight: '60px', maxWidth: '150px', objectFit: 'contain', borderBottom: '1px solid #ccc', paddingBottom: '5px' }} />
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#666' }}>Authorized Signature</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="card">
                    <h3>Record Payment</h3>
                    <form onSubmit={onPaymentSubmit}>
                        <div className="form-group">
                            <label>Amount</label>
                            <input type="number" name="amount" value={amount} onChange={onChange} max={balanceDue} min="0.01" step="0.01" required />
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" name="date" value={date} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Method</label>
                            <select name="method" value={method} onChange={onChange}>
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="UPI">UPI</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Note</label>
                            <input type="text" name="note" value={note} onChange={onChange} />
                        </div>
                        <input type="submit" value="Add Payment" className="btn btn-primary btn-block" disabled={balanceDue <= 0} />
                    </form>
                </div>

                <div className="card my-1">
                    <h3>Payment History</h3>
                    {invoice.payments && invoice.payments.length > 0 ? (
                        <ul className="list">
                            {invoice.payments.map((pay, index) => (
                                <li key={index} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
                                    <strong>{getCurrencySymbol(invoice.currency)} {pay.amount}</strong> - {new Date(pay.date).toLocaleDateString()}
                                    <br />
                                    <span className="text-secondary">{pay.method}</span> {pay.note && <span>- {pay.note}</span>}
                                </li>
                            ))}
                        </ul>
                    ) : <p>No payments recorded.</p>}
                </div>
            </div>

            {payingInvoice && (
                <PaymentModal
                    invoice={{
                        ...payingInvoice,
                        currency: getCurrencySymbol(payingInvoice.currency) // PaymentModal expects standard string, but we can pass symbol
                    }}
                    onClose={() => setPayingInvoice(null)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
};

export default InvoiceDetails;
