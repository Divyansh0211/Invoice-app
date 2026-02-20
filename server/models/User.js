const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    phoneNumber: {
        type: String
    },
    address: {
        type: String
    },
    businessName: {
        type: String
    },
    website: {
        type: String
    },
    logoUrl: {
        type: String
    },
    panNumber: {
        type: String
    },
    bankDetails: {
        accountNo: { type: String, default: '' },
        ifsc: { type: String, default: '' },
        upiId: { type: String, default: '' }
    },
    settings: {
        currency: {
            type: String,
            default: 'USD'
        },
        themeColor: {
            type: String,
            default: '#6a1b9a'
        },
        taxRate: {
            type: Number,
            default: 0
        },
        themeMode: {
            type: String,
            default: 'light'
        },
        enableTax: {
            type: Boolean,
            default: true
        },
        taxType: {
            type: String,
            default: 'GST'
        },
        decimalPrecision: {
            type: Number,
            default: 2
        },
        invoicePrefix: {
            type: String,
            default: 'INV-'
        },
        autoIncrement: {
            type: Boolean,
            default: true
        },
        nextInvoiceNumber: {
            type: Number,
            default: 1
        },
        defaultDueDays: {
            type: Number,
            default: 7
        },
        termsAndConditions: {
            type: String,
            default: 'Payment is due within {defaultDueDays} days. Please make checks payable to our company.'
        },
        signatureUrl: {
            type: String,
            default: ''
        }
    },
    productClasses: {
        type: [String],
        default: []
    },
    twoFactorSecret: {
        type: Object
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', UserSchema);
