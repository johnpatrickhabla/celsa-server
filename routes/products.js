const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const productController = require("../controllers/productController");

const router = express.Router();

// Public routes
router.get("/", productController.list);
router.get("/:slug", productController.getBySlug);

// Admin routes
router.get("/admin/all", verifyToken, requireRole("admin"), productController.listAll);
router.get("/id/:id", verifyToken, requireRole("admin"), productController.getById);

router.post(
  "/",
  verifyToken,
  requireRole("admin"),
  [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("basePrice")
      .isFloat({ min: 0 })
      .withMessage("Base price must be a positive number"),
  ],
  validate,
  productController.create
);

router.put("/:id", verifyToken, requireRole("admin"), productController.update);
router.delete("/:id", verifyToken, requireRole("admin"), productController.remove);

module.exports = router;
