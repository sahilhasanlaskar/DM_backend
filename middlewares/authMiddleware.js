const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/userModel'); // Make sure you import the User model

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decodedToken = token.split(' ')[1]; // Extract token after 'Bearer '
        const decoded = jwt.verify(decodedToken, process.env.JWT_SECRET);
        
        // Fetch the user by their ID and attach the full user object to req.user
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        req.user = user; // Set the full user object to req.user
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
