const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal", "paymongo", "cod"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["deposit", "balance", "full"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    providerReferenceId: {
      type: String,
      default: "", // Stripe Payment Intent ID, PayPal Order ID, PayMongo ref, etc.
    },
    paidAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ provider: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
