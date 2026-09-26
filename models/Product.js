const mongoose = require("mongoose");

/**
 * Subdocument: a single choice within a customization option.
 * Example: { value: "Red", priceModifier: 50 }
 */
const choiceSchema = new mongoose.Schema(
  {
    value: { type: String, required: true },
    priceModifier: { type: Number, default: 0 }, // added to base price
  },
  { _id: false }
);

/**
 * Subdocument: a customization option for the product.
 * Example: { type: "color", label: "Choose Color", choices: [...] }
 */
const customizationOptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["material", "color", "size", "engraving", "add-on", "other"],
    },
    label: { type: String, required: true }, // display label for the option
    required: { type: Boolean, default: false },
    choices: [choiceSchema],
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: 0,
    },
    images: [
      {
        url: { type: String, required: true }, // Cloudinary URL
        publicId: { type: String, default: "" }, // Cloudinary public_id for deletion
      },
    ],
    customizationOptions: [customizationOptionSchema],
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCustomizable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Text index for search functionality
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });

// Auto-generate slug from name before validation if not provided
productSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  // Mark as customizable if there are customization options
  this.isCustomizable = this.customizationOptions && this.customizationOptions.length > 0;
  next();
});

module.exports = mongoose.model("Product", productSchema);
