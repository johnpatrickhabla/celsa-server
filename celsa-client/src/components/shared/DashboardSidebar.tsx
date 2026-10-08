"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/lib/nav-config";
import { useSidebarStore } from "@/stores/sidebarStore";

interface Props {
  items: NavItem[];
  variant?: "admin" | "staff";
  userName?: string;
  userSubtitle?: string;
}

export default function DashboardSidebar({ items, variant }: Props) {
  const pathname = usePathname();
  const { isOpen } = useSidebarStore();
  const panelType = variant || (pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/staff") ? "staff" : undefined);

  return (
    <aside
      className="app-sidebar shadow bg-dark text-white"
      style={{
        width: isOpen ? 250 : 0,
        minWidth: isOpen ? 250 : 0,
        maxWidth: isOpen ? 250 : 0,
        minHeight: "100vh",
        backgroundColor: "#1e293b",
        borderRight: isOpen ? "1px solid rgba(255,255,255,0.08)" : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        flexShrink: 0,
        visibility: isOpen ? "visible" : "hidden",
        opacity: isOpen ? 1 : 0,
      }}
      data-bs-theme="dark"
    >
      <div style={{ width: 250 }}>
        {/* Brand Header */}
        <div className="brand-link px-4 py-3 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25">
          <Link
            href={panelType === "staff" ? "/staff" : "/admin"}
            className="text-decoration-none d-flex flex-column"
          >
            <span className="brand-text fw-bold fs-5 text-white lh-1" style={{ letterSpacing: 1.5 }}>
              CELSA
            </span>
            <span
              className="text-uppercase fw-semibold"
              style={{
                letterSpacing: "2.5px",
                fontSize: "0.62rem",
                color: "#d4af37",
                marginTop: "4px",
              }}
            >
              Handicrafts
            </span>
          </Link>
          {panelType && (
            <span
              className="badge rounded-pill fw-semibold text-uppercase"
              style={{
                fontSize: "0.62rem",
                letterSpacing: "0.8px",
                padding: "4px 8px",
                backgroundColor: panelType === "admin" ? "rgba(239, 68, 68, 0.18)" : "rgba(14, 165, 233, 0.18)",
                color: panelType === "admin" ? "#fca5a5" : "#7dd3fc",
                border: `1px solid ${panelType === "admin" ? "rgba(239, 68, 68, 0.35)" : "rgba(14, 165, 233, 0.35)"}`,
              }}
            >
              {panelType === "admin" ? "Admin" : "Staff"}
            </span>
          )}
        </div>

        {/* Sidebar Navigation */}
        <div className="sidebar-wrapper p-2 flex-grow-1">
          <nav className="mt-2">
            <ul className="nav nav-pills flex-column gap-1">
              <li className="nav-header text-uppercase px-3 py-1 text-muted fw-bold" style={{ fontSize: "0.65rem" }}>
                MAIN NAVIGATION
              </li>
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" && item.href !== "/staff" && pathname.startsWith(item.href));
                return (
                  <li key={item.href} className="nav-item">
                    <Link
                      href={item.href}
                      className={`nav-link d-flex align-items-center gap-3 rounded-3 px-3 py-2 text-decoration-none transition-all ${
                        active
                          ? "active bg-success text-white shadow-sm fw-semibold"
                          : "text-light opacity-75 hover-opacity-100"
                      }`}
                      style={{ fontSize: "0.875rem" }}
                    >
                      <i className={`bi ${item.icon} fs-6`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
}
