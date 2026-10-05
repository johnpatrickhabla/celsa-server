const express = require("express");
const HeroSlide = require("../models/HeroSlide");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const { deleteImage } = require("../utils/cloudinary");

const router = express.Router();

const DEFAULT_SLIDES = [
  {
    type: "image",
    mediaUrl: "/images/hero-basket.png",
    title: "Handcrafted Buri Basket",
    subtitle: "Woven by master artisans",
    linkUrl: "/products",
    order: 1,
    isActive: true,
  },
  {
    type: "image",
    mediaUrl: "/images/hero-bag.png",
    title: "Native Abaca Handbag",
    subtitle: "Eco-friendly, durable, and stylish",
    linkUrl: "/products",
    order: 2,
    isActive: true,
  },
  {
    type: "image",
    mediaUrl: "/images/hero-tray.png",
    title: "Decorative Handicraft Tray",
    subtitle: "Perfect centerpiece for your home",
    linkUrl: "/products",
    order: 3,
    isActive: true,
  },
];

async function ensureDefaultSlides() {
  const count = await HeroSlide.countDocuments();
  if (count === 0) {
    try {
      await HeroSlide.insertMany(DEFAULT_SLIDES);
    } catch (e) {
      console.warn("Failed to seed default hero slides:", e.message);
    }
  }
}

// ── GET /api/hero-slides (Public: Active slides only) ────────────────
router.get("/", async (req, res) => {
  try {
    await ensureDefaultSlides();
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json({ slides });
  } catch (err) {
    console.error("Fetch hero slides error:", err);
    res.status(500).json({ error: "Failed to fetch hero slides" });
  }
});

// ── GET /api/hero-slides/all (Admin & Staff: All slides) ─────────────
router.get("/all", verifyToken, requireRole("admin", "staff"), async (req, res) => {
  try {
    await ensureDefaultSlides();
    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 });
    res.json({ slides });
  } catch (err) {
    console.error("Fetch all hero slides error:", err);
    res.status(500).json({ error: "Failed to fetch hero slides" });
  }
});

// ── POST /api/hero-slides (Admin & Staff: Create slide) ──────────────
router.post("/", verifyToken, requireRole("admin", "staff"), async (req, res) => {
  try {
    const { type, mediaUrl, title, subtitle, linkUrl, order, isActive, publicId } = req.body;

    if (!mediaUrl || typeof mediaUrl !== "string" || !mediaUrl.trim()) {
      return res.status(400).json({ error: "Media URL or file is required" });
    }

    const slide = new HeroSlide({
      type: type === "video" ? "video" : "image",
      mediaUrl: mediaUrl.trim(),
      title: title ? title.trim() : "",
      subtitle: subtitle ? subtitle.trim() : "",
      linkUrl: linkUrl ? linkUrl.trim() : "",
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
      isActive: isActive !== false,
      publicId: publicId || "",
      createdBy: req.user._id,
    });

    await slide.save();
    res.status(201).json({ slide, message: "Hero slide created successfully" });
  } catch (err) {
    console.error("Create hero slide error:", err);
    res.status(500).json({ error: err.message || "Failed to create hero slide" });
  }
});

// ── PUT /api/hero-slides/:id (Admin & Staff: Update slide) ───────────
router.put("/:id", verifyToken, requireRole("admin", "staff"), async (req, res) => {
  try {
    const { type, mediaUrl, title, subtitle, linkUrl, order, isActive, publicId } = req.body;

    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ error: "Hero slide not found" });
    }

    if (type) slide.type = type === "video" ? "video" : "image";
    if (mediaUrl) slide.mediaUrl = mediaUrl.trim();
    if (title !== undefined) slide.title = title ? title.trim() : "";
    if (subtitle !== undefined) slide.subtitle = subtitle ? subtitle.trim() : "";
    if (linkUrl !== undefined) slide.linkUrl = linkUrl ? linkUrl.trim() : "";
    if (order !== undefined) slide.order = Number(order) || 0;
    if (isActive !== undefined) slide.isActive = Boolean(isActive);
    if (publicId !== undefined) slide.publicId = publicId;

    await slide.save();
    res.json({ slide, message: "Hero slide updated successfully" });
  } catch (err) {
    console.error("Update hero slide error:", err);
    res.status(500).json({ error: err.message || "Failed to update hero slide" });
  }
});

// ── DELETE /api/hero-slides/:id (Admin & Staff: Delete slide) ────────
router.delete("/:id", verifyToken, requireRole("admin", "staff"), async (req, res) => {
  try {
    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ error: "Hero slide not found" });
    }

    if (slide.publicId) {
      await deleteImage(slide.publicId, slide.type);
    }

    await slide.deleteOne();
    res.json({ message: "Hero slide deleted successfully" });
  } catch (err) {
    console.error("Delete hero slide error:", err);
    res.status(500).json({ error: err.message || "Failed to delete hero slide" });
  }
});

// ── PATCH /api/hero-slides/reorder (Admin & Staff: Reorder slides) ───
router.patch("/reorder", verifyToken, requireRole("admin", "staff"), async (req, res) => {
  try {
    const { orderList } = req.body; // [{ id, order }]
    if (!Array.isArray(orderList)) {
      return res.status(400).json({ error: "orderList array is required" });
    }

    const updates = orderList.map((item) =>
      HeroSlide.findByIdAndUpdate(item.id, { order: Number(item.order) || 0 })
    );
    await Promise.all(updates);

    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 });
    res.json({ slides, message: "Slides reordered successfully" });
  } catch (err) {
    console.error("Reorder hero slides error:", err);
    res.status(500).json({ error: err.message || "Failed to reorder hero slides" });
  }
});

module.exports = router;
