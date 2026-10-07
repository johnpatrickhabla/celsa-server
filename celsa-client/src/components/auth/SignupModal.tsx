"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onSuccess?: () => void;
}

export default function SignupModal({
  isOpen,
  onClose,
  onOpenLogin,
  onSuccess,
}: SignupModalProps) {
  const { signup, login } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signup(name, email, password);
      // Auto-log in after registration
      await login(email, password);
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setLoading(false);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { error: string } } }).response?.data?.error
          : "Could not create account. Try a different email.";
      setError(msg || "Could not create account.");
    }
  }

  function handleGoogleSignup() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://celsa-server.onrender.com/api";
    window.location.href = `${backendUrl}/auth/google`;
  }

  return (
    <div
      className="modal fade show d-block bg-black bg-opacity-50"
      tabIndex={-1}
      style={{ zIndex: 1060 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 420 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex flex-column align-items-center text-center">
            <div className="d-flex flex-column align-items-center mb-1">
              <span className="fw-bold text-dark fs-3 lh-1" style={{ letterSpacing: "1.5px" }}>
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
            <small className="text-muted d-block mt-1" style={{ fontSize: "0.8rem" }}>
              Create your customer account
            </small>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Google Signup Button */}
            <button
              type="button"
              className="btn btn-outline-secondary w-100 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 mb-3 bg-white hover-shadow transition-all"
              onClick={handleGoogleSignup}
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
              <span className="fw-semibold text-dark small">Sign Up with Google</span>
            </button>

            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1 my-0 text-muted opacity-25" />
              <span className="px-2 text-muted small" style={{ fontSize: "0.75rem" }}>
                OR SIGN UP WITH EMAIL
              </span>
              <hr className="flex-grow-1 my-0 text-muted opacity-25" />
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                <i className="bi bi-exclamation-circle me-1" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg fs-6 rounded-3"
                  placeholder="Juan Dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control form-control-lg fs-6 rounded-3"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-muted">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control form-control-lg fs-6 rounded-3"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className="btn btn-success btn-lg w-100 fs-6 fw-bold rounded-3 py-3 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="text-center mt-3 pt-2 border-top">
              <small className="text-muted">
                Already have an account?{" "}
                <button
                  type="button"
                  className="btn btn-link p-0 text-success fw-semibold text-decoration-none small ms-1"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                >
                  Log In Here
                </button>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
