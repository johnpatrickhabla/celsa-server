"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import AuthModal from "@/components/auth/AuthModal";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated && user && !justLoggedIn) {
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "staff") {
        router.push("/staff/dashboard");
      } else {
        // Customer
        if (nextPath?.startsWith("/admin") || nextPath?.startsWith("/staff")) {
          router.push(`/unauthorized?from=${encodeURIComponent(nextPath)}`);
        } else {
          router.push(nextPath || "/my-orders");
        }
      }
    }
  }, [isAuthenticated, user, nextPath, router, justLoggedIn]);

  function handleClose() {
    router.push("/");
  }

  return (
    <div style={{ minHeight: "80vh" }}>
      {isAuthenticated && user && !justLoggedIn ? (
        <div className="container" style={{ maxWidth: 420, marginTop: "6rem" }}>
          <div className="card border-0 shadow shadow-sm rounded-4 p-4 text-center bg-white">
            <i className="bi bi-person-check fs-1 text-success mb-3" />
            <h5 className="fw-bold text-dark">Already Logged In</h5>
            <p className="text-muted small mb-4">
              You are currently logged in as <strong>{user.name}</strong> ({user.email}).
            </p>
            <div className="d-flex flex-column gap-2">
              <Link href="/my-orders" className="btn btn-success btn-sm py-2 rounded-3 small">
                View Orders
              </Link>
              <Link href="/" className="btn btn-outline-secondary btn-sm py-2 rounded-3 small">
                Go to Homepage
              </Link>
              <button
                onClick={() => logout()}
                className="btn btn-danger btn-sm py-2 rounded-3 small fw-semibold"
              >
                Log Out of this Account
              </button>
            </div>
          </div>
        </div>
      ) : (
        <AuthModal
          isOpen={true}
          initialTab="login"
          onClose={handleClose}
          onSuccess={() => {
            setJustLoggedIn(true);
            const currentUser = useAuthStore.getState().user;
            if (!currentUser) return;

            if (currentUser.role === "admin") {
              router.push("/admin/dashboard");
            } else if (currentUser.role === "staff") {
              router.push("/staff/dashboard");
            } else {
              // Customer: strictly disallow redirection to admin/staff
              if (nextPath?.startsWith("/admin") || nextPath?.startsWith("/staff")) {
                router.push(`/unauthorized?from=${encodeURIComponent(nextPath)}`);
              } else {
                router.push(nextPath || "/my-orders");
              }
            }
          }}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="spinner" />}>
      <LoginPageContent />
    </Suspense>
  );
}
