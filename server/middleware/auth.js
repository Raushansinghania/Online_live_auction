const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.replace(/bearer /i, ''); // handles Bearer or bearer

        if (!token) {
            return res.status(401).json({ error: 'Invalid token format' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.id;  // Attach userId for route access
        req.user = { id: decoded.id }; // Attach req.user object for compatibility
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Please authenticate.' });
    }
};

module.exports = auth;
