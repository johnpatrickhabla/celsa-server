"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { login } = useAuthStore();
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
      await login(email, password);
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
      const msg = err.response?.data?.error || "Invalid email or password.";
      setError(msg);
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 400 }}
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
              Welcome back! Log in to your account
            </small>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Google Option */}
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

            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="mb-3">
                <label className="form-label small">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-success w-100 rounded-3 py-2 fw-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Logging in…
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <p className="small text-center mt-3 mb-0">
              No account?{" "}
              <Link href="/signup" onClick={onClose} className="text-success fw-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
