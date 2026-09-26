const express = require("express");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const inventoryController = require("../controllers/inventoryController");

const router = express.Router();

// Admin/Staff: view inventory
router.get(
  "/",
  verifyToken,
  requireRole("admin", "staff"),
  inventoryController.list
);

// Admin/Staff: adjust stock
router.patch(
  "/:productId",
  verifyToken,
  requireRole("admin", "staff"),
  inventoryController.adjustStock
);

module.exports = router;
