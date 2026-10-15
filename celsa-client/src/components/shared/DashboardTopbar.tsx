"use client";

import { useAuthStore } from "@/stores/authStore";
import { useSidebarStore } from "@/stores/sidebarStore";

interface Props {
  title: string;
  roleLabel: "Admin" | "Staff";
}

export default function DashboardTopbar({ title, roleLabel }: Props) {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, isOpen } = useSidebarStore();

  return (
    <nav
      className="app-header navbar navbar-expand shadow-sm px-4 py-2 border-bottom"
      style={{ backgroundColor: "#fdfbf7", borderColor: "#ebdcc5" }}
    >
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
        {/* Left side: Hamburger Toggle Button, Page Title & Breadcrumb */}
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm border"
            style={{ width: 38, height: 38 }}
            title={isOpen ? "Hide Sidebar" : "Show Sidebar"}
            aria-label="Toggle Sidebar Menu"
          >
            <i className="bi bi-list fs-5 text-dark" />
          </button>
          <h5 className="mb-0 fw-bold text-dark">{title}</h5>
        </div>

        {/* Right side icons & user menu */}
        <div className="d-flex align-items-center gap-3">
          {/* User Menu Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-light rounded-pill border-0 d-flex align-items-center gap-2 px-3 py-1.5 shadow-sm"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div
                className="rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center"
                style={{ width: 28, height: 28, fontSize: "0.75rem" }}
              >
                {(user?.name || roleLabel).charAt(0).toUpperCase()}
              </div>
              <span className="fw-semibold small text-dark d-none d-md-inline">
                {user?.name || roleLabel}
              </span>
              <i className="bi bi-chevron-down text-muted" style={{ fontSize: "0.7rem" }} />
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2">
              <li className="dropdown-header px-3 py-2">
                <div className="fw-bold text-dark">{user?.name || roleLabel}</div>
                <small className="text-muted">{user?.email || `${roleLabel.toLowerCase()}@celsa.com`}</small>
              </li>
              <li><hr className="dropdown-divider my-1" /></li>
              <li>
                <button
                  className="dropdown-item px-3 py-2 text-danger small d-flex align-items-center gap-2"
                  onClick={() => logout()}
                >
                  <i className="bi bi-box-arrow-right" /> Log Out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
