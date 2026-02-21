import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EstimateDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [estimate, setEstimate] = useState(null);

    const getCurrencySymbol = (currency) => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            case 'JPY': return '¥';
            default: return '$';
        }
    };

    const getEstimate = async () => {
        try {
            const res = await axios.get(`/api/estimates/${id}`);
            setEstimate(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        getEstimate();
    }, [id]);

    const downloadPDF = () => {
        const input = document.getElementById('estimate-preview');
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`estimate_${estimate.estimateNumber || estimate._id}.pdf`);
        });
    };

    const sendEmail = async () => {
        try {
            await axios.post(`/api/estimates/${id}/send`);
            alert('Estimate sent to email successfully!');
            getEstimate(); // refresh status
        } catch (err) {
            console.error(err);
            alert('Failed to send email.');
        }
    };

    const updateStatus = async (newStatus) => {
        try {
            const config = { headers: { 'Content-Type': 'application/json' } };
            await axios.put(`/api/estimates/${id}`, { status: newStatus }, config);
            getEstimate();
        } catch (err) {
            console.error(err);
            alert('Failed to update status.');
        }
    };

    const convertToInvoice = async () => {
        if (!window.confirm('Convert this estimate to a final invoice? Inventory will be deducted.')) return;
        try {
            const res = await axios.post(`/api/estimates/${id}/convert`);
            alert('Converted successfully!');
            navigate(`/invoice/${res.data.invoice._id}`); // assume standard invoice view route
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to convert to invoice.');
        }
    };

    if (!estimate) return <div>Loading...</div>;

    const currencySymbol = getCurrencySymbol(estimate.currency || 'USD');

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Link to="/estimates" className="btn btn-light">Back to Estimates</Link>
                <div>
                    <button onClick={sendEmail} className="btn btn-primary" style={{ marginRight: '10px' }}>
                        <i className="fas fa-envelope"></i> Send Email
                    </button>
                    {estimate.status === 'Draft' || estimate.status === 'Sent' ? (
                        <>
                            <button onClick={() => updateStatus('Approved')} className="btn btn-success" style={{ marginRight: '10px' }}>Approve</button>
                            <button onClick={() => updateStatus('Rejected')} className="btn btn-danger" style={{ marginRight: '10px' }}>Reject</button>
                        </>
                    ) : null}

                    {estimate.status === 'Approved' && (
                        <button onClick={convertToInvoice} className="btn badge-primary" style={{ marginRight: '10px' }}>
                            <i className="fas fa-file-invoice"></i> Convert to Invoice
                        </button>
                    )}

                    {estimate.linkedInvoice && (
                        <Link to={`/invoice/${estimate.linkedInvoice}`} className="btn badge-dark" style={{ marginRight: '10px' }}>
                            View Invoice
                        </Link>
                    )}

                    <button onClick={downloadPDF} className="btn btn-secondary">Download PDF</button>
                </div>
            </div>

            <div id="estimate-preview" style={{ padding: '40px', border: '1px solid #eee', background: '#fff', color: '#333', position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
                    fontSize: '8rem',
                    color: estimate.status === 'Approved' ? 'rgba(5,205,153,0.1)' :
                        estimate.status === 'Converted' ? 'rgba(0,0,0,0.1)' :
                            estimate.status === 'Rejected' ? 'rgba(238,93,80,0.1)' : 'rgba(0,0,0,0.05)',
                    fontWeight: 'bold', zIndex: 0, pointerEvents: 'none', whiteSpace: 'nowrap'
                }}>
                    {estimate.status.toUpperCase()}
                </div>

                <div style={{ borderBottom: '2px solid #ccc', paddingBottom: '20px', marginBottom: '20px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>ESTIMATE {estimate.estimateNumber ? `#${estimate.estimateNumber}` : ''}</h2>
                        <p style={{ margin: 0, color: '#666' }}>Date: {new Date(estimate.date).toLocaleDateString()}</p>
                        <p style={{ margin: 0, color: '#666' }}>Valid Until: {new Date(estimate.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${estimate.status === 'Draft' ? 'badge-light' : estimate.status === 'Sent' ? 'badge-primary' : estimate.status === 'Approved' ? 'badge-success' : estimate.status === 'Converted' ? 'badge-dark' : 'badge-danger'}`} style={{ fontSize: '1.1rem' }}>
                            {estimate.status}
                        </span>
                    </div>
                </div>

                <div style={{ marginBottom: '30px', position: 'relative', zIndex: 1 }}>
                    <strong>Prepared For:</strong><br />
                    <span style={{ fontSize: '1.2rem' }}>{estimate.customer?.name}</span><br />
                    {estimate.customer?.email}
                </div>

                {estimate.notes && (
                    <div style={{ padding: '15px', background: '#f4f4f4', marginBottom: '20px', borderRadius: '5px', position: 'relative', zIndex: 1 }}>
                        <strong>Notes:</strong> {estimate.notes}
                    </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #333', textAlign: 'left', backgroundColor: '#f9f9f9' }}>
                            <th style={{ padding: '12px' }}>Description</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Unit Price</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estimate.items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}>{item.description}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>{currencySymbol}{item.price.toFixed(2)}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>{currencySymbol}{(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '40%', textAlign: 'right' }}>
                        <p style={{ margin: '5px 0' }}>Subtotal: {currencySymbol}{estimate.subTotal.toFixed(2)}</p>
                        {estimate.taxAmount > 0 && <p style={{ margin: '5px 0' }}>Tax: {currencySymbol}{estimate.taxAmount.toFixed(2)}</p>}
                        <h3 style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #333' }}>
                            Estimate Total: {currencySymbol}{estimate.totalAmount.toFixed(2)}
                        </h3>
                    </div>
                </div>

                <div style={{ marginTop: '40px', fontSize: '0.9rem', color: '#666', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <p>This is an estimate, not a contract or a bill. It is our best guess at the total price for the service and goods described above, which will be billed after completion or delivery.</p>
                </div>
            </div>
        </div>
    );
};

export default EstimateDetails;
