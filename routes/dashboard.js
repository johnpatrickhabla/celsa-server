const express = require("express");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

// Admin dashboard summary
router.get(
  "/admin/summary",
  verifyToken,
  requireRole("admin"),
  dashboardController.adminSummary
);

// Admin reports (for Recharts)
router.get(
  "/admin/reports",
  verifyToken,
  requireRole("admin"),
  dashboardController.adminReports
);

// Staff dashboard summary
router.get(
  "/staff/summary",
  verifyToken,
  requireRole("admin", "staff"),
  dashboardController.staffSummary
);

module.exports = router;
