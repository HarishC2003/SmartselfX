export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
        yourRole: req.user.role
      })
    }
    next()
  }
}

// Convenience shortcuts
export const adminOnly     = requireRole('ADMIN')
export const managerOnly   = requireRole('MANAGER')
export const adminOrManager = requireRole('ADMIN', 'MANAGER')
export const vendorOnly    = requireRole('VENDOR')
export const allRoles      = requireRole('ADMIN', 'MANAGER', 'VENDOR')
