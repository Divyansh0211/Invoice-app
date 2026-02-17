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

router.get('/advanced', auth, async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id });

        // Pending Customers (Group by clientName)
        const pendingCustomersMap = {};

        // Partial Payments & Overdue
        const partialInvoices = [];
        const overdueInvoices = [];
        const dueInvoices = []; // For sorting by due date

        const now = new Date();

        invoices.forEach(inv => {
            const total = inv.total;
            const paid = inv.payments ? inv.payments.reduce((acc, pay) => acc + pay.amount, 0) : 0;
            const pending = total - paid;

            // Pending Customers Logic
            if (pending > 0) {
                if (!pendingCustomersMap[inv.clientName]) {
                    pendingCustomersMap[inv.clientName] = {
                        name: inv.clientName,
                        totalPending: 0,
                        count: 0
                    };
                }
                pendingCustomersMap[inv.clientName].totalPending += pending;
                pendingCustomersMap[inv.clientName].count += 1;

                // Add to dueInvoices for sorting
                dueInvoices.push({
                    ...inv.toObject(),
                    pendingAmount: pending
                });
            }

            // Partial Logic
            if (paid > 0 && paid < total) {
                partialInvoices.push({
                    ...inv.toObject(),
                    paidAmount: paid,
                    pendingAmount: pending
                });
            }

            // Overdue Logic
            if (pending > 0 && inv.dueDate && new Date(inv.dueDate) < now) {
                overdueInvoices.push({
                    ...inv.toObject(),
                    pendingAmount: pending,
                    daysOverdue: Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
                });
            }
        });

        const pendingCustomers = Object.values(pendingCustomersMap).sort((a, b) => b.totalPending - a.totalPending);

        // Sort due invoices by date (oldest first)
        dueInvoices.sort((a, b) => {
            if (!a.dueDate) return 1; // No due date goes to bottom
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        res.json({
            pendingCustomers,
            partialInvoices,
            overdueInvoices,
            dueInvoices
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
