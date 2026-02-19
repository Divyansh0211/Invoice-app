const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    receipt: {
        type: String // URL or path to uploaded receipt (optional for now)
    }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
