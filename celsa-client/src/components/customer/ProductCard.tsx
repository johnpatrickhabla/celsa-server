"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

  const primaryImage = product.images?.[0]?.url;
  const secondaryImage = product.images?.[1]?.url || primaryImage;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="shein-card h-100 d-flex flex-column text-decoration-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── IMAGE WRAPPER (SHEIN 3:4 ASPECT RATIO) ── */}
      <div className="shein-media-wrap position-relative overflow-hidden">
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
      </div>

      {/* ── PRODUCT DETAILS (SHEIN STYLE CLEAN BOTTOM SECTION) ── */}
      <div className="shein-info-wrap p-2 p-sm-3 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          {/* Category / Material Tag */}
          <div className="mb-1">
            <span className="shein-category-tag">
              {typeof product.category === "object" && product.category !== null
                ? product.category.name
                : "Handcrafted"}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="shein-product-title mb-1" title={product.name}>
            {product.name}
          </h3>
        </div>

        {/* Price & Stock Status */}
        <div className="pt-1 d-flex align-items-baseline justify-content-between">
          <span className="shein-price-main">
            ₱{product.basePrice.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="shein-sold-tag">
            {product.stock > 0 ? "In Stock" : "Sold Out"}
          </span>
        </div>
      </div>
    </Link>
  );
}
