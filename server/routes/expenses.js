const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Expense = require('../models/Expense');

// @route   GET api/expenses
// @desc    Get all users expenses
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ workspace: req.workspaceId }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/expenses
// @desc    Add new expense
// @access  Private (Owner/Admin)
router.post('/', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    const { amount, category, description, date } = req.body;

    try {
        const newExpense = new Expense({
            amount,
            category,
            description,
            date,
            user: req.user.id,
            workspace: req.workspaceId
        });

        const expense = await newExpense.save();
        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/expenses/:id
// @desc    Delete expense
// @access  Private (Owner/Admin)
router.delete('/:id', [auth, checkRole(['Owner', 'Admin'])], async (req, res) => {
    try {
        let expense = await Expense.findById(req.params.id);

        if (!expense) return res.status(404).json({ msg: 'Expense not found' });

        // Make sure user owns workspace expense
        if (expense.workspace.toString() !== req.workspaceId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Expense.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Expense removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
