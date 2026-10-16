"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import AccessDenied from "@/components/shared/AccessDenied";
import PageLoader from "@/components/shared/PageLoader";

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
    return <PageLoader />;
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
    if (typeof window !== "undefined") {
      router.replace("/?shein_error=not_found");
    }
    return null;
  }

  return <>{children}</>;
}
