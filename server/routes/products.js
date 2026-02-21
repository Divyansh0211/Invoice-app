const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Product = require('../models/Product');

// @route   GET api/products
// @desc    Get all users products
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const products = await Product.find({ workspace: req.workspaceId }).sort({ date: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/products
// @desc    Add new product
// @access  Private (Owner/Admin)
router.post('/', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    const { name, description, price, productClass, quantity } = req.body;

    try {
        const newProduct = new Product({
            name,
            description,
            price,
            productClass,
            quantity,
            user: req.user.id,
            workspace: req.workspaceId
        });

        const product = await newProduct.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/products/:id
// @desc    Update product
// @access  Private (Owner/Admin)
router.put('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    const { name, description, price, productClass, quantity } = req.body;

    // Build product object
    const productFields = {};
    if (name) productFields.name = name;
    if (description) productFields.description = description;
    if (price) productFields.price = price;
    if (productClass) productFields.productClass = productClass;
    if (quantity !== undefined) productFields.quantity = quantity;

    try {
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ msg: 'Product not found' });

        // Make sure user owns product in workspace
        if (product.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: productFields },
            { returnDocument: 'after' }
        );

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/products/:id
// @desc    Delete product
// @access  Private (Owner/Admin)
router.delete('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ msg: 'Product not found' });

        // Make sure user owns product in workspace
        if (product.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Product removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
