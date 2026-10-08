"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Order } from "@/lib/types";

interface StaffSummary {
  myAssignedOrders: number;
  inProgressOrders: number;
  completedToday: number;
  recentAssignments: Order[];
}

export default function StaffDashboardPage() {
  const [summary, setSummary] = useState<StaffSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaffData() {
      try {
        const res = await api.get("/dashboard/staff/summary");
        setSummary(res.data);
      } catch (err) {
        console.error("Failed to load staff summary:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStaffData();
  }, []);

  const stats = [
    {
      icon: "bi-list-task",
      label: "My Assigned Tasks",
      value: summary?.myAssignedOrders ?? 0,
      hint: "Total assigned to me",
      bgColor: "bg-info" as const,
      href: "/staff/orders",
    },
    {
      icon: "bi-gear-wide-connected",
      label: "In Production",
      value: summary?.inProgressOrders ?? 0,
      hint: "Active crafting workflow",
      bgColor: "bg-warning" as const,
      href: "/staff/production",
    },
    {
      icon: "bi-check2-circle",
      label: "Completed Today",
      value: summary?.completedToday ?? 0,
      hint: "Finished crafting today",
      bgColor: "bg-success" as const,
      href: "/staff/orders",
    },
  ];

  return (
    <>
      <DashboardTopbar title="Operational Command Center" roleLabel="Staff" />
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
                  backgroundColor: "#6b3a20",
                  color: "#d4af37",
                }}
              >
                <i className="bi bi-speedometer2 fs-4" />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h4 className="fw-bold text-dark mb-0">Operational Command Center</h4>
                  <span
                    className="badge rounded-pill bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1 text-uppercase"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.5px" }}
                  >
                    Staff Panel
                  </span>
                </div>
                <p className="text-muted small mb-0 mt-1">
                  Active crafting queue, assigned order tasks, and daily handicraft production progress
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <span
                className="badge rounded-pill px-3 py-2 text-success border border-success border-opacity-25 bg-success bg-opacity-10 d-flex align-items-center gap-1.5"
                style={{ fontSize: "0.78rem" }}
              >
                <span className="rounded-circle bg-success" style={{ width: 7, height: 7, display: "inline-block" }} />
                Shift Active
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton variant="dashboard" />
        ) : (
          <>
            {/* AdminLTE Small Box Stat Widgets */}
            <div className="row g-3 mb-4">
              {stats.map((s) => (
                <div key={s.label} className="col-12 col-md-4 d-flex">
                  <StatCard {...s} />
                </div>
              ))}
            </div>

            {/* AdminLTE Recent Assignments Card */}
            <div className="card card-outline card-success shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 className="card-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-clipboard-check text-success" />
                  Assigned Orders &amp; Crafting Queue
                </h6>
                <Link href="/staff/orders" className="btn btn-sm btn-outline-success">
                  View All My Tasks →
                </Link>
              </div>

              <div className="card-body p-0">
                {summary?.recentAssignments && summary.recentAssignments.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th className="ps-3">Order #</th>
                          <th>Type</th>
                          <th>Items</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recentAssignments.map((a) => (
                          <tr key={a._id}>
                            <td className="ps-3 fw-bold font-monospace small">{a.orderNumber}</td>
                            <td className="small text-uppercase fw-semibold">{a.orderType}</td>
                            <td className="small">
                              {a.items.map((it) => `${it.productName} (${it.quantity}x)`).join(", ")}
                            </td>
                            <td className="text-muted small">
                              {new Date(a.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <StatusBadge
                                status={
                                  a.orderStatus === "completed"
                                    ? "completed"
                                    : a.orderStatus === "processing"
                                    ? "in-progress"
                                    : "pending"
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-muted small py-5 text-center">
                    No active production orders currently assigned to you.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
