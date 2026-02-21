const jwt = require('jsonwebtoken');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        // Fetch user to get their active workspace context
        const User = require('../models/User');
        const userDoc = await User.findById(req.user.id);
        if (userDoc && userDoc.activeWorkspace) {
            req.workspaceId = userDoc.activeWorkspace;
        }

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
