const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const userController = require("../controllers/userController");

const router = express.Router();

// All user-management routes require admin role
router.use(verifyToken, requireRole("admin"));

// GET /api/users?role=staff&page=1&limit=20&search=...
router.get("/", userController.list);

// GET /api/users/:id
router.get("/:id", userController.getById);

// POST /api/users — create staff/admin account
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .isIn(["staff", "admin"])
      .withMessage("Role must be staff or admin"),
  ],
  validate,
  userController.create
);

// PUT /api/users/:id
router.put("/:id", userController.update);

// DELETE /api/users/:id — soft-delete (deactivate)
router.delete("/:id", userController.remove);

module.exports = router;
