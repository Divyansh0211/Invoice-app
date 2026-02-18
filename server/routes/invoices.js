const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// Middleware to verify token (Inline for now, should be separate)
const auth = require('../middleware/auth'); // I need to create this

// @route   GET api/invoices
// @desc    Get all users invoices
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id }).sort({ date: -1 });
        res.json(invoices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/invoices
// @desc    Add new invoice
// @access  Private
router.post('/', auth, async (req, res) => {
    console.log('POST /api/invoices request body:', req.body);
    const { clientName, clientEmail, businessName, businessGST, clientGST, items, gstRate, total, status, dueDate, currency } = req.body;

    try {
        const newInvoice = new Invoice({
            clientName,
            clientEmail,
            businessName,
            businessGST,
            clientGST,
            items,
            gstRate,
            total,
            status,
            dueDate,
            currency,
            user: req.user.id
        });

        const invoice = await newInvoice.save();

        // Send Email Automatically
        try {
            console.log('Attempting to send auto-email...');
            console.log('Email Service:', process.env.EMAIL_SERVICE);
            console.log('Email User:', process.env.EMAIL_USER);
            // Don't log password

            const transporter = require('nodemailer').createTransport({
                service: process.env.EMAIL_SERVICE,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const itemsHtml = invoice.items.map(item => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.description}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${invoice.currency} ${item.price}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${invoice.currency} ${item.quantity * item.price}</td>
                </tr>
            `).join('');

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: invoice.clientEmail,
                subject: `Invoice from ${invoice.businessName || 'Us'} - Due: ${new Date(invoice.dueDate).toLocaleDateString()}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                        <h2 style="color: #333;">Invoice Details</h2>
                        <p>Dear ${invoice.clientName},</p>
                        <p>Please find below the details of your invoice from <strong>${invoice.businessName || 'Us'}</strong>.</p>
                        
                        <div style="background: #f4f4f4; padding: 15px; margin: 20px 0;">
                            <p><strong>Invoice Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
                            <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Status:</strong> ${invoice.status}</p>
                            <h3 style="color: #28a745;">Total Amount: ${invoice.currency} ${invoice.total}</h3>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background: #333; color: #fff;">
                                    <th style="padding: 10px; border: 1px solid #ddd;">Item</th>
                                    <th style="padding: 10px; border: 1px solid #ddd;">Qty</th>
                                    <th style="padding: 10px; border: 1px solid #ddd;">Price</th>
                                    <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <p style="margin-top: 20px;">Please make the payment by the due date to avoid any late fees.</p>
                        <p>Thank you for your business!</p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending auto-email:', error);
                } else {
                    console.log('Auto-email sent: ' + info.response);
                }
            });
        } catch (emailErr) {
            console.error('Email service failed', emailErr);
            // Don't fail the request if email fails, just log it
        }

        res.json(invoice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/invoices/:id
// @desc    Update invoice
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { clientName, clientEmail, businessName, businessGST, clientGST, items, gstRate, total, status, dueDate, currency } = req.body;

    // Build invoice object
    const invoiceFields = {};
    if (clientName) invoiceFields.clientName = clientName;
    if (clientEmail) invoiceFields.clientEmail = clientEmail;
    if (businessName) invoiceFields.businessName = businessName;
    if (businessGST) invoiceFields.businessGST = businessGST;
    if (clientGST) invoiceFields.clientGST = clientGST;
    if (items) invoiceFields.items = items;
    if (gstRate !== undefined) invoiceFields.gstRate = gstRate;
    if (total) invoiceFields.total = total;
    if (status) invoiceFields.status = status;
    if (dueDate) invoiceFields.dueDate = dueDate;
    if (currency) invoiceFields.currency = currency;

    try {
        let invoice = await Invoice.findById(req.params.id);

        if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

        // Make sure user owns invoice
        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { $set: invoiceFields },
            { returnDocument: 'after' }
        );

        res.json(invoice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/invoices/:id
// @desc    Delete invoice
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        let invoice = await Invoice.findById(req.params.id);

        if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

        // Make sure user owns invoice
        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Invoice.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Invoice removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/invoices/:id/payments
// @desc    Add payment to invoice
// @access  Private
router.post('/:id/payments', auth, async (req, res) => {
    const { amount, date, method, note } = req.body;

    try {
        let invoice = await Invoice.findById(req.params.id);

        if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

        // Make sure user owns invoice
        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const newPayment = {
            amount,
            date,
            method,
            note
        };

        invoice.payments.unshift(newPayment);

        // Update Status Logic
        const totalPaid = invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
        if (totalPaid >= invoice.total) {
            invoice.status = 'Paid';
        } else {
            // invoice.status = 'Partial'; // Keeping it simple for now as requested
            // Actually, if it's not fully paid, it should technically be 'Pending' or 'Overdue' depending on date.
            // We won't change it back to Pending if it's Overdue, but if it was Pending it stays Pending.
            // If we overpay, it stays Paid.
            // If we revert a payment (not implemented yet), we might need to recalc.
            if (invoice.status === 'Paid' && totalPaid < invoice.total) {
                invoice.status = 'Pending';
            }
        }

        await invoice.save();

        // Send Payment Receipt Email
        try {
            console.log('Sending Payment Receipt Email...');
            const transporter = require('nodemailer').createTransport({
                service: process.env.EMAIL_SERVICE,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const balanceDue = invoice.total - totalPaid;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: invoice.clientEmail,
                subject: `Payment Receipt - ${invoice.businessName || 'Us'}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                        <h2 style="color: #333;">Payment Received</h2>
                        <p>Dear ${invoice.clientName},</p>
                        <p>We have received a payment of <strong>${invoice.currency} ${amount}</strong> for your invoice.</p>
                        
                        <div style="background: #f4f4f4; padding: 15px; margin: 20px 0;">
                            <p><strong>Payment Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                            <p><strong>Payment Method:</strong> ${method}</p>
                            <p><strong>Transaction Note:</strong> ${note || 'N/A'}</p>
                            <hr>
                            <p><strong>Invoice Total:</strong> ${invoice.currency} ${invoice.total}</p>
                            <p><strong>Total Paid:</strong> ${invoice.currency} ${totalPaid}</p>
                            <h3 style="color: #dc3545;">Balance Due: ${invoice.currency} ${balanceDue.toFixed(2)}</h3>
                        </div>

                        <p>Thank you for your business!</p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending payment receipt:', error);
                } else {
                    console.log('Payment receipt sent: ' + info.response);
                }
            });
        } catch (emailErr) {
            console.error('Email service failed', emailErr);
        }

        res.json(invoice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/invoices/:id/send
// @desc    Send invoice via email
// @access  Private
router.post('/:id/send', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

        // Make sure user owns invoice
        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const transporter = require('nodemailer').createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const itemsHtml = invoice.items.map(item => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.description}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${invoice.currency} ${item.price}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${invoice.currency} ${item.quantity * item.price}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: invoice.clientEmail,
            subject: `Invoice from ${invoice.businessName || 'Us'} - Due: ${new Date(invoice.dueDate).toLocaleDateString()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                    <h2 style="color: #333;">Invoice Details</h2>
                    <p>Dear ${invoice.clientName},</p>
                    <p>Please find below the details of your invoice from <strong>${invoice.businessName || 'Us'}</strong>.</p>
                    
                    <div style="background: #f4f4f4; padding: 15px; margin: 20px 0;">
                        <p><strong>Invoice Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
                        <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Status:</strong> ${invoice.status}</p>
                        <h3 style="color: #28a745;">Total Amount: ${invoice.currency} ${invoice.total}</h3>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background: #333; color: #fff;">
                                <th style="padding: 10px; border: 1px solid #ddd;">Item</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Qty</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Price</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <p style="margin-top: 20px;">Please make the payment by the due date to avoid any late fees.</p>
                    <p>Thank you for your business!</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ msg: 'Error sending email' });
            } else {
                console.log('Email sent: ' + info.response);
                res.json({ msg: 'Invoice sent to email' });
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
