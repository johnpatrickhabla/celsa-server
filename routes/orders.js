const express = require("express");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const orderController = require("../controllers/orderController");

const router = express.Router();

// Customer: create order (must be logged in)
router.post("/", verifyToken, orderController.create);

// Customer: own orders
router.get("/mine", verifyToken, orderController.myOrders);

// Admin/Staff: list all orders
router.get(
  "/",
  verifyToken,
  requireRole("admin", "staff"),
  orderController.list
);

// Public: track order by order number (no login required)
router.get("/track/:orderNumber", orderController.trackOrder);

// Any authenticated user: get order detail (controller checks ownership for customers)
router.get("/:id", verifyToken, orderController.getById);

// Admin/Staff: update order status
router.patch(
  "/:id/status",
  verifyToken,
  requireRole("admin", "staff"),
  orderController.updateStatus
);

// Admin: assign order to staff
router.patch(
  "/:id/assign",
  verifyToken,
  requireRole("admin"),
  orderController.assign
);

// Admin: review custom order request (approve or reject)
router.patch(
  "/:id/review",
  verifyToken,
  requireRole("admin"),
  orderController.reviewCustom
);

// Admin/Staff: update shipment tracking info
router.patch(
  "/:id/shipment",
  verifyToken,
  requireRole("admin", "staff"),
  orderController.updateShipment
);

module.exports = router;

