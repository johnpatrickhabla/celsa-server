"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";

type PaymentMethod = "stripe" | "paypal" | "gcash" | "cod";
type OrderType = "regular" | "pre-order" | "custom";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);

  const hasCustomItem = items.some((i) => i.isCustomOrder || i.referenceImage || i.designDescription);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>(hasCustomItem ? "custom" : "regular");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    province: "",
    zip: "",
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Set orderType to custom if cart has custom item
  useEffect(() => {
    if (hasCustomItem) {
      setOrderType("custom");
    }
  }, [hasCustomItem]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        if (!useAuthStore.getState().isAuthenticated) {
          router.push("/login?next=/checkout");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router]);

  // Pre-fill name from user profile
  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name,
      }));
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="container-fluid px-4 py-5 text-center">
        <i className="bi bi-cart3 fs-1 text-muted d-block mb-3" />
        <h5>Your cart is empty</h5>
        <Link href="/products" className="btn btn-success mt-3">
          Browse Products
        </Link>
      </div>
    );
  }

  const subtotal = totalPrice();
  const depositAmount = orderType === "pre-order" ? Math.ceil(subtotal * 0.5) : 0;
  const amountDue = orderType === "pre-order" ? depositAmount : subtotal;

  // COD is available for regular and custom orders, not for pre-orders
  const availablePaymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: "cod", label: "Cash on Delivery", icon: "bi-cash" },
    { value: "gcash", label: "GCash", icon: "bi-phone" },
    { value: "stripe", label: "Credit/Debit Card (Stripe)", icon: "bi-credit-card" },
    { value: "paypal", label: "PayPal", icon: "bi-paypal" },
  ].filter((m) => !(orderType === "pre-order" && m.value === "cod")) as typeof availablePaymentMethods;

  // Reset payment method if switching to pre-order and COD was selected
  useEffect(() => {
    if (orderType === "pre-order" && paymentMethod === "cod") {
      setPaymentMethod("gcash");
    }
  }, [orderType, paymentMethod]);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const customItem = items.find((i) => i.isCustomOrder || i.referenceImage || i.designDescription);

      const orderItems = items.map((item) => ({
        productId: item.productId,
        customizations: item.customizations.map((c) => ({
          type: c.type,
          selectedValue: c.selectedValue,
        })),
        quantity: item.quantity,
      }));

      const res = await api.post("/orders", {
        items: orderItems,
        orderType: hasCustomItem ? "custom" : orderType,
        shippingAddress: shipping,
        paymentMethod,
        notes: "",
        referenceImage: customItem?.referenceImage || "",
        designDescription: customItem?.designDescription || "",
      });

      const order = res.data.order;
      clearCart();
      router.push(`/checkout/success?orderId=${order._id}&orderNumber=${order.orderNumber}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { error: string } } }).response?.data?.error
          : "Failed to place order. Please try again.";
      setError(message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-fluid px-4 py-5">
      <h4 className="fw-bold mb-4">Checkout</h4>

      <form onSubmit={handlePlaceOrder}>
        <div className="row g-4">
          {/* Left: Shipping + Payment */}
          <div className="col-lg-7">
            {/* Shipping */}
            <div className="border rounded p-4 mb-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-truck me-2" />
                Shipping Information
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small">Full Name *</label>
                  <input
                    className="form-control form-control-sm"
                    value={shipping.fullName}
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Phone *</label>
                  <input
                    className="form-control form-control-sm"
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small">Street Address *</label>
                  <input
                    className="form-control form-control-sm"
                    value={shipping.street}
                    onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">City *</label>
                  <input
                    className="form-control form-control-sm"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Province *</label>
                  <input
                    className="form-control form-control-sm"
                    value={shipping.province}
                    onChange={(e) => setShipping({ ...shipping, province: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">ZIP Code *</label>
                  <input
                    className="form-control form-control-sm"
                    value={shipping.zip}
                    onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Order Type */}
            <div className="border rounded p-4 mb-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-bag me-2" />
                Order Type
              </h6>
              {hasCustomItem ? (
                <div className="p-3 border border-success bg-success bg-opacity-10 rounded">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-success">Customization</span>
                    <span className="fw-semibold small">Customized Handicraft Request</span>
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                    This order contains custom design specifications. It will be submitted for review and approval by the Administrator before production starts.
                  </p>
                </div>
              ) : (
                <div className="d-flex gap-3">
                  <label className={`border rounded p-3 flex-fill cursor-pointer ${orderType === "regular" ? "border-success bg-success bg-opacity-10" : ""}`} style={{ cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="orderType"
                      value="regular"
                      checked={orderType === "regular"}
                      onChange={() => setOrderType("regular")}
                      className="form-check-input me-2"
                    />
                    <span className="fw-semibold small">Full Payment</span>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                      Pay the full amount now
                    </div>
                  </label>
                  <label className={`border rounded p-3 flex-fill ${orderType === "pre-order" ? "border-success bg-success bg-opacity-10" : ""}`} style={{ cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="orderType"
                      value="pre-order"
                      checked={orderType === "pre-order"}
                      onChange={() => setOrderType("pre-order")}
                      className="form-check-input me-2"
                    />
                    <span className="fw-semibold small">Pre-Order (50% Deposit)</span>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                      Reserve with a 50% deposit, pay balance later
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="border rounded p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-credit-card me-2" />
                Payment Method
              </h6>
              <div className="d-flex flex-column gap-2">
                {availablePaymentMethods.map((m) => (
                  <label
                    key={m.value}
                    className={`border rounded p-3 d-flex align-items-center gap-2 ${paymentMethod === m.value ? "border-success bg-success bg-opacity-10" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={paymentMethod === m.value}
                      onChange={() => setPaymentMethod(m.value)}
                      className="form-check-input"
                    />
                    <i className={`bi ${m.icon}`} />
                    <span className="small fw-semibold">{m.label}</span>
                  </label>
                ))}
              </div>
              {orderType === "pre-order" && (
                <div className="alert alert-warning py-2 mt-3 small mb-0">
                  <i className="bi bi-info-circle me-1" />
                  COD is not available for pre-orders. A deposit must be secured online.
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="col-lg-5">
            <div className="border rounded p-4 position-sticky" style={{ top: "1rem" }}>
              <h6 className="fw-bold mb-3">Order Summary</h6>

              {items.map((item, i) => (
                <div key={i} className="d-flex gap-2 mb-3 pb-3 border-bottom">
                  <div
                    className="bg-light rounded flex-shrink-0 d-flex align-items-center justify-content-center overflow-hidden"
                    style={{ width: 50, height: 50 }}
                  >
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                    ) : (
                      <i className="bi bi-image text-muted small" />
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="small fw-semibold">{item.productName}</div>
                    {item.customizations.length > 0 && (
                      <div style={{ fontSize: "0.65rem" }} className="text-muted">
                        {item.customizations.map((c) => c.selectedValue).join(", ")}
                      </div>
                    )}
                    <div className="d-flex justify-content-between mt-1">
                      <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                        Qty: {item.quantity}
                      </span>
                      <span className="small fw-semibold">
                        ₱{(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Subtotal</span>
                <span className="fw-semibold">₱{subtotal.toFixed(2)}</span>
              </div>

              {orderType === "pre-order" && (
                <>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Deposit (50%)</span>
                    <span className="fw-semibold text-warning">
                      ₱{depositAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Balance Due Later</span>
                    <span className="text-muted small">
                      ₱{(subtotal - depositAmount).toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold">
                  {orderType === "pre-order" ? "Due Now" : "Total"}
                </span>
                <span className="fw-bold text-success fs-5">
                  ₱{amountDue.toFixed(2)}
                </span>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small">{error}</div>
              )}

              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order — ₱{amountDue.toFixed(2)}
                  </>
                )}
              </button>

              <Link href="/cart" className="btn btn-outline-secondary w-100 mt-2">
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
