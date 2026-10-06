const Category = require("../models/Category");

/** GET /api/categories — public: list all active categories */
exports.list = async (_req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

/** GET /api/categories/:id */
exports.getById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

/** POST /api/categories — admin only */
exports.create = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const category = new Category({ name, description, image });
    await category.save();
    res.status(201).json({ category });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Category name already exists" });
    }
    console.error("Create category error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
};

/** PUT /api/categories/:id — admin only */
exports.update = async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    if (name !== undefined) {
      category.name = name;
      // Re-generate slug
      category.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json({ category });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Category name already exists" });
    }
    res.status(500).json({ error: "Failed to update category" });
  }
};

/** DELETE /api/categories/:id — admin only (soft-delete) */
exports.remove = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    category.isActive = false;
    await category.save();
    res.json({ message: "Category deactivated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category" });
  }
};
