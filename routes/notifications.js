const express = require("express");
const verifyToken = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authenticated user
router.use(verifyToken);

router.get("/", notificationController.getMyNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
