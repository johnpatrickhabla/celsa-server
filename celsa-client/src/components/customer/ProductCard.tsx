"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductCard({
  product,
  onQuickAdd,
  onViewDetails,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

  function handleBagClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    onQuickAdd(product);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 900);
  }

  function handleQuickViewClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails(product);
  }

  const primaryImage = product.images?.[0]?.url;
  const secondaryImage = product.images?.[1]?.url || primaryImage;

  return (
    <div
      className="shein-card h-100 d-flex flex-column"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── IMAGE WRAPPER (SHEIN 3:4 ASPECT RATIO) ── */}
      <div className="shein-media-wrap position-relative overflow-hidden">
        <Link href={`/products/${product.slug}`} className="d-block w-100 h-100">
          {primaryImage ? (
            <img
              src={isHovered && secondaryImage ? secondaryImage : primaryImage}
              alt={product.name}
              className="shein-product-img w-100 h-100 d-block"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/hero-basket.png";
              }}
            />
          ) : (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
              <i className="bi bi-image fs-1" />
            </div>
          )}
        </Link>

        {/* ── SHEIN BADGES (TOP-LEFT) ── */}
        <div className="shein-badges-container position-absolute top-0 start-0 p-2 d-flex flex-column gap-1">
          {isOutOfStock ? (
            <span className="shein-badge shein-badge-danger">Out of Stock</span>
          ) : isLowStock ? (
            <span className="shein-badge shein-badge-warning">Only {product.stock} Left</span>
          ) : product.isCustomizable ? (
            <span className="shein-badge shein-badge-custom">Customizable</span>
          ) : null}
        </div>

        {/* ── QUICK VIEW BUTTON (DESKTOP HOVER) ── */}
        <button
          type="button"
          className="shein-quick-view-btn d-none d-md-flex"
          onClick={handleQuickViewClick}
          aria-label="Quick View"
        >
          <i className="bi bi-eye me-1" />
          Quick View
        </button>

        {/* ── SHEIN FLOATING BAG / CART BUTTON (BOTTOM-RIGHT) ── */}
        <button
          type="button"
          className={`shein-bag-btn ${addedAnim ? "added" : ""} ${isOutOfStock ? "disabled" : ""}`}
          onClick={handleBagClick}
          disabled={isOutOfStock}
          aria-label={`Add ${product.name} to bag`}
          title={isOutOfStock ? "Out of Stock" : "Quick Add to Bag"}
        >
          {addedAnim ? (
            <i className="bi bi-check-lg" />
          ) : (
            <i className="bi bi-bag-plus" />
          )}
        </button>
      </div>

      {/* ── PRODUCT DETAILS (SHEIN STYLE CLEAN BOTTOM SECTION) ── */}
      <div className="shein-info-wrap p-2 p-sm-3 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          {/* Category / Material Tag & Rating */}
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="shein-category-tag">
              {typeof product.category === "object" && product.category !== null
                ? product.category.name
                : "Handcrafted"}
            </span>
            <div className="d-flex align-items-center gap-1">
              <i className="bi bi-star-fill text-warning" style={{ fontSize: "0.68rem" }} />
              <span className="fw-semibold text-dark" style={{ fontSize: "0.72rem" }}>
                4.9
              </span>
            </div>
          </div>

          {/* Product Title */}
          <Link
            href={`/products/${product.slug}`}
            className="text-decoration-none text-dark d-block"
          >
            <h3 className="shein-product-title mb-1" title={product.name}>
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Action Row */}
        <div className="pt-1">
          <div className="d-flex align-items-baseline justify-content-between mb-1">
            <span className="shein-price-main">
              ₱{product.basePrice.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="shein-sold-tag">
              {product.stock > 0 ? "In Stock" : "Sold Out"}
            </span>
          </div>

          {/* Mobile Direct Add button */}
          <button
            type="button"
            className="shein-add-btn w-100 mt-2 d-md-none"
            onClick={handleBagClick}
            disabled={isOutOfStock}
          >
            {addedAnim ? (
              <>
                <i className="bi bi-check-lg me-1" /> Added
              </>
            ) : isOutOfStock ? (
              "Out of Stock"
            ) : (
              <>
                <i className="bi bi-bag-plus me-1" /> Add to Cart
              </>
            )}
          </button>

          {/* Desktop Direct Action Buttons */}
          <div className="d-none d-md-flex gap-2 mt-2 pt-1">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill py-1 small fw-semibold"
              onClick={handleQuickViewClick}
              style={{ fontSize: "0.75rem" }}
            >
              Details
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm flex-grow-1 rounded-pill py-1 small fw-semibold shadow-sm"
              onClick={handleBagClick}
              disabled={isOutOfStock}
              style={{ fontSize: "0.75rem" }}
            >
              {addedAnim ? (
                <>
                  <i className="bi bi-check-lg me-1" /> Added
                </>
              ) : (
                <>
                  <i className="bi bi-bag-plus me-1" /> Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
