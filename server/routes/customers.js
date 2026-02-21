const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Customer = require('../models/Customer');

// @route   GET api/customers
// @desc    Get all users customers
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const customers = await Customer.find({ workspace: req.workspaceId }).sort({ date: -1 });
        res.json(customers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/customers
// @desc    Add new customer
// @access  Private (Owner/Admin)
router.post('/', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    const { name, email, gst, address } = req.body;

    try {
        const newCustomer = new Customer({
            name,
            email,
            gst,
            address,
            user: req.user.id,
            workspace: req.workspaceId
        });

        const customer = await newCustomer.save();
        res.json(customer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/customers/:id
// @desc    Update customer
// @access  Private (Owner/Admin)
router.put('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    const { name, email, gst, address } = req.body;

    // Build customer object
    const customerFields = {};
    if (name) customerFields.name = name;
    if (email) customerFields.email = email;
    if (gst) customerFields.gst = gst;
    if (address) customerFields.address = address;

    try {
        let customer = await Customer.findById(req.params.id);

        if (!customer) return res.status(404).json({ msg: 'Customer not found' });

        // Make sure user owns customer in workspace
        if (customer.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { $set: customerFields },
            { returnDocument: 'after' }
        );

        res.json(customer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/customers/:id
// @desc    Delete customer
// @access  Private (Owner/Admin)
router.delete('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        let customer = await Customer.findById(req.params.id);

        if (!customer) return res.status(404).json({ msg: 'Customer not found' });

        // Make sure user owns customer in workspace
        if (customer.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Customer.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Customer removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
