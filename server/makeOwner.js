require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Workspace = require('./models/Workspace');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const user = await User.findOne({ email: 'divyanshdogra5881@gmail.com' });
    if (!user) {
        console.log("User not found!");
        process.exit(1);
    }

    let needsSave = false;

    if (user.workspaces.length > 0) {
        user.workspaces.forEach(w => {
            w.role = 'Owner';
        });
        needsSave = true;
    } else {
        console.log("User has no workspaces! Creating one...");
        const newWorkspace = new Workspace({
            name: `${user.name}'s Workspace`,
            owner: user._id
        });
        await newWorkspace.save();
        user.workspaces.push({ workspace: newWorkspace._id, role: 'Owner' });
        needsSave = true;
    }

    if (!user.activeWorkspace && user.workspaces.length > 0) {
        console.log("Setting activeWorkspace...");
        user.activeWorkspace = user.workspaces[0].workspace;
        needsSave = true;
    } else if (user.activeWorkspace) {
        console.log("User activeWorkspace is already set to:", user.activeWorkspace);
    }

    if (needsSave) {
        await user.save();
        console.log("Successfully updated user to Owner and ensured activeWorkspace is set.");
    } else {
        console.log("No changes needed.");
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
