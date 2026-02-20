const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    clientName: {
        type: String,
        required: true
    },
    clientEmail: {
        type: String,
        required: true
    },
    businessName: {
        type: String
    },
    businessGST: {
        type: String
    },
    clientGST: {
        type: String
    },
    gstRate: {
        type: Number,
        default: 0
    },
    discountRate: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    invoiceNumber: {
        type: String
    },
    termsAndConditions: {
        type: String
    },
    logoUrl: {
        type: String
    },
    signatureUrl: {
        type: String
    },
    bankDetails: {
        accountNo: String,
        ifsc: String,
        upiId: String
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            description: String,
            quantity: Number,
            price: Number
        }
    ],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Overdue'],
        default: 'Pending'
    },
    payments: [
        {
            amount: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            },
            method: {
                type: String
            },
            note: {
                type: String
            }
        }
    ],
    dueDate: {
        type: Date
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
