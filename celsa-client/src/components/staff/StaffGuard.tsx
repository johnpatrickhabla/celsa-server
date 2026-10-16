"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import AccessDenied from "@/components/shared/AccessDenied";
import PageLoader from "@/components/shared/PageLoader";

export default function StaffGuard({ children }: { children: React.ReactNode }) {
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
    return <PageLoader />;
  }

  // Unauthenticated (e.g. closed tab or expired session) -> redirect to login
  if (!isAuthenticated || !user) {
    if (typeof window !== "undefined") {
      router.replace("/login?next=/staff");
    }
    return null;
  }

  // Strictly block anyone who is not staff or admin
  if (user.role !== "staff" && user.role !== "admin") {
    return <AccessDenied requiredRole="staff" />;
  }

  return <>{children}</>;
}
