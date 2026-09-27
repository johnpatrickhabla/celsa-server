const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

/**
 * GET /api/dashboard/admin/summary
 * Returns aggregate counts for the admin dashboard stat cards.
 */
exports.adminSummary = async (_req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      lowStockProducts,
      pendingCustomReviews,
      inProductionOrders,
      shippedOrders,
      activeStaffCount,
      lowStockItemsList,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: "customer", isActive: true }),
      Order.countDocuments({ orderStatus: "pending" }),
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }),
      Order.countDocuments({ customApprovalStatus: "pending" }),
      Order.countDocuments({ orderStatus: "processing" }),
      Order.countDocuments({ orderStatus: "shipped" }),
      User.countDocuments({ role: "staff", isActive: true }),
      Product.find({
        isActive: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      })
        .populate("category", "name")
        .limit(4),
      Order.find()
        .populate("user", "name email")
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    // Monthly order count (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Monthly revenue
    const monthlyRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          paymentStatus: { $in: ["fully_paid", "paid", "deposit_paid"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const monthlyRevenue =
      monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0;

    res.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      lowStockProducts,
      pendingCustomReviews,
      inProductionOrders,
      shippedOrders,
      activeStaffCount,
      lowStockItemsList,
      monthlyOrders,
      monthlyRevenue,
      recentOrders,
    });
  } catch (err) {
    console.error("Admin summary error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
};

/**
 * GET /api/dashboard/staff/summary
 * Returns task counts for the staff dashboard.
 */
exports.staffSummary = async (req, res) => {
  try {
    const staffId = req.user.id;

    const [
      myAssignedOrders,
      inProgressOrders,
      completedToday,
      recentAssignments,
    ] = await Promise.all([
      Order.countDocuments({ assignedTo: staffId }),
      Order.countDocuments({
        assignedTo: staffId,
        orderStatus: "processing",
      }),
      Order.countDocuments({
        assignedTo: staffId,
        orderStatus: "completed",
        updatedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      Order.find({ assignedTo: staffId })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.json({
      myAssignedOrders,
      inProgressOrders,
      completedToday,
      recentAssignments,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff summary" });
  }
};

/**
 * GET /api/dashboard/admin/reports
 * Returns data for sales charts (Recharts).
 * Query: ?period=weekly|monthly|daily (default: monthly)
 */
exports.adminReports = async (req, res) => {
  try {
    const period = req.query.period || "monthly";
    const now = new Date();
    let startDate;
    let groupFormat;

    switch (period) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
        groupFormat = { $isoWeek: "$createdAt" };
        break;
      case "monthly":
      default:
        startDate = new Date(now.getFullYear(), 0, 1); // start of year
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
    }

    // Revenue over time
    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: { $in: ["fully_paid", "paid", "deposit_paid"] },
        },
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    // Best-selling products (top 10)
    const bestSellers = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productName",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // ── Inventory Report Data ─────────────────────────────────────
    const products = await Product.find({ isActive: true })
      .populate("category", "name")
      .sort({ stock: 1 });

    const inventoryItems = products.map((p) => ({
      _id: p._id,
      name: p.name,
      categoryName: p.category ? p.category.name : "Uncategorized",
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      isLowStock: p.stock <= p.lowStockThreshold,
      basePrice: p.basePrice,
      totalValue: p.stock * p.basePrice,
    }));

    const totalInventoryValue = inventoryItems.reduce((acc, cur) => acc + cur.totalValue, 0);
    const totalInventoryUnits = inventoryItems.reduce((acc, cur) => acc + cur.stock, 0);
    const lowStockCount = inventoryItems.filter((i) => i.isLowStock).length;

    const inventoryReport = {
      items: inventoryItems,
      totalProducts: inventoryItems.length,
      totalInventoryUnits,
      totalInventoryValue,
      lowStockCount,
    };

    // ── Production Report Data ───────────────────────────────────
    const staffMembers = await User.find({ role: "staff", isActive: true }).select("name email");
    
    const staffWorkload = await Promise.all(
      staffMembers.map(async (s) => {
        const [activeCount, completedCount] = await Promise.all([
          Order.countDocuments({ assignedTo: s._id, orderStatus: { $in: ["confirmed", "processing"] } }),
          Order.countDocuments({ assignedTo: s._id, orderStatus: "completed" }),
        ]);
        return {
          staffId: s._id,
          name: s.name,
          email: s.email,
          activeCount,
          completedCount,
        };
      })
    );

    const productionReport = {
      ordersByStatus,
      staffWorkload,
      totalInProduction: await Order.countDocuments({ orderStatus: "processing" }),
      totalPending: await Order.countDocuments({ orderStatus: "pending" }),
      totalShipped: await Order.countDocuments({ orderStatus: "shipped" }),
      totalCompleted: await Order.countDocuments({ orderStatus: "completed" }),
    };

    // ── Customer Report Data ─────────────────────────────────────
    const topCustomers = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["fully_paid", "paid", "deposit_paid", "cod_pending"] },
        },
      },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 15 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      { $unwind: "$customerInfo" },
      {
        $project: {
          _id: 1,
          name: "$customerInfo.name",
          email: "$customerInfo.email",
          phone: "$customerInfo.phone",
          orderCount: 1,
          totalSpent: 1,
          lastOrderDate: 1,
        },
      },
    ]);

    const totalCustomersCount = await User.countDocuments({ role: "customer", isActive: true });

    const customerReport = {
      topCustomers,
      totalCustomersCount,
    };

    res.json({
      revenueData,
      ordersByStatus,
      bestSellers,
      inventoryReport,
      productionReport,
      customerReport,
    });
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};
