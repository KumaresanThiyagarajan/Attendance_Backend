import authMiddleware from './authMiddleware.js';

// Middleware to check if user is admin (must be used after authMiddleware)
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Combined middleware: authenticate first, then check admin
export const requireAdmin = [authMiddleware, isAdmin];

export default isAdmin;
