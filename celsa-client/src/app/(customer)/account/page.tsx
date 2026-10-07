"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { useAuthStore } from "@/stores/authStore";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";

interface UserAddress {
  street?: string;
  city?: string;
  province?: string;
  zip?: string;
}

interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  address?: UserAddress;
  createdAt?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate, logout, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Active settings tab
  const [activeTab, setActiveTab] = useState<"profile" | "address" | "security" | "orders">("profile");

  // Profile Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Address Form state
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zip, setZip] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSuccess, setAddressSuccess] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification Preferences (Client-side preference)
  const [orderEmailNotifs, setOrderEmailNotifs] = useState(true);
  const [promoEmailNotifs, setPromoEmailNotifs] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

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
        const userData = res.data.user;
        setProfile(userData);
        setName(userData.name || "");
        setPhone(userData.phone || "");
        setStreet(userData.address?.street || "");
        setCity(userData.address?.city || "");
        setProvince(userData.address?.province || "");
        setZip(userData.address?.zip || "");
      } catch {
        if (user) {
          setProfile({ name: user.name, email: user.email, role: user.role });
          setName(user.name || "");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, [isAuthenticated, user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await api.put("/auth/me", { name, phone });
      const updated = res.data.user;
      setProfile(updated);
      setUser(updated);
      setProfileSuccess("Personal information updated successfully!");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || "Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setSavingAddress(true);
    setAddressSuccess(null);
    setAddressError(null);

    try {
      const res = await api.put("/auth/me", {
        address: { street, city, province, zip },
      });
      const updated = res.data.user;
      setProfile(updated);
      setAddressSuccess("Default delivery address updated successfully!");
      setTimeout(() => setAddressSuccess(null), 4000);
    } catch (err: any) {
      setAddressError(err.response?.data?.error || "Failed to update address. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match. Please re-enter.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.data.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Failed to change password. Please verify current password.");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleSaveNotifs() {
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 3000);
  }

  if (loading) {
    return (
      <div className="container-fluid px-4 py-5" style={{ maxWidth: 900 }}>
        <LoadingSkeleton variant="formCard" />
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-5" style={{ maxWidth: 980 }}>
      <div
        className="rounded-4 p-4 p-md-5"
        style={{
          backgroundColor: "#fcfaf6",
          border: "1px solid #ebdcc5",
        }}
      >
        {/* Header Title */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: "#ebdcc5" }}>
          <div>
            <h4 className="fw-bold text-dark mb-1">
              Account <span style={{ color: "#198754" }}>Settings</span>
            </h4>
            <p className="text-muted small mb-0">
              Manage your profile, delivery addresses, security, and preferences.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center align-self-start align-self-md-auto"
            onClick={() => logout()}
          >
            <i className="bi bi-box-arrow-right me-2" />
            Log Out
          </button>
        </div>

        {/* User Quick Info Banner */}
        {profile && (
          <div
            className="rounded-4 p-3 p-md-4 mb-4 bg-white d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 shadow-sm border"
            style={{ borderColor: "#ebdcc5" }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold fs-3 shadow-sm flex-shrink-0"
                style={{
                  width: 64,
                  height: 64,
                  background: "linear-gradient(135deg, #198754, #146c43)",
                }}
              >
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h5 className="fw-bold mb-1 text-dark">{profile.name || "Customer"}</h5>
                <div className="text-muted small d-flex align-items-center gap-2">
                  <span>{profile.email}</span>
                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill fw-medium" style={{ fontSize: "0.68rem" }}>
                    <i className="bi bi-patch-check-fill me-1" />
                    Verified
                  </span>
                </div>
                <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                  Role: <strong className="text-uppercase text-secondary">{profile.role || "Customer"}</strong>
                  {profile.createdAt && (
                    <span className="ms-2">
                      • Member since {new Date(profile.createdAt).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Link href="/my-orders" className="btn btn-outline-success btn-sm rounded-pill px-3 fw-semibold">
                <i className="bi bi-receipt me-1" />
                My Orders
              </Link>
            </div>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div className="d-flex gap-2 border-bottom pb-2 mb-4 overflow-auto" style={{ borderColor: "#ebdcc5" }}>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
              activeTab === "profile" ? "btn-success" : "btn-light text-muted border bg-white"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <i className="bi bi-person me-1.5" />
            Profile &amp; Contact
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
              activeTab === "address" ? "btn-success" : "btn-light text-muted border bg-white"
            }`}
            onClick={() => setActiveTab("address")}
          >
            <i className="bi bi-geo-alt me-1.5" />
            Delivery Address
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
              activeTab === "security" ? "btn-success" : "btn-light text-muted border bg-white"
            }`}
            onClick={() => setActiveTab("security")}
          >
            <i className="bi bi-shield-lock me-1.5" />
            Password &amp; Security
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
              activeTab === "orders" ? "btn-success" : "btn-light text-muted border bg-white"
            }`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="bi bi-bell me-1.5" />
            Orders &amp; Notifications
          </button>
        </div>

        {/* ── TAB 1: PROFILE & CONTACT ── */}
        {activeTab === "profile" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: "1px solid #ebdcc5" }}>
            <h6 className="fw-bold text-dark mb-1">Personal Details</h6>
            <p className="text-muted small mb-4">
              Update your account name and phone number for shipping and order notifications.
            </p>

            {profileSuccess && (
              <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill fs-6 text-success" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle fs-6 text-danger" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="form-text small" style={{ fontSize: "0.72rem" }}>
                    Your primary display name for order transactions.
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-control rounded-3"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0912 345 6789"
                  />
                  <div className="form-text small" style={{ fontSize: "0.72rem" }}>
                    Used by courier couriers for delivery updates and GCash verification.
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold text-dark">
                    Email Address
                  </label>
                  <div className="input-group">
                    <input
                      type="email"
                      className="form-control rounded-start-3 bg-light"
                      value={profile?.email || ""}
                      disabled
                    />
                    <span className="input-group-text bg-light text-muted small border-start-0 rounded-end-3">
                      <i className="bi bi-lock me-1" />
                      Account Primary ID
                    </span>
                  </div>
                  <div className="form-text small" style={{ fontSize: "0.72rem" }}>
                    Email is linked to your authentication login and cannot be altered directly.
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 2: DELIVERY ADDRESS (RECOMMENDED) ── */}
        {activeTab === "address" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: "1px solid #ebdcc5" }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h6 className="fw-bold text-dark mb-0">Default Delivery Address</h6>
              <span className="badge bg-success bg-opacity-10 text-success small rounded-pill">Recommended</span>
            </div>
            <p className="text-muted small mb-4">
              Save your shipping address to automatically autofill upon checkout.
            </p>

            {addressSuccess && (
              <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill fs-6 text-success" />
                <span>{addressSuccess}</span>
              </div>
            )}
            {addressError && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle fs-6 text-danger" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress}>
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label small fw-semibold text-dark">
                    Street Address / House No. / Sitio
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Sitio Comon, Purok 2, Near Chapel"
                  />
                </div>

                <div className="col-md-5">
                  <label className="form-label small fw-semibold text-dark">
                    Barangay / City / Municipality
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Barcelona / Sorsogon City"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-dark">
                    Province
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="e.g. Sorsogon"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold text-dark">
                    Postal / ZIP Code
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="e.g. 4712"
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
                  disabled={savingAddress}
                >
                  {savingAddress ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-geo-alt me-1.5" />
                      Save Address
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 3: PASSWORD & SECURITY (RECOMMENDED) ── */}
        {activeTab === "security" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: "1px solid #ebdcc5" }}>
            <h6 className="fw-bold text-dark mb-1">Password &amp; Security</h6>
            <p className="text-muted small mb-4">
              Regularly update your password to protect your handicrafts orders and personal information.
            </p>

            {passwordSuccess && (
              <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill fs-6 text-success" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle fs-6 text-danger" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label small fw-semibold text-dark">Current Password</label>
                  <div className="input-group">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className="form-control rounded-start-3"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-end-3 px-3 bg-white border-start-0"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <i className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"} text-muted`} />
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">New Password</label>
                  <div className="input-group">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="form-control rounded-start-3"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-end-3 px-3 bg-white border-start-0"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"} text-muted`} />
                    </button>
                  </div>
                  {/* Dynamic Password Strength Indicator */}
                  <PasswordStrengthIndicator password={newPassword} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">Confirm New Password</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="form-control rounded-3"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Updating Password…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check me-1.5" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 4: ORDERS & NOTIFICATIONS (RECOMMENDED) ── */}
        {activeTab === "orders" && (
          <div className="d-flex flex-column gap-3">
            {/* Quick Order Hub */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: "1px solid #ebdcc5" }}>
              <h6 className="fw-bold text-dark mb-1">Quick Orders &amp; Craft Activities</h6>
              <p className="text-muted small mb-3">
                Review your purchases, delivery milestones, and custom artisan craft inquiries.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="border rounded-3 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-box-seam fs-4 text-success" />
                        <h6 className="fw-bold mb-0 text-dark">My Purchase Orders</h6>
                      </div>
                      <p className="small text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                        View live status (Pending, Crafting, Out for Delivery), order summaries, and payment receipts.
                      </p>
                    </div>
                    <Link href="/my-orders" className="btn btn-success btn-sm rounded-pill px-3 fw-semibold">
                      Track All Orders &rarr;
                    </Link>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="border rounded-3 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-palette fs-4 text-success" />
                        <h6 className="fw-bold mb-0 text-dark">Custom Handicrafts</h6>
                      </div>
                      <p className="small text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                        Submit unique specifications, preferred fiber materials, and custom dimensions.
                      </p>
                    </div>
                    <Link href="/custom-orders" className="btn btn-outline-success btn-sm rounded-pill px-3 fw-semibold">
                      New Custom Request &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: "1px solid #ebdcc5" }}>
              <h6 className="fw-bold text-dark mb-1">Email Notification Preferences</h6>
              <p className="text-muted small mb-3">
                Choose the emails you want to receive from Celsa Handicrafts.
              </p>

              {notifSuccess && (
                <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill fs-6 text-success" />
                  <span>Preferences saved successfully!</span>
                </div>
              )}

              <div className="d-flex flex-column gap-3 mb-3">
                <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
                  <div>
                    <label className="form-check-label fw-semibold text-dark d-block" htmlFor="orderNotifSwitch">
                      Order Milestones &amp; Tracking Alerts
                    </label>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      Get notified when your order is confirmed, crafted, or out for delivery.
                    </span>
                  </div>
                  <input
                    className="form-check-input ms-3 fs-5"
                    type="checkbox"
                    role="switch"
                    id="orderNotifSwitch"
                    checked={orderEmailNotifs}
                    onChange={(e) => setOrderEmailNotifs(e.target.checked)}
                  />
                </div>

                <hr className="my-1 text-muted opacity-25" />

                <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
                  <div>
                    <label className="form-check-label fw-semibold text-dark d-block" htmlFor="promoNotifSwitch">
                      Artisan News &amp; Seasonal Handicrafts
                    </label>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      Discover newly released baskets, woven bags, and festive holiday promos.
                    </span>
                  </div>
                  <input
                    className="form-check-input ms-3 fs-5"
                    type="checkbox"
                    role="switch"
                    id="promoNotifSwitch"
                    checked={promoEmailNotifs}
                    onChange={(e) => setPromoEmailNotifs(e.target.checked)}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm rounded-pill px-4 fw-semibold"
                  onClick={handleSaveNotifs}
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
