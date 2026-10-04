const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/email");

/**
 * Generate an access token (short-lived) and a refresh token (long-lived).
 */
function generateTokens(user) {
  const payload = {
    sub: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

  // Customer sessions expire in 1 day; staff/admin default to 7 days
  const isCustomer = user.role === "customer";
  const refreshExpiresIn = isCustomer
    ? process.env.JWT_CUSTOMER_REFRESH_EXPIRES_IN || "1d"
    : process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  const refreshToken = jwt.sign(
    { sub: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: refreshExpiresIn }
  );

  return { accessToken, refreshToken };
}

/**
 * Get cookie configuration options based on environment and user role.
 * Customers receive a 1-day cookie; staff/admin receive 7 days.
 */
function getCookieOptions(role) {
  const isProd = process.env.NODE_ENV === "production";
  const isCustomer = role === "customer";
  const maxAge = isCustomer
    ? 24 * 60 * 60 * 1000 // 1 day for customer portal
    : 7 * 24 * 60 * 60 * 1000; // 7 days for staff/admin

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: process.env.COOKIE_SAME_SITE || (isProd ? "none" : "lax"),
    maxAge,
    path: "/",
  };
}

/**
 * POST /api/auth/signup
 * Customer self-registration only. Staff/admin accounts are created
 * by an admin via /api/users.
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : "";

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password, // pre-save hook will bcrypt this
      role: "customer",
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie("celsa_refresh", refreshToken, getCookieOptions(user.role));

    res.status(201).json({
      message: "Account created successfully",
      accessToken,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    res.status(500).json({ error: "Could not create account. Please try again." });
  }
};

/**
 * POST /api/auth/login
 * Returns accessToken in JSON body and sets refreshToken as httpOnly cookie.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie("celsa_refresh", refreshToken, getCookieOptions(user.role));

    res.json({
      accessToken,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * POST /api/auth/refresh
 * Uses the httpOnly refresh cookie to issue a new access token.
 */
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.celsa_refresh;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    const tokens = generateTokens(user);

    // Rotate refresh token
    res.cookie("celsa_refresh", tokens.refreshToken, getCookieOptions(user.role));

    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};

/**
 * POST /api/auth/logout
 * Clears the refresh cookie.
 */
exports.logout = (_req, res) => {
  res.clearCookie("celsa_refresh", getCookieOptions());
  res.json({ message: "Logged out" });
};

/**
 * GET /api/auth/me
 * Returns the current user's profile (requires valid access token).
 */
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit verification code for password reset.
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    if (user.googleId && !user.passwordHash) {
      return res.status(400).json({
        error: "This account was registered using Google Sign-In. Please log in with Google.",
      });
    }

    // Generate secure 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity
    await user.save();

    // ✅ Respond IMMEDIATELY — don't wait for email to send
    // The code is already saved in the DB, so the customer can receive it regardless.
    res.json({
      message: "A 6-digit verification code has been sent to your email address. Please check your inbox.",
    });

    // Send email in the background (fire-and-forget — does not block response)
    sendPasswordResetEmail(user.email, resetCode, user.name)
      .then((result) => {
        if (!result.success) {
          console.error("[ERROR] Background email delivery failed:", result.error?.message);
        } else {
          console.log(`[EMAIL SERVICE] Code sent to ${user.email} (simulated: ${!!result.simulated})`);
        }
      })
      .catch((err) => {
        console.error("[ERROR] Unexpected email error:", err.message);
      });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
};

/**
 * POST /api/auth/reset-password
 * Verifies the 6-digit code and updates the user's password.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, 6-digit code, and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    if (
      !user.resetCode ||
      user.resetCode !== code.trim() ||
      !user.resetCodeExpires ||
      user.resetCodeExpires < new Date()
    ) {
      return res.status(400).json({
        error: "Invalid or expired verification code. Please request a new code.",
      });
    }

    // Update password (pre-save hook will hash it)
    user.passwordHash = newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.json({
      message: "Your password has been updated successfully! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
};

/**
 * GET /api/auth/google/callback
 * Handles Passport Google OAuth callback.
 * Issues JWT tokens and redirects user to frontend callback page.
 */
exports.googleCallback = async (req, res) => {
  const getClientUrl = () => {
    const raw = process.env.CLIENT_URL || "https://celsa-client-gznj.vercel.app";
    return raw.split(",")[0].trim().replace(/\/+$/, "");
  };

  try {
    const user = req.user;
    const clientUrl = getClientUrl();

    if (!user) {
      return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie("celsa_refresh", refreshToken, getCookieOptions(user.role));

    // Redirect to frontend auth callback page with accessToken
    res.redirect(`${clientUrl}/auth/callback?token=${accessToken}`);
  } catch (err) {
    console.error("Google Callback Error:", err);
    const clientUrl = getClientUrl();
    res.redirect(`${clientUrl}/login?error=google_auth_error`);
  }
};

