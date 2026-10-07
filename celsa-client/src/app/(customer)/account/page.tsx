"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { useAuthStore } from "@/stores/authStore";

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate, logout } = useAuthStore();
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    phone?: string;
    role?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        if (!useAuthStore.getState().isAuthenticated) {
          router.push("/login?next=/account");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    async function fetchMe() {
      if (!isAuthenticated) return;
      try {
        const res = await api.get("/auth/me");
        setProfile(res.data.user);
      } catch {
        if (user) {
          setProfile({ name: user.name, email: user.email, role: user.role });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, [isAuthenticated, user]);

  if (loading) {
    return <LoadingSkeleton variant="formCard" />;
  }

  return (
    <div className="container-fluid px-4 py-5" style={{ maxWidth: 720 }}>
      <h4 className="fw-bold mb-4">Account Settings</h4>

      {profile && (
        <div className="border rounded p-4 bg-white mb-4">
          <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div
              className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold fs-4"
              style={{ width: 60, height: 60 }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h5 className="fw-bold mb-0">{profile.name}</h5>
              <div className="text-muted small">{profile.email}</div>
              <span className="badge bg-secondary text-uppercase mt-1" style={{ fontSize: "0.65rem" }}>
                {profile.role || "Customer"}
              </span>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small text-muted">Full Name</label>
              <input className="form-control form-control-sm" value={profile.name} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label small text-muted">Email Address</label>
              <input className="form-control form-control-sm" value={profile.email} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label small text-muted">Phone Number</label>
              <input className="form-control form-control-sm" value={profile.phone || "Not set"} disabled />
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-danger" onClick={() => logout()}>
          <i className="bi bi-box-arrow-right me-2" />
          Log Out
        </button>
      </div>
    </div>
  );
}
