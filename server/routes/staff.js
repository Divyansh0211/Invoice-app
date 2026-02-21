const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Staff = require('../models/Staff');
const nodemailer = require('nodemailer'); // Reusing nodemailer

// @route   GET api/staff
// @desc    Get all staff
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Find staff created by specific user or all staff? Usually staff is org-wide or per user. 
        // Assuming per user for now based on auth middleware usage in other routes
        const staff = await Staff.find({ workspace: req.workspaceId }).sort({ createdAt: -1 });
        res.json(staff);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/staff
// @desc    Add new staff
// @access  Private (Owner/Admin)
router.post('/', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    const { name, email, role } = req.body;

    try {
        const newStaff = new Staff({
            name,
            email,
            role,
            user: req.user.id,
            workspace: req.workspaceId
        });

        const staff = await newStaff.save();
        res.json(staff);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/staff/:id
// @desc    Delete staff
// @access  Private (Owner/Admin)
router.delete('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        let staff = await Staff.findById(req.params.id);

        if (!staff) return res.status(404).json({ msg: 'Staff not found' });

        // Make sure user owns workspace staff
        if (staff.workspace.toString() !== req.workspaceId.toString() && staff.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Staff.findByIdAndRemove(req.params.id);

        res.json({ msg: 'Staff removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/staff/send-email
// @desc    Send email to staff
// @access  Private (Owner/Admin)
router.post('/send-email', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    const { subject, message, recipients } = req.body;

    if (!recipients || recipients.length === 0) {
        return res.status(400).json({ msg: 'No recipients selected' });
    }

    try {
        // Reuse email config from env (verified in previous tasks)
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipients.join(', '), // Send to all recipients
            subject: subject,
            text: message
        };

        await transporter.sendMail(mailOptions);

        res.json({ msg: 'Email sent successfully' });
    } catch (err) {
        console.error('Email send error:', err);
        res.status(500).json({ msg: 'Failed to send email' });
    }
});

module.exports = router;
