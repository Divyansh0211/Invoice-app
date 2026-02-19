import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getCurrencySymbol } from '../utils/currencyMap';

const InvoiceDetails = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'Cash',
        note: ''
    });

    const { amount, date, method, note } = paymentData;

    useEffect(() => {
        getInvoice();
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
                            <button onClick={downloadPDF} className="btn btn-secondary">Download PDF</button>
                        </div>
                    </div>

                    <div id="invoice-preview" style={{ padding: '20px', margin: '20px 0', border: '1px solid #ccc', background: '#fff' }}>
                        <div style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                            <h2 style={{ color: '#333' }}>INVOICE</h2>
                            <span className={`badge badge-${invoice.status === 'Paid' ? 'success' : invoice.status === 'Overdue' ? 'danger' : 'primary'}`} style={{ float: 'right', fontSize: '1.2rem' }}>
                                {invoice.status}
                            </span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                <div>
                                    <strong>From:</strong><br />
                                    {invoice.businessName || 'Your Business'}<br />
                                    {invoice.businessGST && <span>GST: {invoice.businessGST}</span>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <strong>To:</strong><br />
                                    {invoice.clientName}<br />
                                    {invoice.clientEmail}<br />
                                    {invoice.clientGST && <span>GST: {invoice.clientGST}</span>}
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
                                {invoice.items.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>{item.description}</td>
                                        <td style={{ padding: '10px' }}>{item.quantity}</td>
                                        <td style={{ padding: '10px' }}>{getCurrencySymbol(invoice.currency)} {item.price}</td>
                                        <td style={{ padding: '10px' }}>{getCurrencySymbol(invoice.currency)} {item.quantity * item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ textAlign: 'right' }}>

                            <p>Subtotal: {getCurrencySymbol(invoice.currency)} {invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0).toFixed(2)}</p>
                            {invoice.discountRate > 0 && <p>Discount ({invoice.discountRate}%): {getCurrencySymbol(invoice.currency)} {((invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) * invoice.discountRate) / 100).toFixed(2)}</p>}
                            {invoice.gstRate > 0 &&
                                <p>GST ({invoice.gstRate}%): {getCurrencySymbol(invoice.currency)} {(((invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) - ((invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0) * (invoice.discountRate || 0)) / 100)) * invoice.gstRate) / 100).toFixed(2)}</p>
                            }
                            <h3>Total: {getCurrencySymbol(invoice.currency)} {invoice.total.toFixed(2)}</h3>
                            <p>Amount Paid: {getCurrencySymbol(invoice.currency)} {totalPaid.toFixed(2)}</p>
                            <h4 className="text-primary">Balance Due: {getCurrencySymbol(invoice.currency)} {balanceDue.toFixed(2)}</h4>
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
        </div>
    );
};

export default InvoiceDetails;
