const express = require("express");
const multer = require("multer");
const { uploadBuffer } = require("../utils/cloudinary");
const verifyToken = require("../middleware/auth");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB maximum limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

router.post("/", verifyToken, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File exceeds the 60MB limit. Please upload a video under 60MB." });
      }
      return res.status(400).json({ error: err.message || "File upload error" });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No media file provided" });
    }

    if (req.file.size > 60 * 1024 * 1024) {
      return res.status(400).json({ error: "Video exceeds 60MB limit." });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const resourceType = isVideo ? "video" : "image";
    const folder = req.body.folder || (isVideo ? "celsa/hero_videos" : "celsa/hero_slides");

    const result = await uploadBuffer(req.file.buffer, folder, resourceType);

    res.json({
      url: result.url,
      publicId: result.publicId,
      resourceType,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Failed to upload media" });
  }
});

module.exports = router;
