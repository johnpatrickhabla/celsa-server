const Order = require("../models/Order");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendShippingEmail } = require("../utils/email");

async function dispatchShippingEmailIfNeeded(order) {
  try {
    if (!order || !order.trackingNumber) return;
    let recipientEmail = null;
    let recipientName = order.shippingAddress?.fullName || "Valued Customer";

    if (order.user) {
      const userId = typeof order.user === "object" ? order.user._id || order.user : order.user;
      const userDoc = await User.findById(userId).select("name email").lean();
      if (userDoc) {
        recipientEmail = userDoc.email;
        recipientName = userDoc.name || recipientName;
      }
    }

    if (recipientEmail) {
      sendShippingEmail({
        toEmail: recipientEmail,
        recipientName,
        orderNumber: order.orderNumber,
        courierName: order.courierName || "Courier",
        trackingNumber: order.trackingNumber,
        shippingAddress: order.shippingAddress,
      }).catch((e) => console.error("[EMAIL ERROR] Failed to dispatch shipping email:", e.message));
    }
  } catch (err) {
    console.error("[EMAIL ERROR] Error triggering shipping email:", err.message);
  }
}

async function createOrderNotification(order, title, message, type = "order_status") {
  try {
    if (!order || !order.user) return;
    const userId = typeof order.user === "object" ? order.user._id || order.user : order.user;
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      order: order._id,
    });
  } catch (err) {
    console.error("Failed to create order notification:", err);
  }
}

/**
 * POST /api/orders — create a new order.
 * Validates items, snapshots prices from the database (never trusts client prices),
 * calculates total, and handles pre-order deposit logic.
 */
