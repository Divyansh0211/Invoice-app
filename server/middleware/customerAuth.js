const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Make sure it's a customer token
        if (!decoded.customer) {
            return res.status(401).json({ msg: 'Token is not valid for customer portal' });
        }

        req.customer = decoded.customer;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
