/**
 * Script to completely wipe test data and prepare fresh admin/staff accounts and categories.
 *
 * Run: npm run reset-all
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

const ADMIN = {
  name: "Celsa Admin",
  email: "admin@celsa.com",
  passwordHash: "admin123",
  role: "admin",
};

const STAFF = {
  name: "Staff User",
  email: "staff@celsa.com",
  passwordHash: "staff123",
  role: "staff",
};

const CATEGORIES = [
  { name: "Baskets", description: "Handwoven baskets made from buri and other natural materials" },
  { name: "Bags", description: "Native hand bags crafted with traditional Filipino weaving techniques" },
  { name: "Trays", description: "Decorative and functional handicraft trays" },
  { name: "Home Decor", description: "Handmade home decoration items" },
  { name: "Accessories", description: "Handcrafted personal accessories and small items" },
  { name: "Hats", description: "Traditional native handwoven hats crafted from local natural fibers" },
];

async function resetAll() {
  await connectDB();
  console.log("🧹 Performing full database reset...\n");

  const p = await Product.deleteMany({});
  const o = await Order.deleteMany({});
  const pay = await Payment.deleteMany({});
  const n = await Notification.deleteMany({});
  console.log(`  🗑 Cleared ${p.deletedCount} products`);
  console.log(`  🗑 Cleared ${o.deletedCount} orders`);
  console.log(`  🗑 Cleared ${pay.deletedCount} payments`);
  console.log(`  🗑 Cleared ${n.deletedCount} notifications`);

  // Ensure default categories
  console.log("\nEnsuring standard categories...");
  for (const catData of CATEGORIES) {
    const existing = await Category.findOne({ name: catData.name });
    if (!existing) {
      await new Category(catData).save();
      console.log(`  ✅ Added category: ${catData.name}`);
    } else {
      console.log(`  ✓ Kept existing category: ${catData.name}`);
    }
  }

  // Ensure Admin & Staff
  console.log("\nEnsuring Admin & Staff accounts...");
  for (const userData of [ADMIN, STAFF]) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      await new User(userData).save();
      console.log(`  ✅ Created ${userData.role}: ${userData.email}`);
    } else {
      console.log(`  ✓ ${userData.role} already ready: ${userData.email}`);
    }
  }

  console.log("\n🎉 Full reset complete! Ready for real products & pictures.\n");
  console.log("Login credentials:");
  console.log("  Admin: admin@celsa.com / admin123");
  console.log("  Staff: staff@celsa.com / staff123\n");

  await mongoose.disconnect();
  process.exit(0);
}

resetAll().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
