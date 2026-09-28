const express = require("express");
const { body } = require("express-validator");
const passport = require("passport");
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

// GET /api/auth/google — initiate Google OAuth flow
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /api/auth/google/callback — handle Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/failure" }),
  authController.googleCallback
);

// GET /api/auth/google/failure
router.get("/google/failure", (_req, res) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  res.redirect(`${clientUrl}/login?error=google_auth_failed`);
});

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

