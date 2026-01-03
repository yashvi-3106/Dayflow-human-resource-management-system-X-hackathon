// @desc   Block access if user is on first login
// @usage  Apply after 'protect' middleware
const firstLoginGuard = (req, res, next) => {
    if (req.user && req.user.isFirstLogin) {
        return res.status(403).json({
            success: false,
            message: 'Access Denied: You must change your password before proceeding.',
            error_code: 'FORCE_PASSWORD_CHANGE'
        });
    }
    next();
};

module.exports = { firstLoginGuard };
