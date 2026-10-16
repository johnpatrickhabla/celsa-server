"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/cartStore";
import PageLoader from "@/components/shared/PageLoader";
import ProductDetailsModal from "@/components/customer/ProductDetailsModal";
import type { Product } from "@/lib/types";
import api from "@/lib/api";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Product Quick View modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.totalPrice);

  async function handleOpenProductModal(item: (typeof items)[0]) {
    try {
      setLoadingProductId(item.productId);
      const identifier = item.productSlug || item.productId;
      const res = await api.get(`/products/${identifier}`);
      if (res.data?.product) {
        setSelectedProduct(res.data.product);
        setModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load product details for modal:", err);
    } finally {
      setLoadingProductId(null);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <PageLoader />;
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Empty cart view
  if (items.length === 0) {
    return (
      <div className="celsa-cart-page py-5">
        <div className="container celsa-cart-container px-3 px-md-4">
          <div className="text-center py-5 bg-white rounded-4 border shadow-sm p-4 p-md-5 my-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
              style={{
                width: 90,
                height: 90,
                backgroundColor: "var(--celsa-cream)",
                color: "var(--celsa-gold-dark)",
              }}
            >
              <i className="bi bi-bag-heart fs-1" />
            </div>

            <h3 className="fw-bold text-dark mb-2">Your Shopping Cart is Empty</h3>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: 480, fontSize: "0.95rem" }}>
              Looks like you haven&apos;t added any handcrafted treasures to your bag yet.
              Explore our artisanal woven goods, baskets, and custom pieces!
            </p>

            <Link
              href="/products"
              className="btn btn-success px-4 py-2.5 rounded-pill fw-semibold shadow-sm"
              style={{ backgroundColor: "var(--celsa-green-dark)", borderColor: "var(--celsa-green-dark)" }}
            >
              <i className="bi bi-compass me-2" />
              Explore Artisanal Products
            </Link>

            {/* Feature Highlights */}
            <div className="row g-3 justify-content-center mt-5 pt-3 border-top">
              <div className="col-12 col-md-4">
                <div className="p-3 text-start d-flex align-items-start gap-3 rounded-3" style={{ backgroundColor: "#fbf9f5" }}>
                  <i className="bi bi-flower1 fs-3 text-success flex-shrink-0" />
                  <div>
                    <h6 className="fw-bold mb-1 small text-dark">100% Handcrafted</h6>
                    <p className="text-muted mb-0 small" style={{ fontSize: "0.8rem" }}>
                      Woven with passion by skilled local artisans using native fibers.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 text-start d-flex align-items-start gap-3 rounded-3" style={{ backgroundColor: "#fbf9f5" }}>
                  <i className="bi bi-box-seam fs-3 text-primary flex-shrink-0" />
                  <div>
                    <h6 className="fw-bold mb-1 small text-dark">Nationwide Safe Delivery</h6>
                    <p className="text-muted mb-0 small" style={{ fontSize: "0.8rem" }}>
                      Packed securely to ensure your delicate handicrafts arrive pristine.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 text-start d-flex align-items-start gap-3 rounded-3" style={{ backgroundColor: "#fbf9f5" }}>
                  <i className="bi bi-shield-check fs-3 text-warning flex-shrink-0" />
                  <div>
                    <h6 className="fw-bold mb-1 small text-dark">Secure Payments</h6>
                    <p className="text-muted mb-0 small" style={{ fontSize: "0.8rem" }}>
                      Accepts GCash, Maya, Bank Transfer, Cards, and Cash on Delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="celsa-cart-page py-4 py-md-5">
      <div className="container celsa-cart-container px-3 px-md-4">
        {/* Checkout Funnel Stepper */}
        <div className="cart-stepper">
          <div className="cart-step active">
            <span className="cart-step-num">1</span>
            <span>Shopping Cart</span>
          </div>
          <div className="cart-step-divider" />
          <div className="cart-step">
            <span className="cart-step-num">2</span>
            <span>Checkout &amp; Shipping</span>
          </div>
          <div className="cart-step-divider" />
          <div className="cart-step">
            <span className="cart-step-num">3</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Page Title & Top Actions */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <span>Your Shopping Cart</span>
              <span className="badge rounded-pill bg-light text-dark border fs-6 fw-semibold px-3 py-1">
                {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
              </span>
            </h2>
            <p className="text-muted mb-0 small">
              Review your items, customize quantities, and choose your preferred delivery.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link
              href="/products"
              className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 fw-medium"
            >
              <i className="bi bi-arrow-left me-1" />
              Continue Shopping
            </Link>

            {!showClearConfirm ? (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-medium"
                onClick={() => setShowClearConfirm(true)}
              >
                <i className="bi bi-trash3 me-1" />
                Clear Cart
              </button>
            ) : (
              <div className="d-inline-flex align-items-center gap-2 bg-danger-subtle border border-danger-subtle rounded-pill px-3 py-1">
                <span className="text-danger small fw-semibold">Clear all?</span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm rounded-pill px-2.5 py-0.5 fw-bold"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => {
                    clearCart();
                    setShowClearConfirm(false);
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="btn btn-light btn-sm rounded-pill px-2 py-0.5 border"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="row g-4">
          {/* Cart Items List */}
          <div className="col-12 col-lg-8">
            <div className="d-flex flex-column gap-3">
              {items.map((item, index) => {
                // Separate size option from other customizations for dedicated badge display
                const sizeCustomization = item.customizations.find((c) => c.type === "size");
                const otherCustomizations = item.customizations.filter((c) => c.type !== "size");

                return (
                  <div
                    key={`${item.productId}-${index}`}
                    className="cart-item-card d-flex flex-column flex-sm-row gap-3 align-items-start"
                  >
                    {/* Item Thumbnail - Clickable to open Quick View Modal */}
                    <div
                      className="cart-item-img-container"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenProductModal(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpenProductModal(item);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                      title={`View ${item.productName} details`}
                    >
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                          <i className="bi bi-image fs-3" />
                        </div>
                      )}
                    </div>

                    {/* Details Column */}
                    <div className="flex-grow-1 w-100">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <div>
                          {/* Product Name Button - opens Quick View modal */}
                          <button
                            type="button"
                            className="btn btn-link text-dark text-decoration-none fw-bold p-0 text-start cart-product-title-btn d-inline-flex align-items-center gap-1.5"
                            style={{ fontSize: "1.05rem" }}
                            onClick={() => handleOpenProductModal(item)}
                            title={`View ${item.productName} details`}
                          >
                            <span>{item.productName}</span>
                            {loadingProductId === item.productId ? (
                              <span
                                className="spinner-border spinner-border-sm text-success ms-1"
                                style={{ width: "0.85rem", height: "0.85rem" }}
                              />
                            ) : (
                              <i className="bi bi-eye text-muted fs-6 opacity-50 view-eye-icon ms-1" />
                            )}
                          </button>

                          {/* Custom Order Flag */}
                          {item.isCustomOrder && (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle ms-2 rounded-pill px-2 py-0.5" style={{ fontSize: "0.7rem" }}>
                              <i className="bi bi-stars me-1" />
                              Custom Order
                            </span>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 rounded-circle p-1.5 flex-shrink-0"
                          onClick={() => removeItem(index)}
                          title="Remove item from cart"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <i className="bi bi-trash3 fs-6" />
                        </button>
                      </div>

                      {/* Customization & Size Badges */}
                      <div className="d-flex flex-wrap gap-1.5 align-items-center my-2">
                        {/* Size Badge with Price Modifier */}
                        {sizeCustomization && (
                          <span className="cart-size-pill">
                            <i className="bi bi-rulers me-1 opacity-75" />
                            Size: <strong>{sizeCustomization.selectedValue}</strong>
                            {sizeCustomization.priceModifier > 0 && (
                              <span className="badge-mod">
                                +₱{sizeCustomization.priceModifier.toFixed(0)}
                              </span>
                            )}
                          </span>
                        )}

                        {/* Other Customizations */}
                        {otherCustomizations.map((c) => (
                          <span key={c.type} className="cart-custom-badge">
                            {c.label}: <strong>{c.selectedValue}</strong>
                            {c.priceModifier > 0 && (
                              <span className="text-success ms-1">
                                (+₱{c.priceModifier.toFixed(2)})
                              </span>
                            )}
                          </span>
                        ))}

                        {/* Reference Image Preview if present */}
                        {item.referenceImage && (
                          <a
                            href={item.referenceImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge bg-light text-primary border rounded-pill text-decoration-none px-2 py-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <i className="bi bi-image me-1" />
                            View Reference Photo
                          </a>
                        )}
                      </div>

                      {/* Custom Design Description if present */}
                      {item.designDescription && (
                        <p className="text-muted small mb-2 fst-italic" style={{ fontSize: "0.82rem" }}>
                          <span className="fw-semibold text-secondary">Note:</span> {item.designDescription}
                        </p>
                      )}

                      {/* Price, Stepper & Line Total Row */}
                      <div className="d-flex flex-wrap justify-content-between align-items-center pt-2 mt-2 border-top">
                        <div className="d-flex align-items-center gap-3">
                          {/* Unit Price */}
                          <div className="text-muted small">
                            <span className="text-dark fw-semibold">
                              ₱{item.unitPrice.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="ms-1" style={{ fontSize: "0.78rem" }}>each</span>
                          </div>

                          {/* Stepper */}
                          <div className="cart-stepper-wrap">
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => updateQty(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              title="Decrease quantity"
                              aria-label="Decrease quantity"
                            >
                              <i className="bi bi-dash" />
                            </button>
                            <span className="px-2 small fw-bold text-dark" style={{ minWidth: 24, textAlign: "center" }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => updateQty(index, item.quantity + 1)}
                              title="Increase quantity"
                              aria-label="Increase quantity"
                            >
                              <i className="bi bi-plus" />
                            </button>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="text-end">
                          <span className="text-muted small d-block" style={{ fontSize: "0.72rem" }}>Line Total</span>
                          <span className="fw-bold text-success fs-6">
                            ₱{(item.unitPrice * item.quantity).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Order Summary Column */}
          <div className="col-12 col-lg-4">
            <div className="cart-summary-box position-sticky" style={{ top: 96 }}>
              <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                <h5 className="fw-bold text-dark mb-0">Order Summary</h5>
                <span className="badge rounded-pill bg-success-subtle text-success-emphasis border border-success-subtle px-2 py-1 small">
                  <i className="bi bi-shield-check me-1" />
                  Secure
                </span>
              </div>

              {/* Subtotal */}
              <div className="d-flex justify-content-between align-items-center mb-2.5">
                <span className="text-muted small">Items Subtotal ({totalQuantity})</span>
                <span className="fw-semibold text-dark">
                  ₱{totalPrice().toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Shipping Estimate */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted small">Estimated Shipping</span>
                <span className="text-secondary small fw-medium">
                  Calculated at Checkout
                </span>
              </div>

              <div className="p-2.5 rounded-3 mb-3" style={{ backgroundColor: "#f9f7f2", border: "1px dashed #decbb3" }}>
                <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.78rem" }}>
                  <i className="bi bi-truck text-success fs-6" />
                  <span>Standard courier shipping available nationwide across the Philippines.</span>
                </div>
              </div>

              <hr className="my-3" style={{ borderColor: "var(--celsa-border)" }} />

              {/* Total Row */}
              <div className="d-flex justify-content-between align-items-baseline mb-4">
                <div>
                  <span className="fw-bold text-dark fs-5">Estimated Total</span>
                  <span className="d-block text-muted" style={{ fontSize: "0.75rem" }}>
                    Taxes included where applicable
                  </span>
                </div>
                <span className="fw-bold text-success fs-4">
                  ₱{totalPrice().toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Checkout CTA */}
              <div className="d-grid gap-2">
                <Link
                  href="/checkout"
                  className="btn btn-success btn-lg py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: "var(--celsa-green-dark)",
                    borderColor: "var(--celsa-green-dark)",
                    fontSize: "0.95rem",
                    letterSpacing: "0.3px",
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <i className="bi bi-arrow-right fs-5" />
                </Link>

                <Link
                  href="/products"
                  className="btn btn-light btn-sm py-2 rounded-pill fw-medium text-secondary text-decoration-none border mt-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Trust & Guarantee Badges */}
              <div className="d-flex flex-column gap-2 mt-4 pt-3 border-top">
                <div className="cart-trust-badge">
                  <i className="bi bi-lock-fill text-success fs-5 flex-shrink-0" />
                  <div>
                    <span className="fw-bold d-block text-dark" style={{ fontSize: "0.78rem" }}>Safe &amp; Encrypted Checkout</span>
                    <span className="text-muted d-block" style={{ fontSize: "0.72rem" }}>GCash, Maya, Cards, &amp; Cash on Delivery</span>
                  </div>
                </div>

                <div className="cart-trust-badge">
                  <i className="bi bi-patch-check-fill text-warning fs-5 flex-shrink-0" />
                  <div>
                    <span className="fw-bold d-block text-dark" style={{ fontSize: "0.78rem" }}>Authentic Filipino Handicrafts</span>
                    <span className="text-muted d-block" style={{ fontSize: "0.72rem" }}>100% handmade by master local weavers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Quick View Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

