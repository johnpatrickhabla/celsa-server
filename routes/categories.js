const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

// Public
router.get("/", categoryController.list);
router.get("/:id", categoryController.getById);

// Admin & Staff
router.post(
  "/",
  verifyToken,
  requireRole("admin", "staff"),
  [body("name").trim().notEmpty().withMessage("Category name is required")],
  validate,
  categoryController.create
);

router.put("/:id", verifyToken, requireRole("admin", "staff"), categoryController.update);
router.delete("/:id", verifyToken, requireRole("admin", "staff"), categoryController.remove);

module.exports = router;
