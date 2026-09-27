const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const paymongo = require("../utils/paymongo");

// ─── PayMongo Checkout ───────────────────────────────────────────
/**
 * POST /api/payments/paymongo/create-checkout
 * Creates a PayMongo Checkout Session for the given order.
 *
 * Body: { orderId, paymentType? }
 *   - paymentType: "full" | "deposit" | "balance" (defaults to "full")
 *
 * For pre-orders, the first payment is a deposit (50%),
 * and the remaining balance is paid later.
 */
exports.paymongoCreateCheckout = async (req, res) => {
  try {
    const { orderId, paymentType } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Determine the amount to charge
    let amount = order.totalAmount;
    let type = "full";

    if (order.orderType === "pre-order") {
      if (paymentType === "balance" && order.paymentStatus === "deposit_paid") {
        // Paying the remaining balance
        amount = order.balanceDue;
        type = "balance";
      } else if (order.paymentStatus === "unpaid") {
        // First payment: deposit (50%)
        amount = order.depositAmount;
        type = "deposit";
      } else {
        return res.status(400).json({
          error: "This order has already been paid or is in an invalid state for payment.",
        });
      }
    } else {
      // Regular / custom orders pay full amount
      if (order.paymentStatus !== "unpaid") {
        return res.status(400).json({
          error: "This order has already been paid.",
        });
      }
    }

    // Convert PHP amount to centavos (PayMongo uses centavos)
    const amountInCentavos = Math.round(amount * 100);

    // Build line items from order items for a detailed checkout page
    const lineItems = order.items.map((item) => ({
      name: item.productName + (item.customizations.length > 0
        ? ` (${item.customizations.map((c) => c.selectedValue).join(", ")})`
        : ""),
      amount: Math.round(item.unitPrice * 100),
      quantity: item.quantity,
    }));

    // For deposit/balance payments, override with a single line item
    if (type !== "full") {
      lineItems.length = 0;
      lineItems.push({
        name: type === "deposit"
          ? `Deposit for Order #${order.orderNumber} (50%)`
          : `Balance Payment for Order #${order.orderNumber}`,
        amount: amountInCentavos,
        quantity: 1,
      });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const session = await paymongo.createCheckoutSession({
      lineItems,
      description: `Celsa Handicrafts — Order #${order.orderNumber}`,
      referenceNumber: order.orderNumber,
      paymentMethodTypes: ["gcash"],
      successUrl: `${clientUrl}/orders/${order._id}?payment=success`,
      cancelUrl: `${clientUrl}/orders/${order._id}?payment=cancelled`,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentType: type,
      },
    });

    const checkoutUrl = session.data.attributes.checkout_url;
    const sessionId = session.data.id;

    // Create a pending payment record
    const payment = new Payment({
      order: order._id,
      provider: "paymongo",
      amount,
      type,
      status: "pending",
      providerReferenceId: sessionId,
      metadata: {
        checkoutSessionId: sessionId,
        checkoutUrl,
      },
    });
    await payment.save();

    res.json({
      checkoutUrl,
      sessionId,
      paymentId: payment._id,
      amount,
      type,
    });
  } catch (err) {
    console.error("PayMongo create checkout error:", err);
    res.status(500).json({
      error: err.message || "Failed to create PayMongo checkout session",
    });
  }
};

/**
 * GET /api/payments/paymongo/session/:sessionId
 * Retrieve the status of a PayMongo Checkout Session.
 */
exports.paymongoGetSession = async (req, res) => {
  try {
    const session = await paymongo.retrieveCheckoutSession(req.params.sessionId);

    const attrs = session.data.attributes;
    res.json({
      id: session.data.id,
      status: attrs.status,
      paymentIntent: attrs.payment_intent,
      paymentMethodUsed: attrs.payment_method_used,
      paidAt: attrs.paid_at,
      metadata: attrs.metadata,
    });
  } catch (err) {
    console.error("PayMongo get session error:", err);
    res.status(500).json({ error: "Failed to retrieve checkout session" });
  }
};

/**
 * POST /api/payments/paymongo/expire/:sessionId
 * Expire (cancel) a PayMongo Checkout Session that hasn't been paid yet.
 */
exports.paymongoExpireSession = async (req, res) => {
  try {
    await paymongo.expireCheckoutSession(req.params.sessionId);

    // Mark the corresponding payment record as failed
    await Payment.findOneAndUpdate(
      { providerReferenceId: req.params.sessionId },
      { status: "failed" }
    );

    res.json({ message: "Checkout session expired" });
  } catch (err) {
    console.error("PayMongo expire session error:", err);
    res.status(500).json({ error: "Failed to expire checkout session" });
  }
};

/**
 * POST /api/payments/paymongo/webhook
 * Handles PayMongo webhook events.
 *
 * IMPORTANT: This route must receive the raw body for signature verification.
 * In server.js, apply express.raw() middleware before this route.
 *
 * Key events:
 *   - checkout_session.payment.paid  → payment successful
 *   - payment.failed                 → payment failed
 */
