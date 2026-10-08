"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "@/stores/authStore";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    async function processAuth() {
      if (error) {
        console.error("Google authentication error:", error);
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (token) {
        try {
          const payload = jwtDecode<{ role?: string }>(token);
          if (payload?.role === "admin" || payload?.role === "staff") {
            sessionStorage.setItem("celsa_access_token", token);
            localStorage.removeItem("celsa_access_token");
            document.cookie = `celsa_token=${token}; path=/; SameSite=Lax`;
          } else {
            localStorage.setItem("celsa_access_token", token);
            sessionStorage.removeItem("celsa_access_token");
            document.cookie = `celsa_token=${token}; path=/; max-age=86400; SameSite=Lax`;
          }
        } catch {
          localStorage.setItem("celsa_access_token", token);
          document.cookie = `celsa_token=${token}; path=/; SameSite=Lax`;
        }
        await hydrate();

        const user = useAuthStore.getState().user;
        const destination =
          user?.role === "admin"
            ? "/admin/dashboard"
            : user?.role === "staff"
            ? "/staff/dashboard"
            : "/my-orders";

        router.push(destination);
      } else {
        router.push("/login");
      }
    }

    processAuth();
  }, [token, error, hydrate, router]);

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "60vh" }}
    >
      <div className="spinner-border text-warning mb-3" role="status">
        <span className="visually-hidden">Completing Google Sign-In...</span>
      </div>
      <p className="text-muted fw-semibold">Completing Google Authentication...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="spinner" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
