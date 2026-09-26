require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// ── Route imports ────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const inventoryRoutes = require("./routes/inventory");
const dashboardRoutes = require("./routes/dashboard");
const uploadRoutes = require("./routes/upload");
const notificationRoutes = require("./routes/notifications");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global middleware ────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, server-to-server, or Postman)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true, // allow cookies (refresh token)
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({
  limit: "10mb",
  // Preserve raw body for webhook signature verification (PayMongo)
  verify: (req, _res, buf) => {
    if (req.originalUrl && req.originalUrl.includes("/webhook")) {
      req.rawBody = buf;
    }
  },
}));
app.use(express.urlencoded({ extended: true }));

// Rate-limit auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 30 : 500, // Generous during development
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
  skip: (req) => req.path === "/me" || req.path === "/refresh" || req.path === "/logout",
});

// ── API routes ───────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 catch-all ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── Start server ─────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Celsa API running on http://localhost:${PORT}`);
  });
});