exports.paymongoWebhook = async (req, res) => {
  try {
    const signatureHeader = req.headers["paymongo-signature"];
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    // Verify signature if webhook secret is configured
    if (webhookSecret && signatureHeader) {
      const rawBody = req.rawBody || req.body;
      const isValid = paymongo.verifyWebhookSignature(
        rawBody,
        signatureHeader,
        webhookSecret
      );

      if (!isValid) {
        console.error("PayMongo webhook: invalid signature");
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
    }

    // Parse the event (body may be raw buffer or already parsed)
    const event = typeof req.body === "string" || Buffer.isBuffer(req.body)
      ? JSON.parse(req.body)
      : req.body;

    const eventType = event.data?.attributes?.type;
    const eventData = event.data?.attributes?.data;

    console.log(`📩 PayMongo webhook received: ${eventType}`);

    if (eventType === "checkout_session.payment.paid") {
      await handleCheckoutPaid(eventData);
    } else if (eventType === "payment.failed") {
      await handlePaymentFailed(eventData);
    }

    // Always acknowledge quickly
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("PayMongo webhook error:", err);
    // Still return 200 to prevent PayMongo from retrying
    res.status(200).json({ received: true });
  }
};

/**
 * Handle successful checkout payment.
 */
async function handleCheckoutPaid(sessionData) {
  try {
    if (!sessionData) return;

    const sessionId = sessionData.id;
    const attrs = sessionData.attributes || {};
    const metadata = attrs.metadata || {};
    const orderId = metadata.orderId;
    const paymentType = metadata.paymentType || "full";

    if (!orderId) {
      console.error("PayMongo webhook: no orderId in metadata");
      return;
    }

    // Find and update the payment record
    const payment = await Payment.findOne({
      providerReferenceId: sessionId,
      status: "pending",
    });

    if (!payment) {
      console.warn(`PayMongo webhook: no pending payment found for session ${sessionId}`);
      return;
    }

    // Mark payment as completed
    payment.status = "completed";
    payment.paidAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      paymentMethodUsed: attrs.payment_method_used,
      paymentIntentId: attrs.payment_intent?.id,
    };
    await payment.save();

    // Update the order's payment status
    const order = await Order.findById(orderId);
    if (!order) return;

    if (paymentType === "deposit") {
      order.paymentStatus = "deposit_paid";
    } else if (paymentType === "balance") {
      order.paymentStatus = "fully_paid";
    } else {
      order.paymentStatus = "paid";
    }

    // Auto-confirm pending orders after successful payment
    if (order.orderStatus === "pending" && order.customApprovalStatus !== "pending") {
      order.orderStatus = "confirmed";
    }

    await order.save();

    // Send notification to customer
    const userId = typeof order.user === "object" ? order.user._id || order.user : order.user;
    const statusLabel = paymentType === "deposit" ? "Deposit" : "Payment";

    await Notification.create({
      user: userId,
      title: `💰 ${statusLabel} Received: #${order.orderNumber}`,
      message: paymentType === "deposit"
        ? `Your 50% deposit of ₱${payment.amount.toLocaleString()} has been received. Remaining balance: ₱${order.balanceDue.toLocaleString()}.`
        : `Your payment of ₱${payment.amount.toLocaleString()} has been received. Thank you for your purchase!`,
      type: "order_status",
      order: order._id,
    });

    console.log(`✅ Payment completed for Order #${order.orderNumber} (${paymentType})`);
  } catch (err) {
    console.error("handleCheckoutPaid error:", err);
  }
}

/**
 * Handle failed payment.
 */
async function handlePaymentFailed(paymentData) {
  try {
    if (!paymentData) return;

    // Try to find payment by provider reference
    const attrs = paymentData.attributes || {};
    const metadata = attrs.metadata || {};

    if (metadata.orderId) {
      await Payment.findOneAndUpdate(
        { order: metadata.orderId, status: "pending", provider: "paymongo" },
        { status: "failed" }
      );
      console.log(`❌ Payment failed for order ${metadata.orderId}`);
    }
  } catch (err) {
    console.error("handlePaymentFailed error:", err);
  }
}

// ─── COD ─────────────────────────────────────────────────────────
/**
 * PATCH /api/payments/:orderId/cod-confirm
 * Staff/Admin marks a COD order as paid upon delivery.
 */
exports.codConfirm = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.paymentMethod !== "cod") {
      return res.status(400).json({ error: "This order is not COD" });
    }

    order.paymentStatus = "paid";
    await order.save();

    // Create a payment record for audit trail
    const payment = new Payment({
      order: order._id,
      provider: "cod",
      amount: order.totalAmount,
      type: "full",
      status: "completed",
      paidAt: new Date(),
    });
    await payment.save();

    res.json({ order, payment });
  } catch (err) {
    res.status(500).json({ error: "Failed to confirm COD payment" });
  }
};

/**
 * GET /api/payments/order/:orderId
 * Get all payment records for a given order.
 */
exports.getByOrder = async (req, res) => {
  try {
    const payments = await Payment.find({ order: req.params.orderId }).sort({
      createdAt: -1,
    });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};
