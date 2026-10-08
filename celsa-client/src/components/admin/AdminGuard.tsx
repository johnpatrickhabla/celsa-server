"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import AccessDenied from "@/components/shared/AccessDenied";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
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

  // Unauthenticated (e.g. closed tab or expired session) -> redirect to login
  if (!isAuthenticated || !user) {
    if (typeof window !== "undefined") {
      router.replace("/login?next=/admin");
    }
    return null;
  }

  // Strictly block anyone who is logged in but not an admin (e.g. customer or staff)
  if (user.role !== "admin") {
    return <AccessDenied requiredRole="admin" />;
  }

  return <>{children}</>;
}
