/**
 * Script to clear test/sample products and orders,
 * leaving Admin and Staff accounts intact for entering real inventory.
 *
 * Run: npm run reset-products
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Category = require("../models/Category");

async function resetProducts() {
  await connectDB();
  console.log("🧹 Clearing test products and test orders...\n");

  const deletedProducts = await Product.deleteMany({});
  console.log(`  🗑 Deleted ${deletedProducts.deletedCount} products.`);

  const deletedOrders = await Order.deleteMany({});
  console.log(`  🗑 Deleted ${deletedOrders.deletedCount} orders.`);

  const deletedPayments = await Payment.deleteMany({});
  console.log(`  🗑 Deleted ${deletedPayments.deletedCount} payments.`);

  const deletedNotifications = await Notification.deleteMany({});
  console.log(`  🗑 Deleted ${deletedNotifications.deletedCount} notifications.`);

  // Check admin and staff
  const adminCount = await User.countDocuments({ role: "admin" });
  const staffCount = await User.countDocuments({ role: "staff" });
  const categoryCount = await Category.countDocuments();

  console.log("\n✅ Database cleaned and ready for real products!");
  console.log(`  📦 Categories preserved: ${categoryCount}`);
  console.log(`  👤 Admin accounts active: ${adminCount}`);
  console.log(`  👷 Staff accounts active: ${staffCount}`);
  console.log("\nYou can now log in to the Admin/Staff portals and start adding real products and pictures!\n");

  await mongoose.disconnect();
  process.exit(0);
}

resetProducts().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
