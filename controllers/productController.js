const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");

/**
 * GET /api/products
 * Public: list products with optional filters.
 * Query: ?category=id_or_slug&search=text&minPrice=0&maxPrice=1000&featured=true&page=1&limit=12
 */
exports.list = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      featured,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { isActive: true };

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        const foundCat = await Category.findOne({ slug: category });
        if (foundCat) {
          filter.category = foundCat._id;
        } else {
          filter.category = category;
        }
      }
    }
    if (featured === "true") filter.isFeatured = true;
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
    }
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchedCategories = await Category.find({
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { slug: { $regex: escaped, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const matchedCategoryIds = matchedCategories.map((c) => c._id);

      const searchConditions = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];

      if (matchedCategoryIds.length > 0) {
        searchConditions.push({ category: { $in: matchedCategoryIds } });
      }

      filter.$or = searchConditions;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Cache products response for fast subsequent page loads
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

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
    console.error("List products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

/**
 * GET /api/products/:slug
 * Public: get a single product by slug.
 */
exports.getBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate("category", "name slug");

    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

/**
 * GET /api/products/id/:id
 * Admin: get a single product by ID (including inactive).
 */
exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug"
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

/**
 * POST /api/products — admin only
 */
exports.create = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      stock,
      lowStockThreshold,
      isFeatured,
      customizationOptions,
      images,
    } = req.body;

    const product = new Product({
      name,
      description,
      category,
      basePrice,
      stock: stock || 0,
      lowStockThreshold: lowStockThreshold || 5,
      isFeatured: isFeatured || false,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      customizationOptions: customizationOptions || [],
      images: images || [],
    });

    await product.save();
    await product.populate("category", "name slug");
    res.status(201).json({ product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Product with this name already exists" });
    }
    console.error("Create product error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
};

/**
 * PUT /api/products/:id — admin only
 */
exports.update = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const allowedFields = [
      "name",
      "description",
      "category",
      "basePrice",
      "stock",
      "lowStockThreshold",
      "isFeatured",
      "isActive",
      "customizationOptions",
      "images",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }

    // Re-generate slug if name changed
    if (req.body.name) {
      product.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    await product.save();
    await product.populate("category", "name slug");
    res.json({ product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Product name/slug conflict" });
    }
    console.error("Update product error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
};

/**
 * DELETE /api/products/:id — admin only (soft-delete)
 */
exports.remove = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.isActive = false;
    await product.save();
    res.json({ message: "Product deactivated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
};

/**
 * GET /api/products/admin/all
 * Admin: list ALL products including inactive, for the admin management table.
 */
exports.listAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchedCategories = await Category.find({
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { slug: { $regex: escaped, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const matchedCategoryIds = matchedCategories.map((c) => c._id);

      const searchConditions = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];

      if (matchedCategoryIds.length > 0) {
        searchConditions.push({ category: { $in: matchedCategoryIds } });
      }

      filter.$or = searchConditions;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
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
    res.status(500).json({ error: "Failed to fetch products" });
  }
};
