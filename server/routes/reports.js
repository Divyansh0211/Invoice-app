const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @route   GET api/reports/dashboard-stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard-stats', auth, async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id });
        const customersCount = await Customer.countDocuments({ user: req.user.id });
        const productsCount = await Product.countDocuments({ user: req.user.id });

        const totalSales = invoices.reduce((acc, inv) => acc + inv.total, 0);
        let totalPaid = 0;

        invoices.forEach(inv => {
            if (inv.payments) {
                totalPaid += inv.payments.reduce((pAcc, pay) => pAcc + pay.amount, 0);
            }
        });

        const totalPending = totalSales - totalPaid;
        const totalInvoices = invoices.length;

        res.json({
            totalSales,
            totalPaid,
            totalPending,
            totalInvoices,
            customersCount,
            productsCount
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
