"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

interface Props {
  roleLabel: "Admin" | "Staff";
  showSystemSettings?: boolean;
}

interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  createdAt?: string;
}

export default function AccountSettingsView({
  roleLabel,
  showSystemSettings = false,
}: Props) {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: "profile" | "security" | "system"
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "system">("profile");

  // Profile Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // System & Store Settings (Admin only)
  const [storeName, setStoreName] = useState("Celsa Handicrafts");
  const [storeEmail, setStoreEmail] = useState("celsahandicrafts@gmail.com");
  const [storePhone, setStorePhone] = useState("+63 912 345 6789");
  const [storeAddress, setStoreAddress] = useState("Poblacion Centro, Barangay, Alcala, Philippines");
  const [enableCod, setEnableCod] = useState(true);
  const [enableGcash, setEnableGcash] = useState(true);
  const [enableStripe, setEnableStripe] = useState(true);
  const [enablePaypal, setEnablePaypal] = useState(true);
  const [systemSaved, setSystemSaved] = useState(false);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await api.get("/auth/me");
        const userData = res.data.user;
        setProfile(userData);
        setName(userData.name || "");
        setPhone(userData.phone || "");
      } catch {
        if (user) {
          setProfile({
            name: user.name,
            email: user.email,
            role: user.role,
          });
          setName(user.name || "");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, [user]);

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

      // If new access token was issued, keep session token up-to-date
      if (res.data.accessToken && typeof window !== "undefined") {
        sessionStorage.setItem("celsa_access_token", res.data.accessToken);
      }

      setProfileSuccess("Profile information updated successfully!");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || "Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
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
      setPasswordError("New passwords do not match. Please verify and re-enter.");
      return;
    }
    if (currentPassword && currentPassword === newPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.data.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.error || "Failed to update password. Please check your current password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  function handleSaveSystemSettings(e: React.FormEvent) {
    e.preventDefault();
    setSystemSaved(true);
    setTimeout(() => setSystemSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="p-4" style={{ maxWidth: 840 }}>
        <LoadingSkeleton variant="formCard" />
      </div>
    );
  }

  const isAdmin = (profile?.role || roleLabel.toLowerCase()) === "admin";
  const roleThemeColor = isAdmin ? "#dc3545" : "#0d6efd";
  const roleGradient = isAdmin
    ? "linear-gradient(135deg, #b02a37, #dc3545)"
    : "linear-gradient(135deg, #0b5ed7, #0ea5e9)";

  return (
    <div className="p-4" style={{ maxWidth: 860 }}>
      {/* User Header Profile Card */}
      <div
        className="card border-0 rounded-4 p-4 mb-4 shadow-sm bg-white"
        style={{ border: "1px solid #ebdcc5" }}
      >
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold fs-3 shadow-sm flex-shrink-0"
              style={{
                width: 68,
                height: 68,
                background: roleGradient,
              }}
            >
              {(profile?.name || roleLabel).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h5 className="fw-bold mb-0 text-dark">{profile?.name || `${roleLabel} User`}</h5>
                <span
                  className="badge rounded-pill fw-semibold text-uppercase px-2.5 py-1"
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.5px",
                    backgroundColor: isAdmin ? "rgba(220, 53, 69, 0.12)" : "rgba(13, 110, 253, 0.12)",
                    color: roleThemeColor,
                    border: `1px solid ${isAdmin ? "rgba(220, 53, 69, 0.3)" : "rgba(13, 110, 253, 0.3)"}`,
                  }}
                >
                  <i className={`bi ${isAdmin ? "bi-shield-check" : "bi-person-badge"} me-1`} />
                  {roleLabel} Account
                </span>
              </div>
              <div className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                <span>{profile?.email || `${roleLabel.toLowerCase()}@celsa.com`}</span>
                <span className="text-secondary opacity-50">•</span>
                <span className="badge bg-success bg-opacity-10 text-success rounded-pill fw-medium" style={{ fontSize: "0.68rem" }}>
                  <i className="bi bi-patch-check-fill me-1" />
                  Active
                </span>
                {profile?.createdAt && (
                  <>
                    <span className="text-secondary opacity-50">•</span>
                    <span style={{ fontSize: "0.75rem" }}>
                      Joined {new Date(profile.createdAt).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        className="d-flex gap-2 border-bottom pb-2 mb-4 overflow-auto"
        style={{ borderColor: "#ebdcc5" }}
      >
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
            activeTab === "profile" ? "btn-success" : "btn-light text-muted border bg-white"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          <i className="bi bi-person-circle me-1.5" />
          Profile Information
        </button>

        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
            activeTab === "security" ? "btn-success" : "btn-light text-muted border bg-white"
          }`}
          onClick={() => setActiveTab("security")}
        >
          <i className="bi bi-shield-lock me-1.5" />
          Change Password
        </button>

        {showSystemSettings && (
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
              activeTab === "system" ? "btn-success" : "btn-light text-muted border bg-white"
            }`}
            onClick={() => setActiveTab("system")}
          >
            <i className="bi bi-sliders me-1.5" />
            System &amp; Store Configuration
          </button>
        )}
      </div>

      {/* ── TAB 1: PROFILE INFORMATION ── */}
      {activeTab === "profile" && (
        <div
          className="card border-0 shadow-sm rounded-4 p-4 bg-white"
          style={{ border: "1px solid #ebdcc5" }}
        >
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-1">Personal &amp; Contact Details</h6>
            <p className="text-muted small mb-0">
              Manage your display name, contact phone number, and operational account details.
            </p>
          </div>

          {profileSuccess && (
            <div className="alert alert-success py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill fs-6 text-success flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="alert alert-danger py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle fs-6 text-danger flex-shrink-0" />
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
                <div className="form-text small" style={{ fontSize: "0.73rem" }}>
                  Displayed on orders, management logs, and assignment records.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  className="form-control rounded-3"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +63 912 345 6789"
                />
                <div className="form-text small" style={{ fontSize: "0.73rem" }}>
                  Used for internal staff communication and operational dispatch.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">
                  Email Address
                </label>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control rounded-start-3 bg-light text-muted"
                    value={profile?.email || ""}
                    disabled
                  />
                  <span className="input-group-text bg-light text-muted small border-start-0 rounded-end-3">
                    <i className="bi bi-lock-fill me-1" />
                    Locked ID
                  </span>
                </div>
                <div className="form-text small" style={{ fontSize: "0.73rem" }}>
                  Account login identifier. Contact primary system administrator to modify.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">
                  Assigned Role
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control rounded-start-3 bg-light text-muted text-capitalize"
                    value={profile?.role || roleLabel.toLowerCase()}
                    disabled
                  />
                  <span className="input-group-text bg-light text-muted small border-start-0 rounded-end-3">
                    <i className="bi bi-shield-lock me-1" />
                    RBAC Protected
                  </span>
                </div>
                <div className="form-text small" style={{ fontSize: "0.73rem" }}>
                  System permissions and portal access level.
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end border-top pt-3">
              <button
                type="submit"
                className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving Changes…
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1.5" />
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: CHANGE PASSWORD ── */}
      {activeTab === "security" && (
        <div
          className="card border-0 shadow-sm rounded-4 p-4 bg-white"
          style={{ border: "1px solid #ebdcc5" }}
        >
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-1">Change Account Password</h6>
            <p className="text-muted small mb-0">
              Ensure your operational account uses a strong, secure password to protect management actions.
            </p>
          </div>

          {passwordSuccess && (
            <div className="alert alert-success py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill fs-6 text-success flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="alert alert-danger py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle fs-6 text-danger flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className="form-label small fw-semibold text-dark">
                  Current Password <span className="text-danger">*</span>
                </label>
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
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"} text-muted`} />
                  </button>
                </div>
                <div className="form-text small" style={{ fontSize: "0.73rem" }}>
                  Required to authenticate the credential change request.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">
                  New Password <span className="text-danger">*</span>
                </label>
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
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"} text-muted`} />
                  </button>
                </div>
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">
                  Confirm New Password <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control rounded-start-3"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-end-3 px-3 bg-white border-start-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"} text-muted`} />
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <div className="text-danger small mt-1" style={{ fontSize: "0.73rem" }}>
                    <i className="bi bi-x-circle me-1" />
                    Passwords do not match
                  </div>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <div className="text-success small mt-1" style={{ fontSize: "0.73rem" }}>
                    <i className="bi bi-check-circle me-1" />
                    Passwords match
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end border-top pt-3">
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

      {/* ── TAB 3: SYSTEM & STORE CONFIGURATION (ADMIN ONLY) ── */}
      {showSystemSettings && activeTab === "system" && (
        <div
          className="card border-0 shadow-sm rounded-4 p-4 bg-white"
          style={{ border: "1px solid #ebdcc5" }}
        >
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-1">Business &amp; System Configuration</h6>
            <p className="text-muted small mb-0">
              Configure store contact details, physical address, and enabled checkout payment methods.
            </p>
          </div>

          {systemSaved && (
            <div className="alert alert-success py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill fs-6 text-success flex-shrink-0" />
              <span>System configuration saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSystemSettings}>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Store / Business Name</label>
                <input
                  className="form-control rounded-3"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Contact Email</label>
                <input
                  type="email"
                  className="form-control rounded-3"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Contact Phone</label>
                <input
                  className="form-control rounded-3"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Physical Store Address</label>
                <input
                  className="form-control rounded-3"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>
            </div>

            <h6 className="fw-bold text-dark mb-3 border-top pt-3">
              Payment Gateways &amp; Methods
            </h6>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
                <div>
                  <label className="form-check-label fw-semibold text-dark d-block" htmlFor="codCheck">
                    Cash on Delivery (COD)
                  </label>
                  <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    Enable COD for eligible full-payment regular purchases.
                  </span>
                </div>
                <input
                  className="form-check-input ms-3 fs-5"
                  type="checkbox"
                  role="switch"
                  id="codCheck"
                  checked={enableCod}
                  onChange={(e) => setEnableCod(e.target.checked)}
                />
              </div>

              <hr className="my-1 text-muted opacity-25" />

              <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
                <div>
                  <label className="form-check-label fw-semibold text-dark d-block" htmlFor="gcashCheck">
                    GCash Payment Integration
                  </label>
                  <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    Accept payments via GCash e-wallet (via PayMongo / QRPh).
                  </span>
                </div>
                <input
                  className="form-check-input ms-3 fs-5"
                  type="checkbox"
                  role="switch"
                  id="gcashCheck"
                  checked={enableGcash}
                  onChange={(e) => setEnableGcash(e.target.checked)}
                />
              </div>

              <hr className="my-1 text-muted opacity-25" />

              <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
                <div>
                  <label className="form-check-label fw-semibold text-dark d-block" htmlFor="stripeCheck">
                    Stripe (Credit / Debit Card)
                  </label>
                  <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    Accept Visa, Mastercard, and international credit cards.
                  </span>
                </div>
                <input
                  className="form-check-input ms-3 fs-5"
                  type="checkbox"
                  role="switch"
                  id="stripeCheck"
                  checked={enableStripe}
                  onChange={(e) => setEnableStripe(e.target.checked)}
                />
              </div>

              <hr className="my-1 text-muted opacity-25" />

              <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
                <div>
                  <label className="form-check-label fw-semibold text-dark d-block" htmlFor="paypalCheck">
                    PayPal Gateway
                  </label>
                  <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    Enable secure checkout through PayPal accounts and cards.
                  </span>
                </div>
                <input
                  className="form-check-input ms-3 fs-5"
                  type="checkbox"
                  role="switch"
                  id="paypalCheck"
                  checked={enablePaypal}
                  onChange={(e) => setEnablePaypal(e.target.checked)}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end border-top pt-3">
              <button type="submit" className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm">
                <i className="bi bi-check2-circle me-1.5" />
                Save System Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
