const express = require("express");
const multer = require("multer");
const { uploadBuffer } = require("../utils/cloudinary");
const verifyToken = require("../middleware/auth");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const folder = req.body.folder || "celsa/custom_orders";
    const result = await uploadBuffer(req.file.buffer, folder);

    res.json({
      url: result.url,
      publicId: result.publicId,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Failed to upload image" });
  }
});

module.exports = router;
