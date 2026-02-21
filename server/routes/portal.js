const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Estimate = require('../models/Estimate');
const Workspace = require('../models/Workspace');
const customerAuth = require('../middleware/customerAuth');

// @route   POST api/portal/request-link
// @desc    Request a magic link for customer portal
// @access  Public
router.post('/request-link', async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ msg: 'Please provide an email address' });
        }

        // We find all customers with this email (might be in multiple workspaces)
        // For simplicity, we'll generate a token for the first one found, or provide a way to select.
        // Usually, the magic link allows access to all their records across all workspaces they belong to.
        const customers = await Customer.find({ email });

        if (customers.length === 0) {
            return res.status(404).json({ msg: 'No customer found with this email' });
        }

        // Generate a random token
        const buffer = crypto.randomBytes(32);
        const token = buffer.toString('hex');
        const tokenExpiry = Date.now() + 3600000; // 1 hour

        // Update all customer profiles sharing this email with the same token
        await Customer.updateMany(
            { email },
            { $set: { portalToken: token, portalTokenExpires: tokenExpiry } }
        );

        // Send Email
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // The URL needs to match the frontend portal verification route
        const portalUrl = `http://localhost:5173/portal/verify/${token}`; // TODO: Use env variable for frontend URL

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Client Portal Access Link',
            html: `
                <h3>Hello,</h3>
                <p>You requested access to the client portal. Click the link below to securely log in:</p>
                <a href="${portalUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Access Portal</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ msg: 'Email could not be sent' });
            } else {
                res.json({ msg: 'Magic link sent to your email' });
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/portal/verify/:token
// @desc    Verify portal token and return JWT
// @access  Public
router.post('/verify/:token', async (req, res) => {
    try {
        const token = req.params.token;

        const customers = await Customer.find({
            portalToken: token,
            portalTokenExpires: { $gt: Date.now() }
        });

        if (customers.length === 0) {
            return res.status(400).json({ msg: 'Invalid or expired token' });
        }

        // We will issue a JWT that contains the email
        // This email will be used to fetch records linked to this customer email across the system
        const payload = {
            customer: {
                email: customers[0].email,
                ids: customers.map(c => c._id) // specific database IDs mapped to this email
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 * 24 * 7 }, // 7 days
            async (err, jwtToken) => {
                if (err) throw err;

                // Clear the one-time tokens
                await Customer.updateMany(
                    { email: customers[0].email },
                    { $unset: { portalToken: 1, portalTokenExpires: 1 } }
                );

                res.json({ token: jwtToken, email: customers[0].email });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/portal/me
// @desc    Get portal user summary
// @access  Private (Customer)
router.get('/me', customerAuth, async (req, res) => {
    try {
        const customerEmail = req.customer.email;
        res.json({ email: customerEmail });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/portal/invoices
// @desc    Get all invoices for this customer
// @access  Private (Customer)
router.get('/invoices', customerAuth, async (req, res) => {
    try {
        const customerIds = req.customer.ids;

        // Fetch all invoices associated with any of the customer's IDs
        const invoices = await Invoice.find({ customer: { $in: customerIds } })
            .select('-__v')
            .sort({ date: -1 });

        // Optionally, populate workspace details (like business name of the issuer)
        // If we want the customer to see who sent the invoice 
        // We'd have to look up the User's business name or Workspace name
        // For now returning basic invoice data is good enough.

        res.json(invoices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/portal/estimates
// @desc    Get all estimates for this customer
// @access  Private (Customer)
router.get('/estimates', customerAuth, async (req, res) => {
    try {
        const customerIds = req.customer.ids;

        const estimates = await Estimate.find({ customer: { $in: customerIds } })
            .select('-__v')
            .sort({ date: -1 });

        res.json(estimates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/portal/invoices/:id
// @desc    Get specific invoice details for this customer
// @access  Private (Customer)
router.get('/invoices/:id', customerAuth, async (req, res) => {
    try {
        const customerIds = req.customer.ids;
        const invoice = await Invoice.findOne({ _id: req.params.id, customer: { $in: customerIds } });

        if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

        res.json(invoice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
