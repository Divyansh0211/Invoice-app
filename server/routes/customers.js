const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Customer = require('../models/Customer');

// @route   GET api/customers
// @desc    Get all users customers
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const customers = await Customer.find({ user: req.user.id }).sort({ date: -1 });
        res.json(customers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/customers
// @desc    Add new customer
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, email, gst, address } = req.body;

    try {
        const newCustomer = new Customer({
            name,
            email,
            gst,
            address,
            user: req.user.id
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
// @access  Private
router.put('/:id', auth, async (req, res) => {
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

        // Make sure user owns customer
        if (customer.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { $set: customerFields },
            { new: true }
        );

        res.json(customer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/customers/:id
// @desc    Delete customer
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        let customer = await Customer.findById(req.params.id);

        if (!customer) return res.status(404).json({ msg: 'Customer not found' });

        // Make sure user owns customer
        if (customer.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Customer.findByIdAndRemove(req.params.id);

        res.json({ msg: 'Customer removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
