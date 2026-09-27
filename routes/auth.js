const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const verifyToken = require("../middleware/auth");
const authController = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/signup — customer self-registration
router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  authController.signup
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  authController.login
);

// POST /api/auth/refresh — exchange refresh cookie for new access token
router.post("/refresh", authController.refresh);

// POST /api/auth/logout — clear refresh cookie
router.post("/logout", authController.logout);

// GET /api/auth/me — current user profile (requires access token)
router.get("/me", verifyToken, authController.me);

// POST /api/auth/forgot-password — password reset request
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  authController.forgotPassword
);

module.exports = router;
