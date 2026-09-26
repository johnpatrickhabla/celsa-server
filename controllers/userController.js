const User = require("../models/User");

/**
 * GET /api/users
 * Admin: list all users with optional role filter.
 * Query params: ?role=staff|customer&page=1&limit=20&search=...
 */
exports.list = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (role && ["admin", "staff", "customer"].includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * GET /api/users/:id
 * Admin: get a single user by ID.
 */
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/**
 * POST /api/users
 * Admin: create a staff account. Customers self-register via /api/auth/signup.
 */
exports.create = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Only allow creating staff or admin accounts through this route
    if (!["staff", "admin"].includes(role)) {
      return res.status(400).json({
        error: "This route creates staff/admin accounts only. Customers use /api/auth/signup.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const user = new User({
      name,
      email,
      passwordHash: password, // pre-save hook hashes it
      role,
      phone: phone || "",
    });

    await user.save();
    res.status(201).json({ user: user.toJSON() });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * PUT /api/users/:id
 * Admin: update a user's name, email, role, phone, or active status.
 * Password can be reset by sending a new `password` field.
 */
exports.update = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, email, role, phone, password, isActive } = req.body;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.passwordHash = password; // pre-save hook re-hashes

    await user.save();
    res.json({ user: user.toJSON() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

/**
 * DELETE /api/users/:id
 * Admin: soft-delete (deactivate) a user rather than hard-deleting.
 */
exports.remove = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: "Cannot deactivate your own account" });
    }

    user.isActive = false;
    await user.save();
    res.json({ message: "User deactivated", user: user.toJSON() });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to deactivate user" });
  }
};
