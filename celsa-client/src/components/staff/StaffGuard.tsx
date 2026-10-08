"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import AccessDenied from "@/components/shared/AccessDenied";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function StaffGuard({ children }: { children: React.ReactNode }) {
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

  if (checking) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh", backgroundColor: "#fcfaf6" }}
      >
        <LoadingSkeleton variant="spinner" />
      </div>
    );
  }

  // Strictly block anyone who is not staff or admin
  if (!isAuthenticated || !user || (user.role !== "staff" && user.role !== "admin")) {
    return <AccessDenied requiredRole="staff" />;
  }

  return <>{children}</>;
}
