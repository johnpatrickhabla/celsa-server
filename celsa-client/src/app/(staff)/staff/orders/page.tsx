"use client";

import { useEffect, useState } from "react";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Order } from "@/lib/types";

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Shipment form in staff modal
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingShipment, setSavingShipment] = useState(false);
  const [shipmentSuccess, setShipmentSuccess] = useState(false);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to load staff orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  function openOrderDetail(order: Order) {
    setSelectedOrder(order);
    setCourierName(order.courierName || "");
    setTrackingNumber(order.trackingNumber || "");
    setShipmentSuccess(false);
  }

  async function updateStatus(orderId: string, status: string) {
    try {
      await api.patch(`/orders/${orderId}/status`, { orderStatus: status });
      fetchOrders();
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

  return (
    <>
      <DashboardTopbar title="Staff Orders &amp; Fulfillment Queue" roleLabel="Staff" />
      <div className="p-4">
        {loading ? (
          <LoadingSkeleton variant="table" />
        ) : orders.length === 0 ? (
          <div className="celsa-stat-card bg-white p-5 text-center text-muted rounded-4">
            <i className="bi bi-receipt fs-1 d-block mb-2" />
            <p>No orders assigned to you currently.</p>
          </div>
        ) : (
          <div className="celsa-stat-card bg-white p-3 rounded-4 shadow-sm">
            <table className="table table-hover align-middle mb-0">
              <thead className="text-muted small border-bottom">
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Order Items</th>
                  <th>Tracking / Carrier</th>
                  <th>Production Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const custName = typeof o.user === "object" && o.user !== null ? o.user.name : "Customer";
                  return (
                    <tr key={o._id}>
                      <td className="fw-bold font-monospace small">
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
                      <td className="small">
                        {o.items.map((it, idx) => (
                          <div key={idx} className="mb-1">
                            <strong>{it.productName}</strong> x{it.quantity}
                            {it.customizations?.length > 0 && (
                              <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                                {it.customizations.map((c) => `${c.label}: ${c.selectedValue}`).join(" · ")}
                              </div>
                            )}
                          </div>
                        ))}
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
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-0 px-2 small"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => openOrderDetail(o)}
                          >
                            + Add Tracking
                          </button>
                        )}
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
                          <i className="bi bi-truck me-1" /> Ship
                        </button>
                        <select
                          className="form-select form-select-sm d-inline-block w-auto"
                          value={o.orderStatus}
                          onChange={(e) => updateStatus(o._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">In Production</option>
                          <option value="shipped">Shipped</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Staff Fulfillment Modal */}
        {selectedOrder && (
          <div className="modal show d-block bg-black bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header">
                  <h6 className="modal-title fw-bold">
                    Order Fulfillment — {selectedOrder.orderNumber}
                  </h6>
                  <button className="btn-close" onClick={() => setSelectedOrder(null)} />
                </div>
                <div className="modal-body">
                  <div className="p-3 border rounded-3 bg-light mb-3">
                    <h6 className="fw-bold small text-dark mb-2">
                      <i className="bi bi-truck me-1 text-success" />
                      Record Courier &amp; Tracking Number
                    </h6>
                    <form onSubmit={handleSaveShipment}>
                      <div className="row g-2 align-items-end">
                        <div className="col-md-5">
                          <label className="form-label small mb-1">Courier Carrier</label>
                          <input
                            className="form-control form-control-sm"
                            list="staffCourierOptions"
                            placeholder="e.g. Flash Express, J&amp;T Express, LBC"
                            value={courierName}
                            onChange={(e) => setCourierName(e.target.value)}
                            required
                          />
                          <datalist id="staffCourierOptions">
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
                          <label className="form-label small mb-1">Tracking / Waybill #</label>
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
                            {savingShipment ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    </form>
                    {shipmentSuccess && (
                      <div className="alert alert-success py-1 mt-2 small mb-0">
                        <i className="bi bi-check-circle me-1" /> Shipment details recorded successfully!
                      </div>
                    )}
                  </div>

                  <div className="small fw-semibold mb-2">Delivery Address</div>
                  <div className="p-2 border rounded bg-white small mb-3">
                    <strong>{selectedOrder.shippingAddress?.fullName}</strong> ({selectedOrder.shippingAddress?.phone})<br />
                    {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.province} {selectedOrder.shippingAddress?.zip}
                  </div>

                  <div className="small fw-semibold mb-2">Order Items</div>
                  <div className="border rounded p-3 bg-light">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
                        <div className="small">
                          <strong>{item.productName}</strong> x{item.quantity}
                          {item.customizations?.length > 0 && (
                            <span className="text-muted ms-2">
                              ({item.customizations.map((c) => `${c.label}: ${c.selectedValue}`).join(" · ")})
                            </span>
                          )}
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
