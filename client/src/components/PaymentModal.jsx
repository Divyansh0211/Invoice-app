import React, { useState } from 'react';
import axios from 'axios';

const PaymentModal = ({ onClose, invoice, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState(''); // 'card', 'qr', 'upi'
    const [processing, setProcessing] = useState(false);

    const handlePayment = async () => {
        setProcessing(true);
        if (paymentMethod === 'card') {
            try {
                // If the user clicks Card, we'll hit the checkout session endpoint
                const res = await axios.post(`/api/invoices/${invoice._id}/create-checkout-session`);
                if (res.data.url) {
                    window.location.href = res.data.url;
                }
            } catch (err) {
                console.error(err);
                alert(err.response?.data?.msg || 'Failed to initiate Stripe payment.');
                setProcessing(false);
            }
        } else {
            // Mock payment for QR or UPI
            setTimeout(() => {
                setProcessing(false);
                onPaymentSuccess(invoice._id);
            }, 1500);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.25rem' }}>
                        Pay Invoice #{invoice.invoiceNumber}
                    </h3>
                    <button onClick={onClose} style={closeBtnStyle}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div style={amountStyle}>
                    <span style={{ fontSize: '1rem', color: '#7f8c8d' }}>Amount to Pay</span>
                    <strong style={{ fontSize: '2rem', color: '#2c3e50' }}>
                        {invoice.currency} {(invoice.total - (invoice.payments ? invoice.payments.reduce((acc, p) => acc + p.amount, 0) : 0)).toFixed(2)}
                    </strong>
                </div>

                {!paymentMethod ? (
                    <div>
                        <h4 style={{ marginBottom: '15px', color: '#34495e' }}>Select Payment Method</h4>
                        <div style={methodGridStyle}>
                            <button style={methodBtnStyle} onClick={() => setPaymentMethod('card')}>
                                <i className="fas fa-credit-card" style={iconStyle}></i>
                                Credit/Debit Card
                            </button>
                            <button style={methodBtnStyle} onClick={() => setPaymentMethod('qr')}>
                                <i className="fas fa-qrcode" style={iconStyle}></i>
                                Scan QR Code
                            </button>
                            <button style={methodBtnStyle} onClick={() => setPaymentMethod('upi')}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" style={{ width: '40px', marginBottom: '10px' }} />
                                UPI ID
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '10px 0' }}>
                        {paymentMethod === 'card' && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <i className="fab fa-stripe" style={{ fontSize: '4rem', color: '#6772e5', marginBottom: '15px' }}></i>
                                <p style={{ color: '#2c3e50', fontSize: '1rem', marginBottom: '10px' }}>You will be securely redirected to Stripe to complete your card payment.</p>
                                <p style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>We support all major credit and debit cards.</p>
                            </div>
                        )}

                        {paymentMethod === 'qr' && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example_upi_payment_link" alt="QR Code" style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <p style={{ marginTop: '15px', color: '#7f8c8d', fontSize: '0.9rem' }}>Scan this QR code with any UPI app to pay.</p>
                            </div>
                        )}

                        {paymentMethod === 'upi' && (
                            <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Enter your UPI ID</label>
                                    <input type="text" placeholder="username@bank" style={inputStyle} required />
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#95a5a6', marginBottom: '20px' }}>
                                    A payment request will be sent to your UPI app.
                                </p>
                            </form>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                            <button onClick={() => setPaymentMethod('')} style={{ background: 'transparent', border: 'none', color: '#7f8c8d', cursor: 'pointer', fontWeight: '500' }}>
                                <i className="fas fa-arrow-left"></i> Back
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={processing}
                                style={{
                                    background: '#2ecc71',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 25px',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {processing ? (
                                    <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
                                ) : (
                                    <>Pay Now</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalStyle = {
    background: '#fff',
    width: '450px',
    maxWidth: '90%',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    padding: '30px',
    animation: 'popIn 0.3s ease'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    paddingBottom: '15px',
    marginBottom: '20px'
};

const closeBtnStyle = {
    background: '#f1f2f6',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#7f8c8d',
    transition: 'all 0.2s'
};

const amountStyle = {
    background: '#f8f9fc',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '25px',
    border: '1px solid #e2e8f0'
};

const methodGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px'
};

const methodBtnStyle = {
    background: '#fff',
    border: '2px solid #ecf0f1',
    borderRadius: '8px',
    padding: '20px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#2c3e50',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
};

const iconStyle = {
    fontSize: '2rem',
    color: '#3498db',
    marginBottom: '10px'
};

const inputGroupStyle = {
    marginBottom: '15px'
};

const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: '#2c3e50',
    fontWeight: '500',
    fontSize: '0.9rem'
};

const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border 0.2s'
};

export default PaymentModal;
