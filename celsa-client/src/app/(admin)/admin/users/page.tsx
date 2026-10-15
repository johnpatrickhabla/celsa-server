"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import api, { getApiError } from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit modal state
  const currentUserId = useAuthStore((s) => s.user?._id);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"staff" | "admin">("staff");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const editingSelf = editingUser?._id === currentUserId;

  function openEdit(u: User) {
    setEditingUser(u);
    setEditName(u.name || "");
    setEditEmail(u.email || "");
    setEditPhone(u.phone || "");
    setEditRole(u.role === "admin" ? "admin" : "staff");
    setEditError(null);
  }

  function closeEdit() {
    if (savingEdit) return;
    setEditingUser(null);
    setEditError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setSavingEdit(true);

    // Only send fields that changed; self email/role are locked
    const payload: Record<string, string> = {};
    if (editName.trim() !== editingUser.name) payload.name = editName.trim();
    if (editPhone.trim() !== (editingUser.phone || "")) payload.phone = editPhone.trim();
    if (!editingSelf) {
      const normalizedEmail = editEmail.trim().toLowerCase();
      if (normalizedEmail !== editingUser.email) payload.email = normalizedEmail;
      if (editRole !== editingUser.role) payload.role = editRole;
    }

    if (Object.keys(payload).length === 0) {
      setSavingEdit(false);
      setEditingUser(null);
      return;
    }

    try {
      await api.put(`/users/${editingUser._id}`, payload);
      setSuccess(
        payload.email
          ? `Updated ${editName.trim()}. They must now log in with ${payload.email}.`
          : `Updated ${editName.trim()}'s account.`
      );
      setError(null);
      setEditingUser(null);
      fetchStaffUsers();
    } catch (err) {
      setEditError(getApiError(err, "Failed to update account."));
    } finally {
      setSavingEdit(false);
    }
  }

  async function fetchStaffUsers() {
    setLoading(true);
    try {
      const res = await api.get("/users");
      const all: User[] = res.data.users || [];
      // Filter staff and admin users
      setUsers(all.filter((u) => u.role === "staff" || u.role === "admin"));
    } catch (err) {
      console.error("Failed to load staff accounts:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await api.post("/users", { name, email, password, phone, role });
      setSuccess(`Account created for ${name} (${role})`);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      fetchStaffUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { error: string } } }).response?.data?.error
          : "Failed to create account.";
      setError(msg || "Failed to create account.");
    }
  }

  async function toggleUserActive(user: User) {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      fetchStaffUsers();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  }

  return (
    <>
      <DashboardTopbar title="Staff Account Management" roleLabel="Admin" />
      <div className="p-4" style={{ maxWidth: 960 }}>
        <div className="row g-4">
          {/* Create Staff Form */}
          <div className="col-md-5">
            <div className="celsa-stat-card bg-white p-4">
              <h6 className="fw-bold mb-3">Provision Staff / Admin Account</h6>
              <p className="text-muted small">
                Per security rules, staff accounts cannot self-register. Provision them here directly.
              </p>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {success && <div className="alert alert-success py-2 small">{success}</div>}

              <form onSubmit={handleCreateUser}>
                <div className="mb-3">
                  <label className="form-label small">Full Name *</label>
                  <input
                    className="form-control form-control-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small">Email Address *</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small">Initial Password *</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small">Phone Number</label>
                  <input
                    className="form-control form-control-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small">Role *</label>
                  <select
                    className="form-select form-select-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "staff" | "admin")}
                  >
                    <option value="staff">Production Staff</option>
                    <option value="admin">Super Administrator</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-sm btn-success w-100">
                  Provision Account
                </button>
              </form>
            </div>
          </div>

          {/* Accounts List */}
          <div className="col-md-7">
            <div className="celsa-stat-card bg-white p-3">
              <h6 className="fw-bold mb-3">System Staff &amp; Admins</h6>

              {loading ? (
                <LoadingSkeleton variant="table" />
              ) : users.length === 0 ? (
                <div className="text-muted small py-3 text-center">No staff accounts provisioned yet.</div>
              ) : (
                <table className="table table-hover align-middle mb-0">
                  <thead className="text-muted small border-bottom">
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="fw-semibold small">{u.name}</div>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>{u.email}</div>
                        </td>
                        <td>
                          <span
                            className={`badge text-uppercase ${
                              u.role === "admin" ? "bg-success" : "bg-warning text-dark"
                            }`}
                            style={{ fontSize: "0.65rem" }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              u.isActive ? "bg-success bg-opacity-10 text-success" : "bg-secondary"
                            }`}
                          >
                            {u.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              style={{ fontSize: "0.7rem" }}
                              onClick={() => openEdit(u)}
                              aria-label={`Edit ${u.name}`}
                            >
                              <i className="bi bi-pencil me-1" />
                              Edit
                            </button>
                            {u._id !== currentUserId && (
                              <button
                                className={`btn btn-sm ${u.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                                style={{ fontSize: "0.7rem" }}
                                onClick={() => toggleUserActive(u)}
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      {editingUser && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.55)", zIndex: 1080 }}
          onClick={closeEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4 w-100"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div>
                <h6 id="edit-user-title" className="fw-bold mb-0">Edit Account</h6>
                <small className="text-muted">{editingUser.email}</small>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeEdit}
                disabled={savingEdit}
              />
            </div>

            {editError && <div className="alert alert-danger py-2 small">{editError}</div>}

            <form onSubmit={handleSaveEdit}>
              <div className="mb-3">
                <label htmlFor="edit-name" className="form-label small">Full Name *</label>
                <input
                  id="edit-name"
                  className="form-control form-control-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="edit-email" className="form-label small">Email Address (login) *</label>
                <input
                  id="edit-email"
                  type="email"
                  className="form-control form-control-sm"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={editingSelf}
                  required
                />
                {editingSelf ? (
                  <div className="form-text small">
                    To change your own email, use{" "}
                    <Link href="/admin/settings">Account Settings</Link> (requires your password).
                  </div>
                ) : (
                  editEmail.trim().toLowerCase() !== editingUser.email && (
                    <div className="form-text small text-warning-emphasis">
                      <i className="bi bi-exclamation-triangle me-1" />
                      This user will need to log in with the new email.
                    </div>
                  )
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="edit-phone" className="form-label small">Phone Number</label>
                <input
                  id="edit-phone"
                  className="form-control form-control-sm"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="edit-role" className="form-label small">Role *</label>
                <select
                  id="edit-role"
                  className="form-select form-select-sm"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "staff" | "admin")}
                  disabled={editingSelf}
                >
                  <option value="staff">Production Staff</option>
                  <option value="admin">Super Administrator</option>
                </select>
                {editingSelf && (
                  <div className="form-text small">You can&apos;t change your own role.</div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-light border"
                  onClick={closeEdit}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-success px-3" disabled={savingEdit}>
                  {savingEdit ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
