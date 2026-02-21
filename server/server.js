const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Webhook route needs raw body for Stripe signature verification
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), require('./routes/subscriptions'));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/recurring-invoices', require('./routes/recurringInvoices'));
app.use('/api/portal', require('./routes/portal'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
