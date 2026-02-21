const Workspace = require('../models/Workspace');
const User = require('../models/User');

// Middleware to check if user has required role in the active workspace
// roles allowed: 'Owner', 'Admin', 'Staff'
const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.workspaceId) {
                return res.status(401).json({ msg: 'No active workspace selected' });
            }

            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(401).json({ msg: 'User not found' });
            }

            const workspaceContext = user.workspaces.find(
                w => w.workspace.toString() === req.workspaceId.toString()
            );

            if (!workspaceContext) {
                return res.status(403).json({ msg: 'You do not have access to this workspace' });
            }

            if (!allowedRoles.includes(workspaceContext.role)) {
                return res.status(403).json({
                    msg: `Access denied. Requires one of: ${allowedRoles.join(', ')}`
                });
            }

            // Attach role to request for further use if needed
            req.workspaceRole = workspaceContext.role;
            next();

        } catch (err) {
            console.error('Role check error:', err);
            res.status(500).send('Server Error');
        }
    };
};

module.exports = checkRole;
