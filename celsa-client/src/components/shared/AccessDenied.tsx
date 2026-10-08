"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import AuthModal from "@/components/auth/AuthModal";

interface AccessDeniedProps {
  requiredRole?: "admin" | "staff";
  customMessage?: string;
}

export default function AccessDenied({
  requiredRole = "admin",
  customMessage,
}: AccessDeniedProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const roleLabel = requiredRole === "admin" ? "Administrator" : "Staff";

  return (
    <div
      className="d-flex align-items-center justify-content-center p-4"
      style={{
        minHeight: "100vh",
        backgroundColor: "#fcfaf6",
        backgroundImage: "radial-gradient(#ebdcc5 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 text-center p-4 p-md-5 bg-white position-relative overflow-hidden"
        style={{
          maxWidth: 520,
          width: "100%",
          border: "1.5px solid #ebdcc5",
        }}
      >
        {/* Top Accent Strip */}
        <div
          className="position-absolute top-0 start-0 w-100"
          style={{ height: 5, backgroundColor: "#dc3545" }}
        />

        {/* Security Shield Icon */}
        <div className="mb-3 d-inline-flex justify-content-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: 80,
              height: 80,
              backgroundColor: "rgba(220, 53, 69, 0.1)",
              color: "#dc3545",
            }}
          >
            <i className="bi bi-shield-lock-fill" style={{ fontSize: "2.5rem" }} />
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-2">
          <span
            className="badge rounded-pill px-3 py-1.5 fw-bold text-uppercase"
            style={{
              backgroundColor: "rgba(220, 53, 69, 0.12)",
              color: "#dc3545",
              letterSpacing: "1px",
              fontSize: "0.75rem",
            }}
          >
            403 • Access Forbidden
          </span>
        </div>

        {/* Main Heading */}
        <h3 className="fw-bold text-dark mb-2">Access Denied</h3>

        {/* Informative Explanation */}
        <p className="text-muted small mb-4 px-2" style={{ lineHeight: 1.6 }}>
          {customMessage ||
            `This section is restricted to authorized Celsa ${roleLabel} accounts only. You do not have sufficient permissions to view or interact with this portal.`}
        </p>

        {/* Current Account Details (if logged in as non-authorized user) */}
        {isAuthenticated && user && (
          <div
            className="p-3 rounded-3 text-start mb-4 border"
            style={{ backgroundColor: "#fdf8f4", borderColor: "#f3e1ce" }}
          >
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-person-circle text-muted" />
              <span className="small fw-semibold text-dark">
                Signed in as: <strong>{user.name}</strong>
              </span>
            </div>
            <div className="small text-muted mb-1 ms-4">{user.email}</div>
            <div className="ms-4">
              <span className="badge bg-secondary text-uppercase" style={{ fontSize: "0.68rem" }}>
                Role: {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
          {isAuthenticated && user?.role === "admin" ? (
            <Link
              href="/admin/dashboard"
              className="btn btn-outline-dark rounded-pill px-4 py-2 fw-semibold small shadow-sm"
            >
              <i className="bi bi-speedometer2 me-1.5" />
              Go to Admin Dashboard
            </Link>
          ) : isAuthenticated && user?.role === "staff" ? (
            <Link
              href="/staff/dashboard"
              className="btn btn-outline-dark rounded-pill px-4 py-2 fw-semibold small shadow-sm"
            >
              <i className="bi bi-speedometer2 me-1.5" />
              Go to Staff Dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="btn btn-outline-dark rounded-pill px-4 py-2 fw-semibold small shadow-sm"
            >
              <i className="bi bi-house-door me-1.5" />
              Back to Store
            </Link>
          )}

          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn-danger rounded-pill px-4 py-2 fw-semibold small shadow-sm"
              onClick={() => logout(true)}
            >
              <i className="bi bi-box-arrow-right me-1.5" />
              Sign Out & Switch Account
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-dark rounded-pill px-4 py-2 fw-semibold small shadow-sm"
              onClick={() => setShowLoginModal(true)}
            >
              <i className="bi bi-lock-fill me-1.5" />
              {roleLabel} Sign In
            </button>
          )}
        </div>
      </div>

      {/* Admin Login Modal (if user clicks Admin Sign In) */}
      {showLoginModal && (
        <AuthModal
          isOpen={showLoginModal}
          initialTab="login"
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            const currentUser = useAuthStore.getState().user;
            if (currentUser?.role === requiredRole) {
              window.location.reload();
            } else {
              window.location.href = "/";
            }
          }}
        />
      )}
    </div>
  );
}
