const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Estimate = require('../models/Estimate');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const nodemailer = require('nodemailer');

// @route   GET api/estimates
// @desc    Get all active workspace estimates
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        if (!req.workspaceId) {
            return res.status(400).json({ msg: 'No active workspace selected' });
        }

        const estimates = await Estimate.find({ workspace: req.workspaceId })
            .populate('customer', ['name', 'email'])
            .sort({ date: -1 });

        res.json(estimates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/estimates/:id
// @desc    Get estimate by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const estimate = await Estimate.findById(req.params.id)
            .populate('customer')
            .populate('items.product');

        if (!estimate) {
            return res.status(404).json({ msg: 'Estimate not found' });
        }

        // Make sure user is in the correct workspace
        if (estimate.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(estimate);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Estimate not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/estimates
// @desc    Create an estimate
// @access  Private
router.post('/', [auth, checkRole(['Owner', 'Admin', 'Staff'])], async (req, res) => {
    const {
        customer,
        estimateNumber,
        date,
        expiryDate,
        items,
        notes,
        status,
        subTotal,
        taxAmount,
        totalAmount
    } = req.body;

    try {
        if (!req.workspaceId) {
            return res.status(400).json({ msg: 'No active workspace selected' });
        }

        const newEstimate = new Estimate({
            workspace: req.workspaceId,
            customer,
            estimateNumber,
            date,
            expiryDate,
            items,
            notes,
            status: status || 'Draft',
            subTotal,
            taxAmount,
            totalAmount
        });

        const estimate = await newEstimate.save();
        res.json(estimate);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/estimates/:id
// @desc    Update estimate
// @access  Private
router.put('/:id', [auth, checkRole(['Owner', 'Admin', 'Staff'])], async (req, res) => {
    try {
        let estimate = await Estimate.findById(req.params.id);

        if (!estimate) {
            return res.status(404).json({ msg: 'Estimate not found' });
        }

        if (estimate.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        estimate = await Estimate.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(estimate);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/estimates/:id
// @desc    Delete estimate
// @access  Private
router.delete('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        const estimate = await Estimate.findById(req.params.id);

        if (!estimate) {
            return res.status(404).json({ msg: 'Estimate not found' });
        }

        if (estimate.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await estimate.deleteOne();

        res.json({ msg: 'Estimate removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Estimate not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/estimates/:id/convert
// @desc    Convert an Approved Estimate to an Invoice
// @access  Private
router.post('/:id/convert', [auth, checkRole(['Owner', 'Admin', 'Staff'])], async (req, res) => {
    try {
        const estimate = await Estimate.findById(req.params.id);

        if (!estimate) {
            return res.status(404).json({ msg: 'Estimate not found' });
        }

        if (estimate.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (estimate.status !== 'Approved') {
            return res.status(400).json({ msg: 'Only approved estimates can be converted to invoices' });
        }

        if (estimate.linkedInvoice) {
            return res.status(400).json({ msg: 'Estimate already converted' });
        }

        // Inventory deduction logic mimicking the Invoice Creation
        for (let item of estimate.items) {
            if (item.product) {
                const productToUpdate = await Product.findById(item.product);
                if (productToUpdate) {
                    if (productToUpdate.quantity >= item.quantity) {
                        productToUpdate.quantity -= item.quantity;
                        await productToUpdate.save();
                    } else {
                        return res.status(400).json({ msg: `Insufficient stock for product. Available: ${productToUpdate.quantity}, Requested: ${item.quantity}` });
                    }
                }
            }
        }

        // Generate a new invoice based on estimate data
        const newInvoiceNumber = 'INV-' + Date.now(); // simplistic generator, should probably retrieve real preferences later

        const newInvoice = new Invoice({
            workspace: estimate.workspace,
            customer: estimate.customer,
            invoiceNumber: newInvoiceNumber,
            date: Date.now(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
            items: estimate.items,
            notes: estimate.notes || 'Generated from Estimate ' + estimate.estimateNumber,
            subTotal: estimate.subTotal,
            taxAmount: estimate.taxAmount,
            totalAmount: estimate.totalAmount,
            status: 'Unpaid'
        });

        const invoice = await newInvoice.save();

        // Update estimate status
        estimate.status = 'Converted';
        estimate.linkedInvoice = invoice._id;
        await estimate.save();

        res.json({ estimate, invoice });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/estimates/:id/send
// @desc    Send estimate via email
// @access  Private
router.post('/:id/send', [auth, checkRole(['Owner', 'Admin', 'Staff'])], async (req, res) => {
    try {
        const estimate = await Estimate.findById(req.params.id).populate('customer');

        if (!estimate) {
            return res.status(404).json({ msg: 'Estimate not found' });
        }

        if (estimate.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: estimate.customer.email,
            subject: `Estimate ${estimate.estimateNumber} from Our Company`,
            html: `
                <h3>Hello ${estimate.customer.name},</h3>
                <p>Please find attached your estimate <strong>${estimate.estimateNumber}</strong> for the amount of <strong>$${estimate.totalAmount.toFixed(2)}</strong>.</p>
                <p>Thank you for considering our services.</p>
            `,
            // Depending on frontend architecture we could generate a PDF here or link to a portal
        };

        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ msg: 'Error sending email' });
            } else {
                console.log('Email sent: ' + info.response);
                estimate.status = 'Sent';
                await estimate.save();
                res.json(estimate);
            }
        });

    } catch (err) {
        console.error('Send estimate email error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
