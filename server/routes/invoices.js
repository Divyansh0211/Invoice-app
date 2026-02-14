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
    const { clientName, clientEmail, businessName, items, total, status } = req.body;

    try {
        const newInvoice = new Invoice({
            clientName,
            clientEmail,
            businessName,
            items,
            total,
            status,
            user: req.user.id
        });

        const invoice = await newInvoice.save();
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
    const { clientName, clientEmail, businessName, items, total, status } = req.body;

    // Build invoice object
    const invoiceFields = {};
    if (clientName) invoiceFields.clientName = clientName;
    if (clientEmail) invoiceFields.clientEmail = clientEmail;
    if (businessName) invoiceFields.businessName = businessName;
    if (items) invoiceFields.items = items;
    if (total) invoiceFields.total = total;
    if (status) invoiceFields.status = status;

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
            { new: true }
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

        await Invoice.findByIdAndRemove(req.params.id);

        res.json({ msg: 'Invoice removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
