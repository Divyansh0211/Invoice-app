const express = require('express');
const router = express.Router();
const RecurringInvoice = require('../models/RecurringInvoice');
const Invoice = require('../models/Invoice'); // assuming existing Invoice model
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// GET all recurring invoices for workspace
router.get('/', auth, async (req, res) => {
    try {
        const invoices = await RecurringInvoice.find({ workspace: req.workspace.id });
        res.json(invoices);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// CREATE a new recurring invoice template
router.post('/', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        const { customer, items, frequency, nextRun } = req.body;
        const newRec = new RecurringInvoice({
            workspace: req.workspace.id,
            customer,
            items,
            frequency,
            nextRun,
            createdBy: req.user.id
        });
        await newRec.save();
        res.json(newRec);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// UPDATE a recurring invoice template
router.put('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        const rec = await RecurringInvoice.findById(req.params.id);
        if (!rec) return res.status(404).json({ msg: 'Not found' });
        Object.assign(rec, req.body);
        await rec.save();
        res.json(rec);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// DELETE a recurring invoice template
router.delete('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        await RecurringInvoice.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Manually trigger generation of an invoice now
router.post('/:id/run', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        const rec = await RecurringInvoice.findById(req.params.id).populate('items.product');
        if (!rec) return res.status(404).json({ msg: 'Not found' });
        // Build invoice data
        const invoiceItems = rec.items.map(i => ({
            product: i.product._id,
            quantity: i.quantity,
            price: i.price
        }));
        const newInvoice = new Invoice({
            workspace: rec.workspace,
            customer: rec.customer,
            items: invoiceItems,
            status: 'Pending',
            createdBy: req.user.id
        });
        await newInvoice.save();
        // Update nextRun
        rec.scheduleNext();
        await rec.save();
        res.json(newInvoice);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