exports.create = async (req, res) => {
  try {
    const {
      items,
      orderType = "regular",
      shippingAddress,
      paymentMethod,
      notes,
      referenceImage = "",
      designDescription = "",
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must have at least one item" });
    }

    // COD is only available for regular and custom orders (not pre-orders with deposit requirement)
    if (paymentMethod === "cod" && orderType === "pre-order") {
      return res.status(400).json({
        error: "Cash on Delivery is not available for pre-orders. A deposit must be secured online.",
      });
    }

    // Validate and snapshot each item from the database
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          error: `Product not found or inactive: ${item.productId}`,
        });
      }

      // Calculate unit price: base price + customization modifiers
      let unitPrice = product.basePrice;
      const customizations = [];

      if (item.customizations && item.customizations.length > 0) {
        for (const cust of item.customizations) {
          // Find the matching customization option on the product
          const option = product.customizationOptions.find(
            (opt) => opt.type === cust.type
          );
          if (option) {
            const choice = option.choices.find(
              (c) => c.value === cust.selectedValue
            );
            const modifier = choice ? choice.priceModifier : 0;
            unitPrice += modifier;
            customizations.push({
              type: cust.type,
              label: option.label,
              selectedValue: cust.selectedValue,
              priceModifier: modifier,
            });
          }
        }
      }

      const qty = parseInt(item.quantity) || 1;
      totalAmount += unitPrice * qty;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.images.length > 0 ? product.images[0].url : "",
        customizations,
        quantity: qty,
        unitPrice,
      });
    }

    // Pre-order deposit: 50% of total
    let depositAmount = 0;
    let balanceDue = 0;
    let paymentStatus = "unpaid";

    if (orderType === "pre-order") {
      depositAmount = Math.ceil(totalAmount * 0.5);
      balanceDue = totalAmount - depositAmount;
    }

    if (paymentMethod === "cod") {
      paymentStatus = "cod_pending";
    }

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      orderType,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      totalAmount,
      depositAmount,
      balanceDue,
      notes: notes || "",
      referenceImage: referenceImage || "",
      designDescription: designDescription || "",
      customApprovalStatus: orderType === "custom" ? "pending" : "none",
    });

    await order.save();

    // Decrement stock for regular orders (pre-orders and custom orders reserve on confirmation)
    if (orderType === "regular") {
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    res.status(201).json({ order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

/**
 * GET /api/orders/mine — customer's own orders.
 */
exports.myOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

/**
 * GET /api/orders — admin/staff: list all orders with filters.
 * Query: ?status=pending&paymentStatus=unpaid&page=1&limit=20&search=...
 */
exports.list = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

/**
 * GET /api/orders/:id — get single order detail.
 */
exports.getById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("assignedTo", "name email");

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Customers can only see their own orders
    if (
      req.user.role === "customer" &&
      order.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

/**
 * GET /api/orders/track/:orderNumber
 * Public endpoint to allow anyone to track an order by order number without login.
 */
exports.trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    if (!orderNumber || !orderNumber.trim()) {
      return res.status(400).json({ error: "Order number is required" });
    }

    const cleanOrderNumber = orderNumber.trim();
    const order = await Order.findOne({
      orderNumber: { $regex: new RegExp(`^${cleanOrderNumber}$`, "i") },
    })
      .populate("user", "name email")
      .populate("assignedTo", "name");

    if (!order) {
      return res.status(404).json({
        error: `No order found with order number "${cleanOrderNumber}". Please verify and try again.`,
      });
    }

    res.json({ order });
  } catch (err) {
    console.error("Order tracking error:", err);
    res.status(500).json({ error: "Failed to track order" });
  }
};

/**
 * PATCH /api/orders/:id/status — admin/staff: update order status.
 */
exports.updateStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const previousStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    await order.save();

    // Automatically send notification to customer when status changes
    if (orderStatus === "processing") {
      await createOrderNotification(
        order,
        `🎨 Order Being Prepared: #${order.orderNumber}`,
        "Our artisan staff has started preparing and crafting your handicraft order.",
        "order_status"
      );
    } else if (orderStatus === "shipped") {
      await createOrderNotification(
        order,
        `🚚 Order Shipped: #${order.orderNumber}`,
        order.courierName
          ? `Your order is on its way via ${order.courierName}! Tracking: ${order.trackingNumber || "N/A"}`
          : "Your order has been dispatched for delivery.",
        "shipped"
      );
      await dispatchShippingEmailIfNeeded(order);
    } else if (orderStatus === "confirmed") {
      await createOrderNotification(
        order,
        `✅ Order Confirmed: #${order.orderNumber}`,
        "Your order has been verified and queued for preparation.",
        "order_status"
      );
    } else if (orderStatus === "completed") {
      await createOrderNotification(
        order,
        `🎉 Order Delivered: #${order.orderNumber}`,
        "Your order has been successfully completed and delivered. Thank you for choosing Celsa Handicrafts!",
        "order_status"
      );
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
};

/**
 * PATCH /api/orders/:id/assign — admin: assign order to a staff member.
 */
exports.assign = async (req, res) => {
  try {
    const { staffId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.assignedTo = staffId || null;
    await order.save();
    await order.populate("assignedTo", "name email");

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign order" });
  }
};

/**
 * PATCH /api/orders/:id/review — admin: approve or reject custom order.
 */
exports.reviewCustom = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.customApprovalStatus = status;
    if (status === "rejected") {
      order.customRejectionReason = rejectionReason || "Design specifications could not be accommodated.";
      order.orderStatus = "cancelled";

      await createOrderNotification(
        order,
        `⚠️ Custom Order Update: #${order.orderNumber}`,
        `Your custom design request was not approved. Reason: ${order.customRejectionReason}`,
        "custom_rejected"
      );
    } else {
      order.customRejectionReason = "";
      if (order.orderStatus === "pending") {
        order.orderStatus = "confirmed";
      }

      await createOrderNotification(
        order,
        `✨ Custom Order Approved: #${order.orderNumber}`,
        "Your custom design request and reference image were approved by the Administrator and scheduled for production.",
        "custom_approved"
      );
    }

    await order.save();
    await order.populate("user", "name email");
    res.json({ order });
  } catch (err) {
    console.error("Review custom order error:", err);
    res.status(500).json({ error: "Failed to review custom order" });
  }
};

/**
 * PATCH /api/orders/:id/shipment — admin/staff: update shipment tracking details.
 */
exports.updateShipment = async (req, res) => {
  try {
    const { courierName, trackingNumber, orderStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (courierName !== undefined) order.courierName = courierName;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (orderStatus) {
      order.orderStatus = orderStatus;
    } else if (trackingNumber && order.orderStatus !== "completed" && order.orderStatus !== "cancelled") {
      order.orderStatus = "shipped";
    }

    await order.save();

    if (order.orderStatus === "shipped") {
      await createOrderNotification(
        order,
        `🚚 Order Shipped: #${order.orderNumber}`,
        `Your package is on its way via ${order.courierName || "Courier"} (Tracking: ${order.trackingNumber || "N/A"}).`,
        "shipped"
      );
      await dispatchShippingEmailIfNeeded(order);
    }

    res.json({ order });
  } catch (err) {
    console.error("Update shipment error:", err);
    res.status(500).json({ error: "Failed to update shipment details" });
  }
};
