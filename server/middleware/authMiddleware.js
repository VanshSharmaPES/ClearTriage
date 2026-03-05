const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cleartriage-secret-key-change-in-production';

/**
 * Verify JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

/**
 * Check if user has one of the allowed roles.
 * Must be used AFTER authenticate middleware.
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}.` });
        }
        next();
    };
}

module.exports = { authenticate, authorize, JWT_SECRET };
