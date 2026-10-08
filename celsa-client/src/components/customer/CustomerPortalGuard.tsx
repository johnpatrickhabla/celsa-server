"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function CustomerPortalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, hydrate } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    hydrate().finally(() => {
      if (mounted) setChecking(false);
    });
    return () => {
      mounted = false;
    };
  }, [hydrate]);

  useEffect(() => {
    if (!checking && isAuthenticated && user) {
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.role === "staff") {
        router.replace("/staff/dashboard");
      }
    }
  }, [checking, isAuthenticated, user, router]);

  // If user is admin or staff, block rendering customer storefront and redirect
  if (!checking && isAuthenticated && (user?.role === "admin" || user?.role === "staff")) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center p-4 text-center"
        style={{ minHeight: "100vh", backgroundColor: "#fcfaf6" }}
      >
        <div className="spinner-border text-success mb-3" role="status" />
        <h6 className="fw-bold text-dark mb-1">Redirecting to Dashboard…</h6>
        <p className="text-muted small mb-0">
          Administrator and Staff accounts do not have access to the customer storefront.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
