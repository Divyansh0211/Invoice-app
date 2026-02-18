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
        }
    },
    productClasses: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('User', UserSchema);
