const cron = require('node-cron');
const RecurringInvoice = require('../models/RecurringInvoice');
const Invoice = require('../models/Invoice');
const mongoose = require('mongoose');

// Run every minute
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const recs = await RecurringInvoice.find({ nextRun: { $lte: now }, status: 'active' }).populate('items.product');
        for (const rec of recs) {
            // Build invoice items
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
                createdBy: rec.createdBy
            });
            await newInvoice.save();
            // Schedule next run
            rec.scheduleNext();
            await rec.save();
            console.log(`Generated recurring invoice ${newInvoice._id} for template ${rec._id}`);
        }
    } catch (err) {
        console.error('Error in recurring invoice cron job:', err);
    }
});

module.exports = cron;
