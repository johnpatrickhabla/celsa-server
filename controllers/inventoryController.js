const Product = require("../models/Product");

/**
 * GET /api/inventory
 * Admin/Staff: list all products with stock info.
 * Query: ?lowStock=true&page=1&limit=20
 */
exports.list = async (req, res) => {
  try {
    const { lowStock, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (lowStock === "true") {
      // Products where stock <= lowStockThreshold
      filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("name slug stock lowStockThreshold basePrice images isActive category")
        .populate("category", "name")
        .sort({ stock: 1 }) // lowest stock first
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

/**
 * PATCH /api/inventory/:productId
 * Admin/Staff: adjust stock for a product.
 * Body: { adjustment: 10 } (positive = add, negative = subtract)
 * or   { stock: 50 } (set absolute value)
 */
exports.adjustStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (req.body.stock !== undefined) {
      // Absolute set
      product.stock = Math.max(0, parseInt(req.body.stock));
    } else if (req.body.adjustment !== undefined) {
      // Relative adjustment
      product.stock = Math.max(0, product.stock + parseInt(req.body.adjustment));
    } else {
      return res.status(400).json({ error: "Provide `stock` or `adjustment`" });
    }

    await product.save();
    res.json({
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to adjust stock" });
  }
};
