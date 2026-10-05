"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "signup" | "forgot";
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = "login",
  onSuccess,
}: AuthModalProps) {
  const { login, signup } = useAuthStore();
  const [tab, setTab] = useState<"login" | "signup" | "forgot">(initialTab);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Forgot / Reset Password flow states
  const [forgotStep, setForgotStep] = useState<"request" | "code" | "password">("request");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const resetCode = codeDigits.join("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setShowNewPassword(false);
    setForgotStep("request");
    setCodeDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "idle_timeout") {
        setNotice("You were automatically signed out after 15 minutes of inactivity.");
      } else if (params.get("error") === "google_auth_failed") {
        setError("Google authentication failed. Please try again.");
      }
    }
  }, [initialTab, isOpen]);

  // Countdown for the "Resend code" button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Autofocus first code box when entering the code step
  useEffect(() => {
    if (forgotStep === "code") {
      setTimeout(() => codeInputsRef.current[0]?.focus(), 50);
    }
  }, [forgotStep]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (tab === "login") {
        await login(email, password);
      } else if (tab === "signup") {
        await signup(name, email, password);
      }
      setLoading(false);
      const user = useAuthStore.getState().user;
      if (user?.role === "admin") {
        window.location.href = "/admin/dashboard";
        return;
      }
      if (user?.role === "staff") {
        window.location.href = "/staff/dashboard";
        return;
      }
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err: any) {
      setLoading(false);
      const msg =
        err.response?.data?.details?.[0]?.message ||
        err.response?.data?.error ||
        (tab === "login" ? "Invalid email or password." : "Could not create account. Please try again.");
      setError(msg);
    }
  }

  async function handleForgotPassword(e?: React.FormEvent, overrideEmail?: string) {
    if (e) e.preventDefault();
    const targetEmail = (overrideEmail || email || "").trim();

    if (!targetEmail) {
      setTab("forgot");
      setForgotStep("request");
      setError("Please enter your registered email address.");
      return;
    }

    setTab("forgot");
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post("/auth/forgot-password", { email: targetEmail });
      setForgotStep("code");
      setCodeDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setSuccessMsg(res.data.message || `A 6-digit verification code has been sent to ${targetEmail}.`);
    } catch (err: any) {
      setForgotStep("request");
      const msg = err.response?.data?.error || "Could not process request. Please verify your email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setCodeDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setSuccessMsg("A new 6-digit code has been sent to your email.");
      codeInputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    const next = [...codeDigits];

    if (digits.length > 1) {
      // Handle paste / autofill of multiple digits
      for (let i = 0; i < 6 - index && i < digits.length; i++) {
        next[index + i] = digits[i];
      }
      setCodeDigits(next);
      const focusIdx = Math.min(index + digits.length, 5);
      codeInputsRef.current[focusIdx]?.focus();
      return;
    }

    next[index] = digits;
    setCodeDigits(next);
    if (digits && index < 5) codeInputsRef.current[index + 1]?.focus();
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(resetCode)) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post("/auth/verify-reset-code", { email, code: resetCode });
      setSuccessMsg(res.data.message || "Code verified! You can now set a new password.");
      setForgotStep("password");
    } catch (err: any) {
      const msg =
        err.response?.data?.details?.[0]?.message ||
        err.response?.data?.error ||
        "Invalid verification code. Please try again.";
      setError(msg);
      setCodeDigits(["", "", "", "", "", ""]);
      codeInputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(resetCode)) {
      setError("Please enter the 6-digit verification code.");
      setForgotStep("code");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-check.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        code: resetCode.trim(),
        newPassword,
      });
      setLoading(false);
      setSuccessMsg(res.data.message || "Your password has been updated! Please log in with your new password.");
      setTab("login");
      setForgotStep("request");
      setCodeDigits(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setLoading(false);
      const msg = err.response?.data?.error || "Failed to reset password. Please verify the code and try again.";
      setError(msg);
      // Code likely expired/invalid — send user back to the code step
      if (err.response?.status === 400 && /code/i.test(msg)) {
        setForgotStep("code");
        setCodeDigits(["", "", "", "", "", ""]);
      }
    }
  }

  function handleGoogleLogin() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://celsa-server.onrender.com/api";
    window.location.href = `${backendUrl}/auth/google`;
  }


  return (
    <div
      className="modal fade show d-block bg-black bg-opacity-50"
      tabIndex={-1}
      style={{ zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered mx-auto px-3" style={{ maxWidth: 430, width: "100%" }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
          {/* Header */}
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex flex-column align-items-stretch">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="d-flex flex-column mb-1">
                  <span className="fw-bold text-dark fs-4 lh-1" style={{ letterSpacing: "1px" }}>
                    CELSA
                  </span>
                  <span
                    className="text-uppercase fw-semibold mt-1"
                    style={{
                      letterSpacing: "3px",
                      fontSize: "0.72rem",
                      color: "#73511f",
                    }}
                  >
                    Handicrafts
                  </span>
                </div>
                <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>
                  {tab === "login"
                    ? "Welcome back! Log in to your account"
                    : tab === "signup"
                    ? "Create your customer account"
                    : forgotStep === "code"
                    ? "Verify it's really you"
                    : forgotStep === "password"
                    ? "Set a new password for your account"
                    : "Recover your account access"}
                </small>
              </div>
              <button
                type="button"
                className="btn-close mt-1"
                onClick={onClose}
                aria-label="Close"
                title="Close"
              />
            </div>
          </div>

          {/* Form Body */}
          <div className="modal-body p-4">
            {tab === "forgot" ? (
              /* Forgot Password View */
              <div>
                {forgotStep === "request" ? (
                  <>
                    <div className="text-center mb-3">
                      <div
                        className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 44, height: 44 }}
                      >
                        <i className="bi bi-shield-lock-fill fs-4" />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">Forgot Your Password?</h6>
                      <p className="text-muted small mb-0">
                        Enter your registered email address and we&apos;ll send a 6-digit verification code to your email inbox.
                      </p>
                    </div>

                    {successMsg && (
                      <div className="alert alert-success py-2 px-3 small rounded-3 mb-3">
                        <i className="bi bi-check-circle-fill me-1" />
                        {successMsg}
                      </div>
                    )}

                    {error && (
                      <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                        <i className="bi bi-exclamation-circle me-1" />
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleForgotPassword} autoComplete="off">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">Registered Email</label>
                        <input
                          type="email"
                          className="form-control rounded-3"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="off"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-success w-100 rounded-3 py-2 fw-bold shadow-sm mb-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Sending Code…
                          </>
                        ) : (
                          "Send Verification Code"
                        )}
                      </button>
                    </form>
                  </>
                ) : forgotStep === "code" ? (
                  /* ── Step 2: Enter the 6-digit code ── */
                  <>
                    <div className="text-center mb-3">
                      <div
                        className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 44, height: 44 }}
                      >
                        <i className="bi bi-envelope-check-fill fs-4" />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">Enter Verification Code</h6>
                      <p className="text-muted small mb-0">
                        We sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.
                      </p>
                    </div>

                    {successMsg && (
                      <div className="alert alert-success py-2 px-3 small rounded-3 mb-3">
                        <i className="bi bi-check-circle-fill me-1" />
                        {successMsg}
                      </div>
                    )}

                    {error && (
                      <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                        <i className="bi bi-exclamation-circle me-1" />
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleVerifyCode} autoComplete="off">
                      <div className="d-flex justify-content-center gap-1 gap-sm-2 mb-3">
                        {codeDigits.map((digit, i) => (
                          <input
                            key={i}
                            id={`reset-code-digit-${i}`}
                            ref={(el) => {
                              codeInputsRef.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete={i === 0 ? "one-time-code" : "off"}
                            maxLength={i === 0 ? 6 : 1}
                            value={digit}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleCodeKeyDown(i, e)}
                            onFocus={(e) => e.target.select()}
                            className={`form-control text-center fw-bold fs-4 rounded-3 p-0 ${
                              digit ? "border-success" : ""
                            }`}
                            style={{
                              width: "clamp(36px, 11vw, 48px)",
                              height: "clamp(46px, 13vw, 56px)",
                            }}
                            aria-label={`Digit ${i + 1}`}
                          />
                        ))}
                      </div>

                      {/* Resend button placed directly below the 6-Digit Verification Code */}
                      <div className="text-center small text-muted mb-3">
                        Didn&apos;t get the code?{" "}
                        <button
                          id="resend-code-btn"
                          type="button"
                          className="btn btn-link text-decoration-none text-success small p-0 fw-semibold align-baseline"
                          onClick={handleResendCode}
                          disabled={resendCooldown > 0 || loading}
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                        </button>
                      </div>

                      <button
                        id="verify-code-btn"
                        type="submit"
                        className="btn btn-success w-100 rounded-3 py-2 fw-bold shadow-sm mb-0"
                        disabled={loading || resetCode.length !== 6}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Verifying…
                          </>
                        ) : (
                          "Verify Code"
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  /* ── Step 3: Set new password (only after code is verified) ── */
                  <>
                    <div className="text-center mb-3">
                      <div
                        className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 44, height: 44 }}
                      >
                        <i className="bi bi-key-fill fs-4" />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">Create New Password</h6>
                      <p className="text-muted small mb-0">
                        Choose a new password for <strong>{email}</strong>.
                      </p>
                    </div>

                    {successMsg && (
                      <div className="alert alert-success py-2 px-3 small rounded-3 mb-3">
                        <i className="bi bi-check-circle-fill me-1" />
                        {successMsg}
                      </div>
                    )}

                    {error && (
                      <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                        <i className="bi bi-exclamation-circle me-1" />
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleResetPassword} autoComplete="off">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">New Password</label>
                        <div className="input-group">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            className="form-control rounded-start-3"
                            placeholder="At least 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary rounded-end-3 px-3 bg-white border-start-0 d-flex align-items-center justify-content-center"
                            style={{ borderColor: "#dee2e6" }}
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            title={showNewPassword ? "Hide password" : "Show password"}
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            <i className={`bi ${showNewPassword ? "bi-eye-slash text-secondary" : "bi-eye text-muted"} fs-6`} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">Confirm New Password</label>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="form-control rounded-3"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                          minLength={8}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-success w-100 rounded-3 py-2 fw-bold shadow-sm mb-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Updating Password…
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              /* Login & Signup Form Views */
              <div>
                {/* Google Option - Login only */}
                {tab === "login" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2 mb-3 bg-white"
                      onClick={handleGoogleLogin}
                      style={{ borderColor: "#dadce0" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span className="fw-semibold text-dark small">Continue with Google</span>
                    </button>

                    <div className="d-flex align-items-center my-3">
                      <hr className="flex-grow-1 my-0 text-muted opacity-25" />
                      <span className="px-2 text-muted small" style={{ fontSize: "0.7rem" }}>
                        OR EMAIL
                      </span>
                      <hr className="flex-grow-1 my-0 text-muted opacity-25" />
                    </div>
                  </>
                )}

                {notice && (
                  <div className="alert alert-warning py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-clock-history fs-6 flex-shrink-0" />
                    <span>{notice}</span>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                    <i className="bi bi-exclamation-circle me-1" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} autoComplete="off">
                  {tab === "signup" && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark">Full Name</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="Juan Dela Cruz"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="off"
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Email Address</label>
                    <input
                      type="email"
                      className="form-control rounded-3"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-dark mb-0">Password</label>
                      {tab === "login" && (
                        <button
                          type="button"
                          className="btn btn-link p-0 text-success text-decoration-none small"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => {
                            if (email && email.trim().includes("@")) {
                              handleForgotPassword(undefined, email.trim());
                            } else {
                              setTab("forgot");
                              setForgotStep("request");
                              setError(null);
                              setSuccessMsg(null);
                            }
                          }}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control rounded-start-3"
                        placeholder={tab === "signup" ? "At least 8 characters" : "Enter your password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={tab === "signup" ? 8 : 1}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-end-3 px-3 bg-white border-start-0 d-flex align-items-center justify-content-center"
                        style={{ borderColor: "#dee2e6" }}
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <i className={`bi ${showPassword ? "bi-eye-slash text-secondary" : "bi-eye text-muted"} fs-6`} />
                      </button>
                    </div>
                    {tab === "signup" && (
                      <div className="form-text" style={{ fontSize: "0.7rem" }}>
                        Must be at least 8 characters long.
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 rounded-3 py-2 fw-bold shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {tab === "login" ? "Logging in…" : "Creating Account…"}
                      </>
                    ) : (
                      <>{tab === "login" ? "Log In" : "Create Account"}</>
                    )}
                  </button>
                </form>

                <div className="text-center mt-3 pt-2 border-top">
                  <small className="text-muted">
                    {tab === "login" ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          className="btn btn-link p-0 text-success fw-semibold text-decoration-none small ms-1"
                          onClick={() => {
                            setTab("signup");
                            setError(null);
                            setSuccessMsg(null);
                          }}
                        >
                          Sign up here
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="btn btn-link p-0 text-success fw-semibold text-decoration-none small ms-1"
                          onClick={() => {
                            setTab("login");
                            setError(null);
                            setSuccessMsg(null);
                          }}
                        >
                          Log in here
                        </button>
                      </>
                    )}
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
