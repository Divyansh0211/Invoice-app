require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Invoice = require('./models/Invoice');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Expense = require('./models/Expense');
const Staff = require('./models/Staff');

const migrateData = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Starting migration...');

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            // Check if user already has a workspace to avoid duplicates if run multiple times
            if (user.workspaces && user.workspaces.length > 0) {
                console.log(`User ${user.email} already mapped. Skipping...`);
                continue;
            }

            console.log(`Migrating data for user: ${user.email}...`);

            // 1. Create a Workspace for the user
            const workspaceName = user.businessName || `${user.name}'s Workspace`;
            const workspace = new Workspace({
                name: workspaceName,
                owner: user._id,
                plan: 'Free'
            });
            await workspace.save();

            // 2. Link Workspace to User
            user.workspaces = [{
                workspace: workspace._id,
                role: 'Owner'
            }];
            user.activeWorkspace = workspace._id;
            await user.save();

            // 3. Migrate Invoices
            const invoices = await Invoice.find({ user: user._id });
            for (const inv of invoices) {
                inv.workspace = workspace._id;
                await inv.save();
            }
            console.log(`  - Migrated ${invoices.length} invoices`);

            // 4. Migrate Customers
            const customers = await Customer.find({ user: user._id });
            for (const cust of customers) {
                cust.workspace = workspace._id;
                await cust.save();
            }
            console.log(`  - Migrated ${customers.length} customers`);

            // 5. Migrate Products
            const products = await Product.find({ user: user._id });
            for (const prod of products) {
                prod.workspace = workspace._id;
                await prod.save();
            }
            console.log(`  - Migrated ${products.length} products`);

            // 6. Migrate Expenses
            const expenses = await Expense.find({ user: user._id });
            for (const exp of expenses) {
                exp.workspace = workspace._id;
                await exp.save();
            }
            console.log(`  - Migrated ${expenses.length} expenses`);

            // 7. Migrate Staff
            const staff = await Staff.find({ user: user._id });
            for (const s of staff) {
                s.workspace = workspace._id;
                await s.save();
            }
            console.log(`  - Migrated ${staff.length} staff`);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateData();
