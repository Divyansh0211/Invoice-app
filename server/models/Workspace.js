const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stripeCustomerId: {
        type: String
    },
    stripeSubscriptionId: {
        type: String
    },
    plan: {
        type: String,
        enum: ['Free', 'Pro'],
        default: 'Free'
    },
    status: {
        type: String,
        enum: ['active', 'past_due', 'canceled', 'incomplete'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
