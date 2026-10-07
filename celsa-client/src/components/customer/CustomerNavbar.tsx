"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CUSTOMER_NAV } from "@/lib/nav-config";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState, useRef } from "react";
import AuthModal from "@/components/auth/AuthModal";
import api from "@/lib/api";
import type { Notification, Category } from "@/lib/types";

export default function CustomerNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const rawCartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const { isAuthenticated, user, logout, hydrate } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: "login" | "signup" }>({
    isOpen: false,
    tab: "login",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [navSearch, setNavSearch] = useState("");

  // Product Categories Popover State
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const productsDropdownTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get("/categories")
      .then((res) => {
        if (res.data?.categories) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => {});
  }, []);

  const handleProductsMouseEnter = () => {
    if (productsDropdownTimer.current) clearTimeout(productsDropdownTimer.current);
    setProductsDropdownOpen(true);
  };

  const handleProductsMouseLeave = () => {
    productsDropdownTimer.current = setTimeout(() => {
      setProductsDropdownOpen(false);
    }, 220);
  };

  // Profile Dropdown Hover Handlers
  const profileDropdownTimer = useRef<NodeJS.Timeout | null>(null);

  const handleProfileMouseEnter = () => {
    if (profileDropdownTimer.current) clearTimeout(profileDropdownTimer.current);
    setDropdownOpen(true);
    setCartOpen(false);
  };

  const handleProfileMouseLeave = () => {
    profileDropdownTimer.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 220);
  };

  // Sync navSearch from URL query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search") || "";
      setNavSearch(q);
    }
  }, [pathname]);

  const handleSearchChange = (val: string) => {
    setNavSearch(val);
    // When clearing search bar, immediately return to all products
    if (val === "" && pathname === "/products") {
      router.push("/products");
    }
  };

  const handleClearSearch = () => {
    setNavSearch("");
    if (pathname === "/products") {
      router.push("/products");
    }
  };

  function handleNavSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = navSearch.trim();
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/products");
    }
  }

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on route change
  useEffect(() => {
    setCartOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
    setProductsDropdownOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close dropdowns on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCartOpen(false);
        setDropdownOpen(false);
        setNotifOpen(false);
        setProductsDropdownOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Always visible near top of page
          if (currentScrollY <= 20) {
            setNavVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 70) {
            // Scrolling down -> hide navbar (unless mobile menu is open)
            if (!mobileOpen) {
              setNavVisible(false);
              setCartOpen(false);
              setDropdownOpen(false);
              setNotifOpen(false);
              setProductsDropdownOpen(false);
            }
          } else if (currentScrollY < lastScrollY.current) {
            // Scrolling up -> show navbar
            setNavVisible(true);
          }

          lastScrollY.current = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileOpen]);

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
      <header
        className={`celsa-navbar sticky-top shadow-sm ${!navVisible ? "celsa-navbar-hidden" : ""}`}
      >
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

          <nav className="d-none d-lg-flex align-items-center gap-4">
            {CUSTOMER_NAV.map((item) => {
              const active = pathname === item.href;
              const isProducts = item.href === "/products";

              if (isProducts) {
                return (
                  <div
                    key={item.href}
                    className="position-relative d-inline-block py-1"
                    onMouseEnter={handleProductsMouseEnter}
                    onMouseLeave={handleProductsMouseLeave}
                  >
                    <Link
                      href={item.href}
                      className={`celsa-nav-link ${active ? "active" : ""}`}
                    >
                      <span>{item.label}</span>
                    </Link>

                    {/* Popping categories dropdown menu on hover */}
                    {productsDropdownOpen && categories.length > 0 && (
                      <div
                        className="position-absolute start-0 top-100 mt-2 bg-white rounded-3 shadow-lg border p-2 categories-popover"
                        style={{
                          minWidth: "200px",
                          zIndex: 1060,
                          borderColor: "#ebdcc5",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                        }}
                      >
                        <div className="py-1">
                          <Link
                            href="/products"
                            onClick={() => setProductsDropdownOpen(false)}
                            className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 rounded-2 text-decoration-none text-dark hover-category-item"
                            style={{ fontSize: "0.85rem" }}
                          >
                            <i className="bi bi-grid text-success" />
                            <span className="fw-medium">All Products</span>
                          </Link>

                          {categories.map((cat) => (
                            <Link
                              key={cat._id}
                              href={`/products?category=${encodeURIComponent(cat.slug || cat._id)}`}
                              onClick={() => setProductsDropdownOpen(false)}
                              className="dropdown-item d-flex align-items-center px-3 py-2 rounded-2 text-decoration-none text-dark hover-category-item"
                              style={{ fontSize: "0.85rem" }}
                            >
                              <span className="text-truncate">{cat.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`celsa-nav-link ${active ? "active" : ""}`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Search bar on the left side of Add to Cart icon */}
            <form onSubmit={handleNavSearch} className="d-flex align-items-center" role="search">
              <div
                className="input-group input-group-sm rounded-pill overflow-hidden border d-flex align-items-center"
                style={{
                  backgroundColor: "#f9f8f6",
                  width: "clamp(120px, 18vw, 220px)",
                  transition: "all 0.2s ease",
                }}
              >
                <input
                  type="text"
                  inputMode="search"
                  className="form-control form-control-sm border-0 bg-transparent ps-3 py-1 flex-grow-1"
                  placeholder="Search product or category..."
                  value={navSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && navSearch) {
                      handleClearSearch();
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    fontSize: "0.8rem",
                    outline: "none",
                    boxShadow: "none",
                  }}
                  aria-label="Search product or category"
                />
                {navSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="btn btn-sm btn-link text-muted p-0 border-0 me-1 d-flex align-items-center"
                    style={{ fontSize: "0.85rem", textDecoration: "none" }}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <i className="bi bi-x-circle-fill text-secondary opacity-75" />
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-sm btn-link text-muted pe-2 ps-1 border-0 d-flex align-items-center"
                  aria-label="Submit Search"
                >
                  <i className="bi bi-search" style={{ fontSize: "0.8rem" }} />
                </button>
              </div>
            </form>

            {/* Shopping Cart Button & Dropdown Preview */}
            <div className="position-relative" ref={cartRef}>
              <button
                type="button"
                className="btn btn-link text-dark position-relative p-0 d-flex align-items-center text-decoration-none"
                onClick={() => {
                  setCartOpen((prev) => !prev);
                  setNotifOpen(false);
                  setDropdownOpen(false);
                }}
                aria-label="Shopping Cart"
                aria-expanded={cartOpen}
                title="Shopping Cart"
              >
                <i className="bi bi-cart3 fs-5" />
                {cartCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success"
                    style={{ fontSize: "0.65rem", padding: "0.25em 0.5em" }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Cart Popover Dropdown */}
              {cartOpen && (
                <div
                  className="cart-popover card shadow-lg border-0 rounded-4 position-absolute end-0 mt-2 overflow-hidden bg-white"
                  style={{
                    width: 360,
                    maxWidth: "min(360px, calc(100vw - 1.5rem))",
                    zIndex: 1050,
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.12)",
                  }}
                >
                  {/* Header */}
                  <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-bag-check-fill text-success" />
                      <span className="fw-bold small text-dark mb-0">My Cart</span>
                    </div>
                    {cartCount > 0 && (
                      <span className="badge bg-success bg-opacity-10 text-success rounded-pill" style={{ fontSize: "0.7rem" }}>
                        {cartCount} {cartCount === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  {items.length === 0 ? (
                    <div className="p-4 text-center">
                      <div
                        className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3 text-secondary"
                        style={{ width: 56, height: 56 }}
                      >
                        <i className="bi bi-cart-x fs-3 opacity-50" />
                      </div>
                      <h6 className="fw-semibold text-dark mb-1">Your cart is empty</h6>
                      <p className="text-muted small mb-3">Add items from our catalog to see them here.</p>
                      <Link
                        href="/products"
                        className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-medium"
                        style={{ fontSize: "0.8rem" }}
                        onClick={() => setCartOpen(false)}
                      >
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div
                        className="overflow-auto list-group list-group-flush"
                        style={{ maxHeight: 310, overscrollBehavior: "contain" }}
                      >
                        {items.map((item, index) => (
                          <div
                            key={`${item.productId}-${index}`}
                            className="list-group-item p-3 border-0 border-bottom d-flex gap-2.5 align-items-center"
                          >
                            {/* Product Thumbnail */}
                            <div
                              className="bg-light rounded-3 d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0 border"
                              style={{ width: 50, height: 50 }}
                            >
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                                />
                              ) : (
                                <i className="bi bi-image text-muted fs-5" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-grow-1 overflow-hidden pe-1">
                              <div className="d-flex justify-content-between align-items-start gap-1">
                                <Link
                                  href={`/products/${item.productSlug}`}
                                  className="text-dark text-decoration-none fw-semibold small text-truncate d-block"
                                  title={item.productName}
                                  onClick={() => setCartOpen(false)}
                                >
                                  {item.productName}
                                </Link>
                                <button
                                  type="button"
                                  className="btn btn-link text-muted p-0 border-0 flex-shrink-0"
                                  onClick={() => removeItem(index)}
                                  title="Remove item"
                                  aria-label="Remove item"
                                  style={{ fontSize: "0.8rem" }}
                                >
                                  <i className="bi bi-trash3 text-danger opacity-75" />
                                </button>
                              </div>

                              {/* Customizations / Badges */}
                              {item.customizations && item.customizations.length > 0 && (
                                <div className="text-muted small text-truncate mt-0.5" style={{ fontSize: "0.7rem" }}>
                                  {item.customizations.map((c, ci) => (
                                    <span key={c.type || ci} className="me-1.5">
                                      {c.label}: <span className="text-dark fw-medium">{c.selectedValue}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.isCustomOrder && (
                                <span className="badge bg-primary bg-opacity-10 text-primary py-0.5 px-1.5 mt-0.5" style={{ fontSize: "0.62rem" }}>
                                  Custom Order
                                </span>
                              )}

                              {/* Quantity Stepper and Item Price */}
                              <div className="d-flex justify-content-between align-items-center mt-1.5">
                                <div className="d-flex align-items-center border rounded-pill bg-light px-1 py-0.5">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-dark p-0 border-0 d-flex align-items-center justify-content-center"
                                    style={{ width: 18, height: 18, textDecoration: "none" }}
                                    onClick={() => updateQty(index, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    title="Decrease quantity"
                                  >
                                    <i className="bi bi-dash" style={{ fontSize: "0.75rem" }} />
                                  </button>
                                  <span className="small fw-semibold px-2" style={{ fontSize: "0.75rem" }}>
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-dark p-0 border-0 d-flex align-items-center justify-content-center"
                                    style={{ width: 18, height: 18, textDecoration: "none" }}
                                    onClick={() => updateQty(index, item.quantity + 1)}
                                    title="Increase quantity"
                                  >
                                    <i className="bi bi-plus" style={{ fontSize: "0.75rem" }} />
                                  </button>
                                </div>

                                <div className="text-end">
                                  <span className="fw-bold text-success small" style={{ fontSize: "0.82rem" }}>
                                    ₱{(item.unitPrice * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="card-footer bg-white border-top p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2.5">
                          <span className="text-muted small fw-medium">Subtotal</span>
                          <span className="fw-bold text-dark fs-6">₱{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="d-grid gap-2">
                          <Link
                            href="/checkout"
                            className="btn btn-success btn-sm rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                            onClick={() => setCartOpen(false)}
                          >
                            <span>Proceed to Checkout</span>
                            <i className="bi bi-arrow-right" />
                          </Link>
                          <Link
                            href="/cart"
                            className="btn btn-light btn-sm rounded-3 py-1.5 fw-medium text-secondary text-decoration-none border"
                            style={{ fontSize: "0.8rem" }}
                            onClick={() => setCartOpen(false)}
                          >
                            View Full Cart
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell (Visible for logged in customers) */}
            {isAuthenticated && user && (
              <div className="position-relative" ref={notifRef}>
                <button
                  type="button"
                  className="btn btn-link text-dark position-relative p-0 d-flex align-items-center text-decoration-none"
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setCartOpen(false);
                    setDropdownOpen(false);
                  }}
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
                    className="notif-popover card shadow-lg border-0 rounded-4 position-absolute end-0 mt-2 overflow-hidden bg-white"
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

            {/* User Account Menu (Profile button with dropdown for Login/Signup or Account actions) */}
            <div
              className="dropdown position-relative"
              ref={dropdownRef}
              onMouseEnter={handleProfileMouseEnter}
              onMouseLeave={handleProfileMouseLeave}
            >
              {isAuthenticated && user ? (
                <div
                  className="d-flex align-items-center gap-1 text-decoration-none p-0 user-select-none"
                  style={{ cursor: "pointer" }}
                  aria-expanded={dropdownOpen}
                  aria-label="Account"
                >
                  <div
                    className="rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 30, height: 30, fontSize: "0.75rem" }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="d-none d-md-inline small fw-semibold ms-1 text-dark">
                    {user.name.split(" ")[0]}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-link text-dark p-0 d-flex align-items-center justify-content-center text-decoration-none"
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen);
                    setCartOpen(false);
                    setNotifOpen(false);
                  }}
                  aria-expanded={dropdownOpen}
                  aria-label="Account"
                  title="Account"
                  style={{ width: 32, height: 32 }}
                >
                  <i className="bi bi-person fs-5" />
                </button>
              )}

              <ul
                className={`dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 profile-dropdown-menu ${
                  dropdownOpen ? "show" : ""
                }`}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "0.5rem",
                  minWidth: "190px",
                }}
              >
                {isAuthenticated && user ? (
                  <>
                    <li className="dropdown-header small text-muted">{user.email}</li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link
                        className="dropdown-item small"
                        href="/account"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="bi bi-gear me-2" />Account Settings
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
                  </>
                ) : (
                  <>
                    <li className="dropdown-header small text-muted">Account</li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item small d-flex align-items-center gap-2 py-2"
                        onClick={() => {
                          setDropdownOpen(false);
                          setAuthModal({ isOpen: true, tab: "login" });
                        }}
                      >
                        <i className="bi bi-box-arrow-in-right text-success fs-6" />
                        <span className="fw-medium">Log In</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item small d-flex align-items-center gap-2 py-2"
                        onClick={() => {
                          setDropdownOpen(false);
                          setAuthModal({ isOpen: true, tab: "signup" });
                        }}
                      >
                        <i className="bi bi-person-plus text-success fs-6" />
                        <span className="fw-medium">Sign Up</span>
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="btn btn-link text-dark d-lg-none p-2 d-flex align-items-center justify-content-center"
              style={{ minWidth: 42, minHeight: 42 }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <i className={`bi ${mobileOpen ? "bi-x-lg" : "bi-list"} fs-4`} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="d-lg-none border-top px-4 py-3 bg-white">
            <form
              onSubmit={(e) => {
                handleNavSearch(e);
                setMobileOpen(false);
              }}
              className="mb-3"
              role="search"
            >
              <div className="input-group input-group-sm rounded-pill overflow-hidden border bg-light d-flex align-items-center">
                <input
                  type="text"
                  inputMode="search"
                  className="form-control form-control-sm border-0 bg-transparent ps-3 py-1 flex-grow-1"
                  placeholder="Search product or category..."
                  value={navSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && navSearch) {
                      handleClearSearch();
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  style={{ fontSize: "0.85rem", outline: "none", boxShadow: "none" }}
                  aria-label="Search product or category"
                />
                {navSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="btn btn-sm btn-link text-muted p-0 border-0 me-2 d-flex align-items-center"
                    style={{ fontSize: "0.9rem", textDecoration: "none" }}
                    aria-label="Clear search"
                  >
                    <i className="bi bi-x-circle-fill text-secondary opacity-75" />
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-sm btn-link text-muted pe-3 border-0 d-flex align-items-center"
                  aria-label="Search"
                >
                  <i className="bi bi-search" />
                </button>
              </div>
            </form>
            {CUSTOMER_NAV.map((item) => {
              const active = pathname === item.href;
              const isProducts = item.href === "/products";

              if (isProducts) {
                return (
                  <div key={item.href} className="border-bottom pb-2 mb-1">
                    <div className="py-2">
                      <Link
                        href={item.href}
                        className={`celsa-nav-link ${active ? "active" : ""}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span>{item.label}</span>
                      </Link>
                    </div>
                    {categories.length > 0 && (
                      <div className="ps-2 pe-1 pb-1">
                        <span
                          className="text-muted text-uppercase fw-bold d-block mb-1.5"
                          style={{ fontSize: "0.62rem", letterSpacing: "0.5px" }}
                        >
                          Categories
                        </span>
                        <div className="d-flex flex-wrap gap-1">
                          <Link
                            href="/products"
                            className="badge bg-light text-dark border text-decoration-none py-1 px-2"
                            onClick={() => setMobileOpen(false)}
                          >
                            All
                          </Link>
                          {categories.map((cat) => (
                            <Link
                              key={cat._id}
                              href={`/products?category=${encodeURIComponent(cat.slug || cat._id)}`}
                              className="badge bg-light text-dark border text-decoration-none py-1 px-2"
                              onClick={() => setMobileOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={item.href} className="py-2">
                  <Link
                    href={item.href}
                    className={`celsa-nav-link ${active ? "active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{item.label}</span>
                  </Link>
                </div>
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
