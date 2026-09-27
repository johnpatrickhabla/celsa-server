const express = require("express");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// ─── PayMongo Checkout ───────────────────────────────────────────
// Create a checkout session (customer must be authenticated)
router.post(
  "/paymongo/create-checkout",
  verifyToken,
  paymentController.paymongoCreateCheckout
);

// Retrieve checkout session status
router.get(
  "/paymongo/session/:sessionId",
  verifyToken,
  paymentController.paymongoGetSession
);

// Expire/cancel a checkout session (admin/staff)
router.post(
  "/paymongo/expire/:sessionId",
  verifyToken,
  requireRole("admin", "staff"),
  paymentController.paymongoExpireSession
);

// PayMongo webhook (no auth — PayMongo sends this)
// NOTE: uses express.raw() to preserve the raw body for signature verification
router.post(
  "/paymongo/webhook",
  express.raw({ type: "application/json" }),
  paymentController.paymongoWebhook
);

// ─── COD ─────────────────────────────────────────────────────────
// Staff/Admin confirms COD payment upon delivery
router.patch(
  "/:orderId/cod-confirm",
  verifyToken,
  requireRole("admin", "staff"),
  paymentController.codConfirm
);

// ─── General ─────────────────────────────────────────────────────
// Get all payment records for an order
router.get("/order/:orderId", verifyToken, paymentController.getByOrder);

module.exports = router;
