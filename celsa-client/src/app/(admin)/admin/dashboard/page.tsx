"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

interface SummaryData {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
  pendingCustomReviews: number;
  inProductionOrders: number;
  shippedOrders: number;
  activeStaffCount: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  lowStockItemsList?: Array<{
    _id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
    category?: { name: string };
  }>;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    user?: { name: string; email?: string };
    totalAmount: number;
    orderType: "regular" | "pre-order" | "custom";
    customApprovalStatus?: "none" | "pending" | "approved" | "rejected";
    orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "completed" | "cancelled";
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/admin/summary");
      if (res?.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error("Failed to load admin operational dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const pendingReviews = summary?.pendingCustomReviews || 0;
  const lowStockCount = summary?.lowStockProducts || 0;

  return (
    <>
      <DashboardTopbar title="Operational Command Center" roleLabel="Admin" />
      <div className="container-fluid px-4 py-4">
        {/* Operational Command Center Header Container */}
        <div
          className="rounded-4 p-4 mb-4 shadow-sm position-relative overflow-hidden"
          style={{
            backgroundColor: "#fcfaf6",
            border: "1px solid #ebdcc5",
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                style={{
                  width: 52,
                  height: 52,
                  backgroundColor: "#1f3320",
                  color: "#d4af37",
                }}
              >
                <i className="bi bi-speedometer2 fs-4" />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h4 className="fw-bold text-dark mb-0">Operational Command Center</h4>
                  <span
                    className="badge rounded-pill bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 text-uppercase"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.5px" }}
                  >
                    Admin Panel
                  </span>
                </div>
                <p className="text-muted small mb-0 mt-1">
                  Real-time overview of Celsa Handicrafts inventory, production workflows, and customer orders
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <span
                className="badge rounded-pill px-3 py-2 text-success border border-success border-opacity-25 bg-success bg-opacity-10 d-flex align-items-center gap-1.5"
                style={{ fontSize: "0.78rem" }}
              >
                <span className="rounded-circle bg-success" style={{ width: 7, height: 7, display: "inline-block" }} />
                Live Operations
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton variant="dashboard" />
        ) : (
          <>
            {/* 1. Action-Required Urgent Alerts */}
            {(pendingReviews > 0 || lowStockCount > 0) && (
              <div className="row g-3 mb-4">
                {pendingReviews > 0 && (
                  <div className={lowStockCount > 0 ? "col-md-6" : "col-12"}>
                    <div className="border border-warning bg-warning bg-opacity-10 rounded-4 p-3 d-flex align-items-center justify-content-between shadow-sm">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 44, height: 44 }}
                        >
                          <i className="bi bi-palette fs-5" />
                        </div>
                        <div>
                          <div className="fw-bold text-dark">
                            {pendingReviews} Custom Request{pendingReviews > 1 ? "s" : ""} Pending Review
                          </div>
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                            Customer reference images &amp; design specifications awaiting your approval
                          </div>
                        </div>
                      </div>
                      <Link href="/admin/customization" className="btn btn-sm btn-warning text-dark fw-bold rounded-3 px-3">
                        Review Now →
                      </Link>
                    </div>
                  </div>
                )}

                {lowStockCount > 0 && (
                  <div className={pendingReviews > 0 ? "col-md-6" : "col-12"}>
                    <div className="border border-danger bg-danger bg-opacity-10 rounded-4 p-3 d-flex align-items-center justify-content-between shadow-sm">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 44, height: 44 }}
                        >
                          <i className="bi bi-exclamation-triangle fs-5" />
                        </div>
                        <div>
                          <div className="fw-bold text-dark">
                            {lowStockCount} Product{lowStockCount > 1 ? "s" : ""} Below Low-Stock Threshold
                          </div>
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                            Stock is critically low and requires inventory replenishment
                          </div>
                        </div>
                      </div>
                      <Link href="/admin/inventory" className="btn btn-sm btn-danger rounded-3 px-3">
                        Restock Now →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Key Operational Metrics (KPI Cards) */}
            <div className="row g-3 mb-4">
              {/* Pending Orders */}
              <div className="col-12 col-sm-6 col-lg-3">
                <Link href="/admin/orders" className="text-decoration-none">
                  <div className="celsa-stat-card bg-white p-4 rounded-4 shadow-sm border h-100 position-relative overflow-hidden hover-shadow transition-all">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-semibold">Pending Orders</span>
                      <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
                        <i className="bi bi-hourglass-split fs-5" />
                      </div>
                    </div>
                    <h3 className="fw-bold text-dark mb-1">{summary?.pendingOrders ?? 0}</h3>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      Orders awaiting confirmation
                    </span>
                  </div>
                </Link>
              </div>

              {/* In Production */}
              <div className="col-12 col-sm-6 col-lg-3">
                <Link href="/admin/production" className="text-decoration-none">
                  <div className="celsa-stat-card bg-white p-4 rounded-4 shadow-sm border h-100 position-relative overflow-hidden hover-shadow transition-all">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-semibold">In Production</span>
                      <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                        <i className="bi bi-gear fs-5" />
                      </div>
                    </div>
                    <h3 className="fw-bold text-primary mb-1">{summary?.inProductionOrders ?? 0}</h3>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      Actively being crafted by staff
                    </span>
                  </div>
                </Link>
              </div>

              {/* Ready to Ship / Shipped */}
              <div className="col-12 col-sm-6 col-lg-3">
                <Link href="/admin/orders" className="text-decoration-none">
                  <div className="celsa-stat-card bg-white p-4 rounded-4 shadow-sm border h-100 position-relative overflow-hidden hover-shadow transition-all">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-semibold">Dispatched / Shipped</span>
                      <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info">
                        <i className="bi bi-truck fs-5" />
                      </div>
                    </div>
                    <h3 className="fw-bold text-dark mb-1">{summary?.shippedOrders ?? 0}</h3>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      In transit with carrier tracking
                    </span>
                  </div>
                </Link>
              </div>

              {/* Total Active Catalog */}
              <div className="col-12 col-sm-6 col-lg-3">
                <Link href="/admin/products" className="text-decoration-none">
                  <div className="celsa-stat-card bg-white p-4 rounded-4 shadow-sm border h-100 position-relative overflow-hidden hover-shadow transition-all">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-semibold">Active Products</span>
                      <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                        <i className="bi bi-box-seam fs-5" />
                      </div>
                    </div>
                    <h3 className="fw-bold text-success mb-1">{summary?.totalProducts ?? 0}</h3>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      Catalog items available online
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* 3. Quick Action Shortcuts */}
            <div className="celsa-stat-card bg-white p-3 mb-4 rounded-4 shadow-sm border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-dark small text-uppercase">
                  <i className="bi bi-lightning-charge text-warning me-1" /> Quick Management Actions
                </h6>
                <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Fast administrative shortcuts
                </span>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Link href="/admin/products/new" className="btn btn-sm btn-success rounded-3 px-3 py-2 fw-semibold">
                  <i className="bi bi-plus-circle me-1" /> Add New Product
                </Link>
                <Link href="/admin/customization" className="btn btn-sm btn-outline-secondary rounded-3 px-3 py-2">
                  <i className="bi bi-palette me-1 text-purple" /> Review Custom Requests
                </Link>
                <Link href="/admin/orders" className="btn btn-sm btn-outline-secondary rounded-3 px-3 py-2">
                  <i className="bi bi-truck me-1 text-primary" /> Fulfill &amp; Track Shipments
                </Link>
                <Link href="/admin/production" className="btn btn-sm btn-outline-secondary rounded-3 px-3 py-2">
                  <i className="bi bi-person-check me-1 text-info" /> Assign Staff to Tasks
                </Link>
                <Link href="/admin/inventory" className="btn btn-sm btn-outline-secondary rounded-3 px-3 py-2">
                  <i className="bi bi-clipboard-data me-1 text-danger" /> Update Stock Levels
                </Link>
                <Link href="/admin/reports" className="btn btn-sm btn-outline-dark rounded-3 px-3 py-2 ms-auto">
                  <i className="bi bi-bar-chart me-1" /> View Full Analytics →
                </Link>
              </div>
            </div>

            {/* 4. Main Operational Feed */}
            <div className="row g-4">
              {/* Left Column: Live Orders Queue */}
              <div className="col-lg-8">
                <div className="celsa-stat-card bg-white p-4 rounded-4 shadow-sm border h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-receipt me-2 text-success" />
                        Live Orders &amp; Fulfillment Feed
                      </h6>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        Recent orders requiring fulfillment or processing
                      </div>
                    </div>
                    <Link href="/admin/orders" className="btn btn-sm btn-outline-success rounded-3">
                      View All Orders →
                    </Link>
                  </div>

                  {summary?.recentOrders && summary.recentOrders.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Type</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.recentOrders.map((o) => (
                            <tr key={o._id}>
                              <td className="fw-bold font-monospace">{o.orderNumber}</td>
                              <td>
                                <div className="fw-semibold text-dark">{o.user?.name || "Customer"}</div>
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                                  {new Date(o.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td>
                                {o.orderType === "custom" ? (
                                  <span className="badge bg-purple text-white" style={{ backgroundColor: "#6f42c1" }}>
                                    Custom
                                  </span>
                                ) : o.orderType === "pre-order" ? (
                                  <span className="badge bg-warning text-dark">Pre-Order</span>
                                ) : (
                                  <span className="badge bg-light text-dark border">Regular</span>
                                )}
                              </td>
                              <td className="fw-bold text-success">₱{o.totalAmount.toFixed(2)}</td>
                              <td>
                                <StatusBadge status={o.orderStatus} />
                              </td>
                              <td className="text-end">
                                {o.orderType === "custom" && o.customApprovalStatus === "pending" ? (
                                  <Link href="/admin/customization" className="btn btn-sm btn-warning text-dark py-1 px-2 fw-semibold">
                                    Review
                                  </Link>
                                ) : (
                                  <Link href="/admin/orders" className="btn btn-sm btn-outline-success py-1 px-2">
                                    Manage
                                  </Link>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-5">No recent orders in the queue.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Operational Snapshots */}
              <div className="col-lg-4 d-flex flex-column gap-4">
                {/* Low Stock Urgent Table */}
                <div className="celsa-stat-card bg-white p-4 rounded-4 shadow-sm border">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0 text-dark small text-uppercase">
                      <i className="bi bi-exclamation-diamond text-danger me-1" /> Urgent Restock Alert
                    </h6>
                    <Link href="/admin/inventory" className="small text-danger fw-semibold">
                      Manage →
                    </Link>
                  </div>

                  {summary?.lowStockItemsList && summary.lowStockItemsList.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                      {summary.lowStockItemsList.map((item) => (
                        <div key={item._id} className="p-2 border rounded-3 bg-light d-flex justify-content-between align-items-center small">
                          <div>
                            <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: 160 }}>
                              {item.name}
                            </div>
                            <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                              {item.category?.name || "Handicrafts"}
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-danger">{item.stock} left</span>
                            <div className="text-muted" style={{ fontSize: "0.65rem" }}>
                              Min: {item.lowStockThreshold}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted small py-3">
                      <i className="bi bi-check-circle text-success fs-4 d-block mb-1" />
                      All inventory items are currently well-stocked.
                    </div>
                  )}
                </div>

                {/* Staff Workforce Status */}
                <div className="celsa-stat-card bg-white p-4 rounded-4 shadow-sm border">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0 text-dark small text-uppercase">
                      <i className="bi bi-people text-info me-1" /> Active Staff Workforce
                    </h6>
                    <Link href="/admin/production" className="small text-muted">
                      Production →
                    </Link>
                  </div>
                  <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border">
                    <div>
                      <div className="fw-bold text-dark fs-5">{summary?.activeStaffCount ?? 0} Staff Active</div>
                      <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                        Assign tasks and track order crafting
                      </div>
                    </div>
                    <Link href="/admin/production" className="btn btn-sm btn-outline-primary rounded-3">
                      Assign Tasks
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
