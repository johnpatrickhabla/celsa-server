/**
 * Seed script: populates the database with a default admin,
 * sample categories, and sample products for testing.
 *
 * Run: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

const ADMIN = {
  name: "Celsa Admin",
  email: "admin@celsa.com",
  passwordHash: "admin123", // pre-save hook will bcrypt this
  role: "admin",
};

const STAFF = {
  name: "Staff User",
  email: "staff@celsa.com",
  passwordHash: "staff123",
  role: "staff",
};

const CUSTOMER = {
  name: "Juan Dela Cruz",
  email: "juan@example.com",
  passwordHash: "customer123",
  role: "customer",
  phone: "+63 912 345 6789",
  address: {
    street: "123 Rizal St",
    city: "Alcala",
    province: "Pangasinan",
    zip: "2425",
  },
};

const CATEGORIES = [
  { name: "Baskets", description: "Handwoven baskets made from buri and other natural materials" },
  { name: "Bags", description: "Native hand bags crafted with traditional Filipino weaving techniques" },
  { name: "Trays", description: "Decorative and functional handicraft trays" },
  { name: "Home Decor", description: "Handmade home decoration items" },
  { name: "Accessories", description: "Handcrafted personal accessories and small items" },
];

async function seed() {
  await connectDB();
  console.log("🌱 Seeding database...\n");

  // ── Users ──────────────────────────────────────────────────────
  console.log("Creating users...");
  for (const userData of [ADMIN, STAFF, CUSTOMER]) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`  ⏭ ${userData.email} already exists, skipping.`);
    } else {
      const user = new User(userData);
      await user.save();
      console.log(`  ✅ Created ${userData.role}: ${userData.email} (password: ${userData === ADMIN ? "admin123" : userData === STAFF ? "staff123" : "customer123"})`);
    }
  }

  // ── Categories ─────────────────────────────────────────────────
  console.log("\nCreating categories...");
  const categoryMap = {};
  for (const catData of CATEGORIES) {
    const existing = await Category.findOne({ name: catData.name });
    if (existing) {
      console.log(`  ⏭ ${catData.name} already exists, skipping.`);
      categoryMap[catData.name] = existing._id;
    } else {
      const category = new Category(catData);
      await category.save();
      console.log(`  ✅ Created category: ${catData.name}`);
      categoryMap[catData.name] = category._id;
    }
  }

  // ── Products ───────────────────────────────────────────────────
  console.log("\nCreating products...");

  const PRODUCTS = [
    {
      name: "Buri Basket",
      description: "A beautifully handwoven basket made from dried buri palm leaves. Perfect for home storage and decoration.",
      category: categoryMap["Baskets"],
      basePrice: 250,
      stock: 30,
      isFeatured: true,
      customizationOptions: [
        {
          type: "size",
          label: "Choose Size",
          required: true,
          choices: [
            { value: "Small", priceModifier: 0 },
            { value: "Medium", priceModifier: 100 },
            { value: "Large", priceModifier: 200 },
          ],
        },
        {
          type: "color",
          label: "Choose Color",
          required: false,
          choices: [
            { value: "Natural", priceModifier: 0 },
            { value: "Brown", priceModifier: 30 },
            { value: "Dark Brown", priceModifier: 30 },
          ],
        },
      ],
    },
    {
      name: "Native Hand Bag",
      description: "A stylish native hand bag perfect for everyday use. Woven by skilled Filipino artisans using traditional techniques.",
      category: categoryMap["Bags"],
      basePrice: 450,
      stock: 20,
      isFeatured: true,
      customizationOptions: [
        {
          type: "material",
          label: "Choose Material",
          required: true,
          choices: [
            { value: "Buri Palm", priceModifier: 0 },
            { value: "Abaca", priceModifier: 100 },
            { value: "Rattan", priceModifier: 150 },
          ],
        },
        {
          type: "size",
          label: "Choose Size",
          required: true,
          choices: [
            { value: "Small", priceModifier: 0 },
            { value: "Medium", priceModifier: 80 },
            { value: "Large", priceModifier: 160 },
          ],
        },
        {
          type: "add-on",
          label: "Add Zipper",
          required: false,
          choices: [
            { value: "No Zipper", priceModifier: 0 },
            { value: "With Zipper", priceModifier: 50 },
          ],
        },
      ],
    },
    {
      name: "Handicraft Tray",
      description: "A decorative handicraft tray ideal for serving or display. Showcases the artistry of Filipino craftsmen.",
      category: categoryMap["Trays"],
      basePrice: 380,
      stock: 15,
      isFeatured: true,
      customizationOptions: [
        {
          type: "size",
          label: "Choose Size",
          required: true,
          choices: [
            { value: "Small (10\")", priceModifier: 0 },
            { value: "Medium (14\")", priceModifier: 80 },
            { value: "Large (18\")", priceModifier: 150 },
          ],
        },
        {
          type: "engraving",
          label: "Custom Engraving",
          required: false,
          choices: [
            { value: "No Engraving", priceModifier: 0 },
            { value: "Name/Text Engraving", priceModifier: 100 },
          ],
        },
      ],
    },
    {
      name: "Pencil Holder",
      description: "A compact and charming pencil holder woven from natural materials. Great as a desk organizer or gift.",
      category: categoryMap["Accessories"],
      basePrice: 150,
      stock: 50,
      isFeatured: true,
      customizationOptions: [
        {
          type: "color",
          label: "Choose Color",
          required: false,
          choices: [
            { value: "Natural", priceModifier: 0 },
            { value: "Dyed Red", priceModifier: 20 },
            { value: "Dyed Blue", priceModifier: 20 },
            { value: "Dyed Green", priceModifier: 20 },
          ],
        },
      ],
    },
    {
      name: "Woven Wall Hanging",
      description: "A stunning handmade wall hanging that brings warmth and texture to any room. Made from locally sourced natural fibers.",
      category: categoryMap["Home Decor"],
      basePrice: 650,
      stock: 10,
      isFeatured: false,
      customizationOptions: [
        {
          type: "size",
          label: "Choose Size",
          required: true,
          choices: [
            { value: "Small (12\" x 18\")", priceModifier: 0 },
            { value: "Medium (18\" x 24\")", priceModifier: 200 },
            { value: "Large (24\" x 36\")", priceModifier: 400 },
          ],
        },
        {
          type: "color",
          label: "Color Theme",
          required: false,
          choices: [
            { value: "Earth Tones", priceModifier: 0 },
            { value: "Sunset", priceModifier: 50 },
            { value: "Ocean", priceModifier: 50 },
          ],
        },
      ],
    },
    {
      name: "Rattan Storage Box",
      description: "A versatile rattan storage box with a lid. Perfect for organizing small items while adding a rustic touch.",
      category: categoryMap["Home Decor"],
      basePrice: 320,
      stock: 25,
      isFeatured: false,
      customizationOptions: [
        {
          type: "size",
          label: "Choose Size",
          required: true,
          choices: [
            { value: "Small", priceModifier: 0 },
            { value: "Medium", priceModifier: 70 },
            { value: "Large", priceModifier: 140 },
          ],
        },
      ],
    },
    {
      name: "Abaca Clutch Bag",
      description: "An elegant clutch bag handwoven from abaca fiber. Ideal for special occasions or as a unique gift.",
      category: categoryMap["Bags"],
      basePrice: 380,
      stock: 18,
      isFeatured: false,
      customizationOptions: [
        {
          type: "color",
          label: "Choose Color",
          required: false,
          choices: [
            { value: "Natural Beige", priceModifier: 0 },
            { value: "Olive Green", priceModifier: 30 },
            { value: "Terracotta", priceModifier: 30 },
          ],
        },
        {
          type: "add-on",
          label: "Add Tassel",
          required: false,
          choices: [
            { value: "No Tassel", priceModifier: 0 },
            { value: "With Tassel", priceModifier: 40 },
          ],
        },
      ],
    },
    {
      name: "Fruit Basket Set",
      description: "A set of three nesting fruit baskets, handwoven and perfect for the kitchen or dining table.",
      category: categoryMap["Baskets"],
      basePrice: 550,
      stock: 12,
      isFeatured: false,
      customizationOptions: [],
    },
  ];

  for (const prodData of PRODUCTS) {
    const existing = await Product.findOne({ name: prodData.name });
    if (existing) {
      console.log(`  ⏭ ${prodData.name} already exists, skipping.`);
    } else {
      const product = new Product(prodData);
      await product.save();
      console.log(`  ✅ Created product: ${prodData.name} — ₱${prodData.basePrice}`);
    }
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("Default accounts:");
  console.log("  Admin:    admin@celsa.com / admin123");
  console.log("  Staff:    staff@celsa.com / staff123");
  console.log("  Customer: juan@example.com / customer123\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
