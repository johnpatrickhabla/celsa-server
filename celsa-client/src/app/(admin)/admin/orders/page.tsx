"use client";

import { useEffect, useState } from "react";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Order, PaginationInfo } from "@/lib/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Shipment Form State
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingShipment, setSavingShipment] = useState(false);
  const [shipmentSuccess, setShipmentSuccess] = useState(false);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: "15" };
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentStatus = paymentFilter;
      if (search) params.search = search;

      const res = await api.get("/orders", { params });
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter, search]);

  function openOrderDetail(order: Order) {
    setSelectedOrder(order);
    setCourierName(order.courierName || "");
    setTrackingNumber(order.trackingNumber || "");
    setShipmentSuccess(false);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      await api.patch(`/orders/${orderId}/status`, { orderStatus: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus as Order["orderStatus"] });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleSaveShipment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;

    setSavingShipment(true);
    setShipmentSuccess(false);
    try {
      const res = await api.patch(`/orders/${selectedOrder._id}/shipment`, {
        courierName,
        trackingNumber,
        orderStatus: "shipped",
      });

      const updated = res.data.order;
      setSelectedOrder(updated);
      setShipmentSuccess(true);
      fetchOrders();
    } catch (err) {
      console.error("Failed to save shipment tracking:", err);
      alert("Failed to save shipment tracking details.");
    } finally {
      setSavingShipment(false);
    }
  }

  async function confirmCOD(orderId: string) {
    try {
      await api.patch(`/payments/${orderId}/cod-confirm`);
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: "paid" });
      }
    } catch (err) {
      console.error("Failed to confirm COD payment:", err);
    }
  }

  return (
    <>
      <DashboardTopbar title="Order Management &amp; Fulfillment" roleLabel="Admin" />
      <div className="p-4">
        {/* Filters */}
        <div className="celsa-stat-card bg-white p-3 mb-4 rounded-4 shadow-sm">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small text-muted">Search Order #</label>
              <input
                className="form-control form-control-sm"
                placeholder="ORD-..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small text-muted">Order Status</label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small text-muted">Payment Status</label>
              <select
                className="form-select form-select-sm"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Payment Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="cod_pending">COD Pending</option>
                <option value="deposit_paid">Deposit Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <LoadingSkeleton variant="table" />
        ) : orders.length === 0 ? (
          <div className="celsa-stat-card bg-white p-5 text-center text-muted rounded-4">
            <i className="bi bi-receipt fs-1 d-block mb-2" />
            <p>No orders found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="celsa-stat-card bg-white p-3 rounded-4 shadow-sm">
            <table className="table table-hover align-middle mb-0">
              <thead className="text-muted small border-bottom">
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Shipment / Tracking</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const custName = typeof o.user === "object" && o.user !== null ? o.user.name : "Customer";
                  return (
                    <tr key={o._id}>
                      <td>
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 fw-bold font-monospace text-decoration-none text-dark"
                          onClick={() => openOrderDetail(o)}
                        >
                          {o.orderNumber}
                        </button>
                      </td>
                      <td>
                        <div className="fw-semibold small">{custName}</div>
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
                      <td>
                        {o.trackingNumber ? (
                          <div>
                            <div className="small fw-semibold">{o.courierName || "Courier"}</div>
                            <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: "0.7rem" }}>
                              {o.trackingNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted small fst-italic">Not recorded</span>
                        )}
                      </td>
                      <td className="fw-bold text-success small">₱{o.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: "0.7rem" }}>
                          {o.paymentMethod} · {o.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          status={
                            o.orderStatus === "completed"
                              ? "completed"
                              : o.orderStatus === "shipped"
                              ? "in-progress"
                              : o.orderStatus === "processing"
                              ? "in-progress"
                              : "pending"
                          }
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={() => openOrderDetail(o)}
                        >
                          <i className="bi bi-truck me-1" /> Fulfill
                        </button>
                        <select
                          className="form-select form-select-sm d-inline-block w-auto"
                          style={{ fontSize: "0.75rem" }}
                          value={o.orderStatus}
                          onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pagination && pagination.pages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)}>
                      ‹
                    </button>
                  </li>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setPage(p)}>
                        {p}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${page >= pagination.pages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page + 1)}>
                      ›
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Order Detail & Fulfillment Modal */}
        {selectedOrder && (
          <div className="modal show d-block bg-black bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header">
                  <h6 className="modal-title fw-bold">
                    Order Details &amp; Fulfillment — {selectedOrder.orderNumber}
                  </h6>
                  <button className="btn-close" onClick={() => setSelectedOrder(null)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <div className="small text-muted">Customer</div>
                      <div className="fw-semibold">
                        {typeof selectedOrder.user === "object" && selectedOrder.user !== null ? selectedOrder.user.name : "N/A"}
                      </div>
                      <div className="small text-muted">
                        {typeof selectedOrder.user === "object" && selectedOrder.user !== null ? selectedOrder.user.email : ""}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Shipping Address</div>
                      <div className="small fw-semibold">
                        {selectedOrder.shippingAddress?.fullName} ({selectedOrder.shippingAddress?.phone})
                      </div>
                      <div className="small text-muted">
                        {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city},{" "}
                        {selectedOrder.shippingAddress?.province} {selectedOrder.shippingAddress?.zip}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-3">
                      <div className="small text-muted">Order Type</div>
                      <div className="fw-semibold small text-uppercase">{selectedOrder.orderType}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="small text-muted">Payment Method</div>
                      <div className="fw-semibold small text-uppercase">{selectedOrder.paymentMethod}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="small text-muted">Payment Status</div>
                      <div className="fw-semibold small text-uppercase">{selectedOrder.paymentStatus}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="small text-muted">Total Amount</div>
                      <div className="fw-bold text-success">₱{selectedOrder.totalAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Shipment Tracking Record Form */}
                  <div className="p-3 border rounded-3 bg-light mb-3">
                    <h6 className="fw-bold small text-dark mb-2">
                      <i className="bi bi-truck me-1 text-success" />
                      Shipment Details &amp; Tracking Number
                    </h6>
                    <form onSubmit={handleSaveShipment}>
                      <div className="row g-2 align-items-end">
                        <div className="col-md-5">
                          <label className="form-label small mb-1">Courier / Carrier Name</label>
                          <input
                            className="form-control form-control-sm"
                            list="adminCourierOptions"
                            placeholder="e.g. Flash Express, J&amp;T Express, LBC"
                            value={courierName}
                            onChange={(e) => setCourierName(e.target.value)}
                            required
                          />
                          <datalist id="adminCourierOptions">
                            <option value="Flash Express" />
                            <option value="J&T Express" />
                            <option value="LBC Express" />
                            <option value="Ninja Van" />
                            <option value="2GO Express" />
                            <option value="Lalamove" />
                            <option value="Grab Express" />
                          </datalist>
                        </div>
                        <div className="col-md-5">
                          <label className="form-label small mb-1">Waybill / Tracking Number</label>
                          <input
                            className="form-control form-control-sm font-monospace"
                            placeholder="e.g. JT123456789PH"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-2">
                          <button
                            type="submit"
                            className="btn btn-sm btn-success w-100"
                            disabled={savingShipment}
                          >
                            {savingShipment ? "Saving..." : "Save & Ship"}
                          </button>
                        </div>
                      </div>
                    </form>
                    {shipmentSuccess && (
                      <div className="alert alert-success py-1 mt-2 small mb-0">
                        <i className="bi bi-check-circle me-1" /> Shipment details updated and order marked as Shipped!
                      </div>
                    )}
                  </div>

                  {selectedOrder.paymentMethod === "cod" && selectedOrder.paymentStatus === "cod_pending" && (
                    <div className="alert alert-info py-2 small d-flex justify-content-between align-items-center mb-3">
                      <span>Customer selected COD. Mark as paid once money is collected on delivery.</span>
                      <button className="btn btn-sm btn-success" onClick={() => confirmCOD(selectedOrder._id)}>
                        Mark COD as Paid
                      </button>
                    </div>
                  )}

                  <h6 className="fw-bold mb-2">Order Items</h6>
                  <div className="border rounded p-3 bg-light mb-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                        <div>
                          <div className="fw-semibold small">{item.productName}</div>
                          {item.customizations?.length > 0 && (
                            <div style={{ fontSize: "0.7rem" }} className="text-muted">
                              {item.customizations.map((c) => `${c.label}: ${c.selectedValue}`).join(" · ")}
                            </div>
                          )}
                        </div>
                        <div className="text-end">
                          <div className="small">x{item.quantity} @ ₱{item.unitPrice.toFixed(2)}</div>
                          <div className="fw-bold small text-success">₱{(item.unitPrice * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
