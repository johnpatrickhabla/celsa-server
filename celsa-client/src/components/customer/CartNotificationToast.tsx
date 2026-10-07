"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/cartStore";

export default function CartNotificationToast() {
  const { toastVisible, toastItem, hideCartToast } = useCartStore();
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!toastVisible || !toastItem) return;

    if (isHovered) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      hideCartToast();
    }, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toastVisible, toastItem, isHovered, hideCartToast]);

  if (!toastVisible || !toastItem) return null;

  return (
    <div
      className="sweet-cart-toast position-fixed"
      style={{
        top: "24px",
        right: "24px",
        zIndex: 1099,
        maxWidth: "380px",
        width: "calc(100vw - 32px)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="assertive"
    >
      <div
        className="rounded-4 p-3 shadow-lg overflow-hidden position-relative"
        style={{
          backgroundColor: "#ffffff",
          border: "1.5px solid #ebdcc5",
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.14)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Top Header: Sweet Success Icon, Title, and Close Button */}
        <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom" style={{ borderColor: "#f3ede2" }}>
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                backgroundColor: "#198754",
                boxShadow: "0 2px 8px rgba(25, 135, 84, 0.35)",
              }}
            >
              <i className="bi bi-check-lg fw-bold" style={{ fontSize: "0.95rem" }} />
            </div>
            <span className="fw-bold text-dark small" style={{ letterSpacing: "0.2px" }}>
              Added to Cart!
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link text-muted p-0 border-0"
            onClick={hideCartToast}
            aria-label="Close notification"
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-x-lg fs-6" />
          </button>
        </div>

        {/* Item Preview */}
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="rounded-3 overflow-hidden flex-shrink-0 border bg-light d-flex align-items-center justify-content-center"
            style={{ width: 54, height: 54, borderColor: "#ebdcc5" }}
          >
            {toastItem.productImage ? (
              <img
                src={toastItem.productImage}
                alt={toastItem.productName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/hero-basket.png";
                }}
              />
            ) : (
              <i className="bi bi-bag text-muted fs-4" />
            )}
          </div>
          <div className="overflow-hidden flex-grow-1">
            <h6
              className="fw-bold text-dark mb-1 text-truncate"
              style={{ fontSize: "0.85rem" }}
              title={toastItem.productName}
            >
              {toastItem.productName}
            </h6>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-success" style={{ fontSize: "0.85rem" }}>
                ₱{toastItem.unitPrice.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: "0.68rem", borderColor: "#ebdcc5" }}>
                Qty: {toastItem.quantity}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          <Link
            href="/cart"
            className="btn btn-outline-success btn-sm flex-grow-1 rounded-pill fw-semibold py-1.5"
            onClick={hideCartToast}
            style={{ fontSize: "0.78rem" }}
          >
            <i className="bi bi-cart3 me-1.5" />
            View Cart
          </Link>
          <Link
            href="/checkout"
            className="btn btn-success btn-sm flex-grow-1 rounded-pill fw-semibold py-1.5 shadow-sm"
            onClick={hideCartToast}
            style={{ fontSize: "0.78rem" }}
          >
            Checkout
            <i className="bi bi-arrow-right ms-1.5" />
          </Link>
        </div>

        {/* Animated Progress Countdown Bar */}
        <div
          className="position-absolute bottom-0 start-0 w-100"
          style={{ height: "3px", backgroundColor: "#f3ede2" }}
        >
          <div
            className="sweet-toast-progress h-100"
            style={{
              backgroundColor: "#198754",
              animation: isHovered ? "none" : "sweetProgressShrink 4s linear forwards",
            }}
          />
        </div>
      </div>
    </div>
  );
}
