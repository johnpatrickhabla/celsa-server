/**
 * Middleware factory: restrict route to users with specific roles.
 * Must be used AFTER verifyToken (which attaches req.user).
 *
 * Usage: router.get("/admin-only", verifyToken, requireRole("admin"), handler)
 *        router.get("/staff-or-admin", verifyToken, requireRole("admin", "staff"), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden — insufficient permissions",
      });
    }

    next();
  };
}

module.exports = requireRole;
