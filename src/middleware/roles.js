const { ROLES } = require('../models/User');

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === ROLES.ADMIN) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
};

const requireUser = (req, res, next) => {
  if (req.user && req.user.role === ROLES.USER) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Voter role required.' });
};

module.exports = { requireAdmin, requireUser };
