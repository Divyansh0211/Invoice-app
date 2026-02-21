const mongoose = require('mongoose');

const RecurringInvoiceSchema = new mongoose.Schema({
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    frequency: { type: String, required: true }, // cron expression or enum like 'daily','weekly','monthly'
    nextRun: { type: Date, required: true },
    status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
    templateId: { type: mongoose.Schema.Types.ObjectId }, // optional reference to a template invoice
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

// Helper to calculate next run based on frequency (simple example)
RecurringInvoiceSchema.methods.scheduleNext = function () {
    const now = new Date();
    // Very basic handling – in real code use a library like cron-parser
    if (this.frequency === 'daily') {
        this.nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (this.frequency === 'weekly') {
        this.nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (this.frequency === 'monthly') {
        const next = new Date(now);
        next.setMonth(next.getMonth() + 1);
        this.nextRun = next;
    }
};

module.exports = mongoose.model('RecurringInvoice', RecurringInvoiceSchema);
