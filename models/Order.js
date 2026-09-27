const mongoose = require("mongoose");

/**
 * Subdocument: a single customization choice the customer selected.
 * This is a snapshot — it records the exact choice and price at the time of order
 * so future product edits don't retroactively change past orders.
 */
const selectedCustomizationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. "color"
    label: { type: String, required: true }, // e.g. "Choose Color"
    selectedValue: { type: String, required: true }, // e.g. "Red"
    priceModifier: { type: Number, default: 0 }, // e.g. 50
  },
  { _id: false }
);

/**
 * Subdocument: a single item in the order.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true }, // snapshot
    productImage: { type: String, default: "" }, // snapshot of first image
    customizations: [selectedCustomizationSchema],
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // base + modifiers, at time of order
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, "Order must have at least one item"],
    },
    orderType: {
      type: String,
      enum: ["regular", "pre-order", "custom"],
      default: "regular",
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String, required: true },
      zip: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["gcash", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "deposit_paid", "fully_paid", "cod_pending", "paid"],
      default: "unpaid",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      default: 0, // only used for pre-orders
    },
    balanceDue: {
      type: Number,
      default: 0, // totalAmount - depositAmount
    },
    notes: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    // Customization specific fields
    referenceImage: {
      type: String,
      default: "",
    },
    designDescription: {
      type: String,
      default: "",
    },
    customApprovalStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    customRejectionReason: {
      type: String,
      default: "",
    },
    // Shipment tracking fields
    courierName: {
      type: String,
      default: "",
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    // Staff assignment for production tracking
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Index is created automatically via unique: true on orderNumber

/**
 * Pre-save: auto-generate order number (ORD-YYYYMMDD-XXXX).
 */
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
