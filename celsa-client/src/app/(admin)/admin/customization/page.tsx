"use client";

import { useEffect, useState } from "react";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Order } from "@/lib/types";

export default function AdminCustomizationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  async function fetchCustomOrders() {
    setLoading(true);
    try {
      const res = await api.get("/orders", { params: { limit: 100 } });
      const allOrders: Order[] = res.data.orders || [];
      // Filter orders that are custom or contain custom specifications
      const custom = allOrders.filter(
        (o) =>
          o.orderType === "custom" ||
          o.customApprovalStatus !== "none" ||
          o.referenceImage ||
          o.designDescription ||
          o.orderType === "pre-order" ||
          o.items.some((i) => i.customizations?.length > 0)
      );
      setOrders(custom);
    } catch (err) {
      console.error("Failed to load customization requests:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomOrders();
  }, []);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || !actionType) return;

    setProcessing(true);
    try {
      await api.patch(`/orders/${selectedOrder._id}/review`, {
        status: actionType === "approve" ? "approved" : "rejected",
        rejectionReason: actionType === "reject" ? rejectionReason : undefined,
      });

      setSelectedOrder(null);
      setActionType(null);
      setRejectionReason("");
      await fetchCustomOrders();
    } catch (err) {
      console.error("Failed to review custom order:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter === "pending") return o.customApprovalStatus === "pending";
    if (filter === "approved") return o.customApprovalStatus === "approved";
    if (filter === "rejected") return o.customApprovalStatus === "rejected";
    return true;
  });

  const pendingCount = orders.filter((o) => o.customApprovalStatus === "pending").length;

  return (
    <>
      <DashboardTopbar title="Customization Requests &amp; Review" roleLabel="Admin" />
      <div className="p-4">
        {/* Header & Filter Tabs */}
        <div className="celsa-stat-card bg-white p-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${filter === "all" ? "btn-success" : "btn-outline-secondary"}`}
              onClick={() => setFilter("all")}
            >
              All Customizations ({orders.length})
            </button>
            <button
              className={`btn ${filter === "pending" ? "btn-success" : "btn-outline-secondary"} position-relative`}
              onClick={() => setFilter("pending")}
            >
              Pending Review
              {pendingCount > 0 && (
                <span className="badge bg-danger rounded-pill ms-2">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              className={`btn ${filter === "approved" ? "btn-success" : "btn-outline-secondary"}`}
              onClick={() => setFilter("approved")}
            >
              Approved
            </button>
            <button
              className={`btn ${filter === "rejected" ? "btn-success" : "btn-outline-secondary"}`}
              onClick={() => setFilter("rejected")}
            >
              Rejected
            </button>
          </div>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchCustomOrders}
            title="Refresh list"
          >
            <i className="bi bi-arrow-clockwise me-1" /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton variant="cardGrid" />
        ) : filteredOrders.length === 0 ? (
          <div className="celsa-stat-card bg-white p-5 text-center text-muted">
            <i className="bi bi-palette fs-1 d-block mb-2" />
            <p className="mb-0">No customization requests found for this filter.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredOrders.map((o) => {
              const custName = typeof o.user === "object" && o.user !== null ? o.user.name : "Customer";
              const custEmail = typeof o.user === "object" && o.user !== null ? o.user.email : "";

              return (
                <div className="col-12" key={o._id}>
                  <div className="celsa-stat-card bg-white p-4 border shadow-sm rounded-4">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3 pb-3 border-bottom">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold font-monospace fs-6">{o.orderNumber}</span>
                          {o.customApprovalStatus === "pending" && (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-hourglass-split me-1" /> Needs Review
                            </span>
                          )}
                          {o.customApprovalStatus === "approved" && (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1" /> Approved
                            </span>
                          )}
                          {o.customApprovalStatus === "rejected" && (
                            <span className="badge bg-danger">
                              <i className="bi bi-x-circle me-1" /> Rejected
                            </span>
                          )}
                          {o.orderType === "custom" && (
                            <span className="badge bg-purple text-white" style={{ backgroundColor: "#6f42c1" }}>
                              Custom Request
                            </span>
                          )}
                        </div>
                        <div className="text-muted small mt-1">
                          Placed by <strong>{custName}</strong> {custEmail && `(${custEmail})`} on{" "}
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-bold text-success fs-5">₱{o.totalAmount.toFixed(2)}</div>
                        <div className="small text-muted text-uppercase">{o.paymentMethod} · {o.paymentStatus}</div>
                      </div>
                    </div>

                    <div className="row g-4">
                      {/* Left: Reference Image & Written Description */}
                      <div className="col-md-6 border-end-md">
                        <h6 className="fw-bold small text-dark mb-2">
                          <i className="bi bi-image me-1 text-success" />
                          Customer Reference &amp; Instructions
                        </h6>

                        <div className="d-flex gap-3 align-items-start mb-3">
                          {o.referenceImage ? (
                            <div className="position-relative flex-shrink-0">
                              <img
                                src={o.referenceImage}
                                alt="Reference Design"
                                className="rounded-3 border shadow-sm cursor-pointer"
                                style={{ width: 100, height: 100, objectFit: "cover", cursor: "pointer" }}
                                onClick={() => setPreviewImage(o.referenceImage || null)}
                                title="Click to view full image"
                              />
                              <span
                                className="badge bg-dark bg-opacity-75 position-absolute bottom-0 start-0 m-1"
                                style={{ fontSize: "0.6rem" }}
                              >
                                Zoom
                              </span>
                            </div>
                          ) : (
                            <div
                              className="rounded-3 bg-light border d-flex flex-column align-items-center justify-content-center flex-shrink-0 text-muted p-2"
                              style={{ width: 100, height: 100, fontSize: "0.7rem" }}
                            >
                              <i className="bi bi-image-alt fs-4 mb-1" />
                              No Image
                            </div>
                          )}

                          <div className="flex-grow-1">
                            <div className="small fw-semibold text-muted mb-1">Design Specifications:</div>
                            <p className="small text-dark p-2 bg-light rounded-3 border mb-0" style={{ maxHeight: 90, overflowY: "auto" }}>
                              {o.designDescription || "Standard catalog modifications (see ordered item specs on the right)."}
                            </p>
                          </div>
                        </div>

                        {o.customApprovalStatus === "rejected" && o.customRejectionReason && (
                          <div className="alert alert-danger py-2 small mb-0">
                            <strong>Rejection Note:</strong> {o.customRejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Right: Items and Admin Decision Actions */}
                      <div className="col-md-6 d-flex flex-column justify-content-between">
                        <div>
                          <h6 className="fw-bold small text-dark mb-2">
                            <i className="bi bi-box-seam me-1 text-success" />
                            Base Item &amp; Custom Choice Modifiers
                          </h6>

                          {o.items.map((it, idx) => (
                            <div key={idx} className="p-2 border rounded-3 bg-light mb-2">
                              <div className="d-flex justify-content-between small">
                                <strong className="text-dark">{it.productName} (x{it.quantity})</strong>
                                <span className="fw-semibold">₱{(it.unitPrice * it.quantity).toFixed(2)}</span>
                              </div>
                              {it.customizations?.length > 0 && (
                                <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                                  {it.customizations.map((c) => `${c.label}: ${c.selectedValue}`).join(" | ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                          {o.customApprovalStatus === "pending" ? (
                            <>
                              <button
                                className="btn btn-sm btn-outline-danger px-3 rounded-3"
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setActionType("reject");
                                }}
                              >
                                <i className="bi bi-x-circle me-1" /> Reject Request
                              </button>
                              <button
                                className="btn btn-sm btn-success px-3 rounded-3 shadow-sm"
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setActionType("approve");
                                }}
                              >
                                <i className="bi bi-check-circle me-1" /> Approve Request
                              </button>
                            </>
                          ) : (
                            <div className="d-flex align-items-center gap-2">
                              <span className="small text-muted">Review Decision:</span>
                              <span className={`badge ${o.customApprovalStatus === "approved" ? "bg-success" : "bg-danger"}`}>
                                {o.customApprovalStatus === "approved" ? "Approved" : "Rejected"}
                              </span>
                              <button
                                className="btn btn-sm btn-link text-secondary p-0 ms-2 small"
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setActionType(o.customApprovalStatus === "approved" ? "reject" : "approve");
                                }}
                              >
                                Change decision
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal for Approval / Rejection */}
      {selectedOrder && actionType && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <form onSubmit={handleReviewSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {actionType === "approve" ? (
                      <span className="text-success">
                        <i className="bi bi-check-circle me-2" /> Approve Custom Request
                      </span>
                    ) : (
                      <span className="text-danger">
                        <i className="bi bi-x-circle me-2" /> Reject Custom Request
                      </span>
                    )}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setSelectedOrder(null);
                      setActionType(null);
                    }}
                  />
                </div>

                <div className="modal-body">
                  <p className="small text-muted mb-3">
                    Order <strong>{selectedOrder.orderNumber}</strong> — Customer will be notified of this decision on their order tracking page.
                  </p>

                  {actionType === "approve" ? (
                    <div className="alert alert-success small mb-0">
                      Approving this request confirms that the artisans can fulfill these custom specifications. The order will be scheduled for production.
                    </div>
                  ) : (
                    <div>
                      <label className="form-label small fw-semibold">Reason for Rejection *</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Please state why this custom design cannot be completed (e.g. material unavailability, infeasible dimensions)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setSelectedOrder(null);
                      setActionType(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-sm ${actionType === "approve" ? "btn-success" : "btn-danger"}`}
                    disabled={processing}
                  >
                    {processing ? "Submitting..." : actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* High-res Image Preview Modal */}
      {previewImage && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          tabIndex={-1}
          onClick={() => setPreviewImage(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-transparent border-0 text-center position-relative">
              <button
                type="button"
                className="btn btn-light rounded-circle position-absolute top-0 end-0 m-2"
                onClick={() => setPreviewImage(null)}
              >
                <i className="bi bi-x fs-5" />
              </button>
              <img
                src={previewImage}
                alt="High resolution reference preview"
                className="img-fluid rounded-4 shadow-lg"
                style={{ maxHeight: "80vh", objectFit: "contain", margin: "0 auto" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
