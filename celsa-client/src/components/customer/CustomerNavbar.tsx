"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CUSTOMER_NAV } from "@/lib/nav-config";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState, useRef } from "react";
import AuthModal from "@/components/auth/AuthModal";
import api from "@/lib/api";
import type { Notification } from "@/lib/types";

export default function CustomerNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const rawCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const { isAuthenticated, user, logout, hydrate } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: "login" | "signup" }>({
    isOpen: false,
    tab: "login",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Hydrate auth and cart mounted state
  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  // Fetch notifications when authenticated
  async function fetchNotifications() {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Quiet fail if not logged in or network error
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Refresh periodically every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const cartCount = mounted ? rawCartCount : 0;

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  async function handleNotificationClick(notif: Notification) {
    try {
      if (!notif.isRead) {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifOpen(false);
      router.push("/my-orders");
    } catch (err) {
      router.push("/my-orders");
    }
  }

  return (
    <>
      <header className="celsa-navbar">
        <div className="container-fluid px-4 py-3 d-flex align-items-center justify-content-between">
          <Link href="/" className="text-decoration-none d-flex flex-column">
            <span className="fw-bold text-dark fs-4 lh-1" style={{ letterSpacing: "1px" }}>
              CELSA
            </span>
            <span
              className="text-uppercase fw-semibold mt-1"
              style={{
                letterSpacing: "3px",
                fontSize: "0.72rem",
                color: "#73511f",
              }}
            >
              Handicrafts
            </span>
          </Link>

          <nav className="d-none d-lg-flex gap-4">
            {CUSTOMER_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-decoration-none ${active ? "fw-semibold text-dark border-bottom border-2 border-dark" : "text-secondary"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="d-flex align-items-center gap-3">
            {/* Shopping Cart Button */}
            <Link href="/cart" className="btn btn-link text-dark position-relative p-0" aria-label="Cart">
              <i className="bi bi-cart3 fs-5" />
              {cartCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success"
                  style={{ fontSize: "0.65rem", padding: "0.25em 0.5em" }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notification Bell (Visible for logged in customers) */}
            {isAuthenticated && user && (
              <div className="position-relative" ref={notifRef}>
                <button
                  type="button"
                  className="btn btn-link text-dark position-relative p-0 d-flex align-items-center text-decoration-none"
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                  title="Order Progress Notifications"
                >
                  <i className="bi bi-bell fs-5" />
                  {unreadCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: "0.6rem", padding: "0.2em 0.45em" }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover Dropdown */}
                {notifOpen && (
                  <div
                    className="card shadow-lg border-0 rounded-4 position-absolute end-0 mt-2 overflow-hidden bg-white"
                    style={{ width: 340, zIndex: 1050 }}
                  >
                    <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-bell-fill text-warning" />
                        <span className="fw-bold small text-dark mb-0">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="badge bg-danger rounded-pill small" style={{ fontSize: "0.65rem" }}>
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-link p-0 small text-decoration-none text-muted"
                          style={{ fontSize: "0.75rem" }}
                          onClick={handleMarkAllAsRead}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: 320 }}>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted small">
                          <i className="bi bi-bell-slash fs-2 d-block mb-1 text-secondary opacity-50" />
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isUnread = !n.isRead;
                          const iconClass =
                            n.type === "shipped"
                              ? "bi-truck text-info"
                              : n.type === "custom_approved"
                              ? "bi-check-circle-fill text-success"
                              : n.type === "custom_rejected"
                              ? "bi-exclamation-triangle-fill text-danger"
                              : "bi-gear-wide-connected text-primary";

                          return (
                            <button
                              key={n._id}
                              type="button"
                              className={`list-group-item list-group-item-action p-3 text-start border-0 border-bottom d-flex gap-2.5 align-items-start ${
                                isUnread ? "bg-light bg-opacity-75" : ""
                              }`}
                              onClick={() => handleNotificationClick(n)}
                            >
                              <div className="mt-0.5">
                                <i className={`bi ${iconClass} fs-5`} />
                              </div>
                              <div className="flex-grow-1 overflow-hidden">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className={`small text-truncate ${isUnread ? "fw-bold text-dark" : "text-secondary"}`}>
                                    {n.title}
                                  </span>
                                  {isUnread && (
                                    <span
                                      className="rounded-circle bg-success flex-shrink-0 ms-1"
                                      style={{ width: 7, height: 7 }}
                                    />
                                  )}
                                </div>
                                <p className="text-muted small mb-1 lh-sm" style={{ fontSize: "0.75rem" }}>
                                  {n.message}
                                </p>
                                <span className="text-muted" style={{ fontSize: "0.65rem" }}>
                                  {new Date(n.createdAt).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="card-footer bg-light p-2 text-center border-top">
                      <Link
                        href="/my-orders"
                        className="small text-decoration-none fw-semibold text-success"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => setNotifOpen(false)}
                      >
                        View All Orders &amp; Progress →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Account Menu */}
            {isAuthenticated && user ? (
              <div className="dropdown position-relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="btn btn-link text-dark dropdown-toggle d-flex align-items-center gap-1 text-decoration-none p-0"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-label="Account"
                >
                  <div
                    className="rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 30, height: 30, fontSize: "0.75rem" }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="d-none d-md-inline small fw-semibold ms-1">
                    {user.name.split(" ")[0]}
                  </span>
                </button>
                <ul
                  className={`dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 ${
                    dropdownOpen ? "show" : ""
                  }`}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: "0.5rem",
                  }}
                >
                  <li className="dropdown-header small text-muted">{user.email}</li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link
                      className="dropdown-item small"
                      href="/my-orders"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <i className="bi bi-receipt me-2" />My Orders
                    </Link>
                  </li>
                  {(user.role === "admin" || user.role === "staff") && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <Link
                          className="dropdown-item small"
                          href={user.role === "admin" ? "/admin/dashboard" : "/staff/dashboard"}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <i className="bi bi-speedometer2 me-2" />Dashboard
                        </Link>
                      </li>
                    </>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item small text-danger"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                    >
                      <i className="bi bi-box-arrow-right me-2" />Log Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-link text-dark p-0 d-flex align-items-center gap-1 text-decoration-none"
                onClick={() => setAuthModal({ isOpen: true, tab: "login" })}
                aria-label="Account"
              >
                <i className="bi bi-person fs-5" />
                <span className="d-none d-md-inline small">Log In</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="btn btn-link text-dark d-lg-none p-0"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <i className={`bi ${mobileOpen ? "bi-x-lg" : "bi-list"} fs-4`} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="d-lg-none border-top px-4 py-2 bg-white">
            {CUSTOMER_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`d-block py-2 text-decoration-none ${active ? "fw-semibold text-dark" : "text-secondary"}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Unified Auth Modal (Log In & Create Account in one popup) */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ isOpen: false, tab: "login" })}
      />
    </>
  );
}
