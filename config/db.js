const mongoose = require("mongoose");
const dns = require("dns");

// Fix Windows router/ISP blocking of Node.js internal C-ares SRV lookups (only on Windows)
if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    // Ignore if custom DNS servers fail
  }
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Connect to MongoDB via Mongoose.
 * Reads MONGO_URI from process.env (set in .env).
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
