const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Re-check DB connection state for Vercel
            if (User.db.readyState === 0) {
                console.log('⚠️ AuthMiddleware: DB disconnected. Reconnecting...');
                // In serverless, this might rely on the global connection buffer or need explicit reconnect.
                // For now, we rely on the buffer but log it.
            }

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.log('❌ AuthMiddleware: User NOT found in DB for ID:', decoded.id);
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }
            console.log('✅ AuthMiddleware: User Authenticated:', req.user.email);

            next();
        } catch (error) {
            console.error('❌ AuthMiddleware Error:', error.message);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
