const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @route   POST api/subscriptions/create-checkout-session
// @desc    Create a Stripe Checkout session to upgrade to Pro
// @access  Private
router.post('/create-checkout-session', auth, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.workspaceId);

        if (!workspace) {
            return res.status(404).json({ msg: 'Workspace not found' });
        }

        // Make sure user is owner or admin to subscribe
        const user = await User.findById(req.user.id);
        const userWorkspace = user.workspaces.find(w => w.workspace.toString() === req.workspaceId.toString());

        if (!userWorkspace || (userWorkspace.role !== 'Owner' && userWorkspace.role !== 'Admin')) {
            return res.status(401).json({ msg: 'Not authorized to change subscription' });
        }

        // Create or get the Stripe Customer
        let customerId = workspace.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: req.user.email,
                name: workspace.name,
                metadata: {
                    workspaceId: workspace._id.toString()
                }
            });
            customerId = customer.id;
            workspace.stripeCustomerId = customerId;
            await workspace.save();
        }

        // Create the checkout session
        // Note: Replace the price ID with your actual product price ID from Stripe dashboard
        // Currently using a dummy price for structural purposes.
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: 'price_dummy_123', // TODO: Add real price ID from environment
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/settings`,
            metadata: {
                workspaceId: workspace._id.toString()
            }
        });

        res.json({ id: session.id, url: session.url });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/subscriptions/webhook
// @desc    Stripe webhook endpoint
// @access  Public (Webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Retrieve the subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const workspaceId = session.metadata.workspaceId;

        // Update the workspace in the database
        const workspace = await Workspace.findById(workspaceId);
        if (workspace) {
            workspace.plan = 'Pro';
            workspace.status = 'active';
            workspace.stripeSubscriptionId = subscription.id;
            await workspace.save();
        }
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        const workspace = await Workspace.findOne({ stripeSubscriptionId: subscription.id });

        if (workspace) {
            if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
                workspace.plan = 'Free';
                workspace.status = 'canceled';
            } else {
                workspace.status = subscription.status; // e.g. 'active', 'past_due'
            }
            await workspace.save();
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
});

// @route   POST api/subscriptions/customer-portal
// @desc    Create a Stripe customer portal session
// @access  Private
router.post('/customer-portal', auth, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.workspaceId);

        if (!workspace || !workspace.stripeCustomerId) {
            return res.status(400).json({ msg: 'No active subscription found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: workspace.stripeCustomerId,
            return_url: `${req.headers.origin}/settings`,
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
