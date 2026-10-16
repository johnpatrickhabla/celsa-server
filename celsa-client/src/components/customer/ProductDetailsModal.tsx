"use client";

import { useState, useEffect } from "react";
import { useCartStore, type CartCustomization } from "@/stores/cartStore";
import type { Product, CustomizationOption } from "@/lib/types";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SIZES = ["S", "M", "L", "XL"] as const;
const SIZE_PRICE_MODIFIERS: Record<string, number> = {
  S: 0,
  M: 3,
  L: 5,
  XL: 8,
};

export default function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sizeError, setSizeError] = useState(false);

  // Reset local state when product changes or modal opens
  useEffect(() => {
    if (product) {
      setSelectedImage(0);
      setQuantity(1);
      setAddedToCart(false);
      setSelectedSize("");
      setSizeError(false);

      // Initialize selections with first choice for required options
      const initialSelections: Record<string, string> = {};
      for (const opt of product.customizationOptions) {
        if (opt.required && opt.choices.length > 0) {
          initialSelections[opt.type] = opt.choices[0].value;
        }
      }
      setSelections(initialSelections);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  // Calculate current price based on selections
  const basePrice = product.basePrice;
  let totalModifier = 0;
  const customizationsForCart: CartCustomization[] = [];

  for (const opt of product.customizationOptions) {
    const selectedValue = selections[opt.type];
    if (selectedValue) {
      const choice = opt.choices.find((c) => c.value === selectedValue);
      if (choice) {
        totalModifier += choice.priceModifier;
        customizationsForCart.push({
          type: opt.type,
          label: opt.label,
          selectedValue,
          priceModifier: choice.priceModifier,
        });
      }
    }
  }
  // Show the default S/M/L/XL picker only if the product has no size option of its own
  const hasOwnSizeOption = product.customizationOptions.some((o) => o.type === "size");
  const showDefaultSizes = !hasOwnSizeOption;
  const sizeModifier = showDefaultSizes && selectedSize ? (SIZE_PRICE_MODIFIERS[selectedSize] || 0) : 0;
  const currentPrice = basePrice + totalModifier + sizeModifier;

  function handleAddToCart() {
    if (!product) return;
    if (showDefaultSizes && !selectedSize) {
      setSizeError(true);
      return;
    }
    const cartCustomizations = showDefaultSizes
      ? [
          { type: "size", label: "Size", selectedValue: selectedSize, priceModifier: sizeModifier },
          ...customizationsForCart,
        ]
      : customizationsForCart;
    addItem({
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images.length > 0 ? product.images[0].url : "",
      basePrice: product.basePrice,
      customizations: cartCustomizations,
      quantity,
    });
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
    }, 1500);
  }

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? (product.category as { name: string }).name
      : "";

  return (
    <div
      className="modal fade show d-block bg-black bg-opacity-50"
      tabIndex={-1}
      style={{ zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div
          className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
          style={{
            backgroundColor: "#fcfaf6",
            border: "1px solid #ebdcc5",
          }}
        >
          {/* Header */}
          <div
            className="modal-header border-0 pb-3 pt-3 px-4 d-flex justify-content-between align-items-center"
            style={{
              backgroundColor: "#fcfaf6",
              borderBottom: "1px solid #ebdcc5",
            }}
          >
            <h5 className="fw-bold mb-0" style={{ color: "#2c251e" }}>Quick View</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            <div className="row g-4">
              {/* Left Column: Product Gallery */}
              <div className="col-md-6 d-flex flex-column">
                {/* Product Image */}
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center overflow-hidden mb-3"
                  style={{
                    height: 360,
                    backgroundColor: "#ffffff",
                    border: "1px solid #ebdcc5",
                  }}
                >
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[selectedImage]?.url}
                      alt={product.name}
                      className="img-fluid"
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  ) : (
                    <i className="bi bi-image text-muted" style={{ fontSize: "3rem" }} />
                  )}
                </div>

                {/* Thumbnail list */}
                {product.images.length > 1 && (
                  <div className="d-flex gap-2 flex-wrap mb-2">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        className={`rounded overflow-hidden p-0 ${
                          i === selectedImage ? "border-success border-2 shadow-sm" : "border"
                        }`}
                        style={{
                          width: 56,
                          height: 56,
                          cursor: "pointer",
                          borderColor: i === selectedImage ? "#198754" : "#ebdcc5",
                        }}
                        onClick={() => setSelectedImage(i)}
                      >
                        <img
                          src={img.url}
                          alt={`${product.name} ${i + 1}`}
                          style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Size Selector below the pictures */}
                {showDefaultSizes && (
                  <div className="mt-3 p-3 rounded-3 bg-white border" style={{ borderColor: "#ebdcc5" }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label small fw-semibold text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                        Size<span className="text-danger ms-1">*</span>
                      </label>
                      {selectedSize && (
                        <span className="small fw-semibold" style={{ color: "#8c6b2d", fontSize: "0.78rem" }}>
                          Selected: <span className="badge bg-success text-white px-2 py-1">{selectedSize}</span>
                        </span>
                      )}
                    </div>
                    <div className="d-flex gap-2" role="radiogroup" aria-label="Select size">
                      {DEFAULT_SIZES.map((size) => {
                        const isSelected = selectedSize === size;
                        const modifier = SIZE_PRICE_MODIFIERS[size];
                        return (
                          <button
                            key={size}
                            id={`quickview-size-${size.toLowerCase()}`}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`btn btn-sm fw-semibold flex-fill position-relative d-flex align-items-center justify-content-center ${
                              isSelected ? "btn-success shadow-sm" : "btn-outline-secondary bg-white text-dark"
                            }`}
                            style={{
                              height: 42,
                              fontSize: "0.9rem",
                              borderColor: isSelected ? "#198754" : sizeError ? "#dc3545" : "#ebdcc5",
                              transition: "all 0.15s ease",
                            }}
                            onClick={() => {
                              setSelectedSize(size);
                              setSizeError(false);
                            }}
                          >
                            <span>{size}</span>
                            {modifier > 0 && (
                              <span
                                className="position-absolute"
                                style={{
                                  top: "2px",
                                  right: "4px",
                                  fontSize: "0.62rem",
                                  fontWeight: 700,
                                  color: isSelected ? "#ffffff" : "#8c6b2d",
                                  backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "#f8f3ea",
                                  padding: "1px 4px",
                                  borderRadius: "3px",
                                  lineHeight: 1,
                                }}
                              >
                                +{modifier}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {sizeError && (
                      <div className="text-danger small mt-2 d-flex align-items-center" style={{ fontSize: "0.78rem" }}>
                        <i className="bi bi-exclamation-circle me-1" />
                        Please select a size.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Product Info & Actions */}
              <div className="col-md-6 d-flex flex-column justify-content-between">
                <div>
                  {categoryName && (
                    <span
                      className="badge rounded-pill mb-2 px-3 py-1"
                      style={{
                        backgroundColor: "#f7f3eb",
                        color: "#8c6b2d",
                        border: "1px solid #ebdcc5",
                        fontSize: "0.75rem",
                      }}
                    >
                      {categoryName}
                    </span>
                  )}

                  <h4 className="fw-bold text-dark mb-1">{product.name}</h4>

                  <div className="fs-5 fw-bold text-success mb-2">
                    ₱{currentPrice.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {totalModifier > 0 && (
                      <span className="text-muted small fw-normal ms-2" style={{ fontSize: "0.8rem" }}>
                        (base ₱{basePrice.toFixed(2)} + ₱{totalModifier.toFixed(2)})
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="mb-2">
                    {product.stock > 0 ? (
                      <span className="text-success small fw-medium">
                        <i className="bi bi-check-circle me-1" />
                        In stock ({product.stock} available)
                      </span>
                    ) : (
                      <span className="text-danger small fw-medium">
                        <i className="bi bi-x-circle me-1" />
                        Out of stock
                      </span>
                    )}
                  </div>

                  <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                    {product.description}
                  </p>

                  {/* Customization Options */}
                  {product.customizationOptions.length > 0 ? (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3 text-dark">Customize Your Order</h6>
                      {product.customizationOptions.map((opt: CustomizationOption) => (
                        <div className="mb-3" key={opt._id}>
                          <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: "0.8rem" }}>
                            {opt.label}
                            {opt.required && <span className="text-danger ms-1">*</span>}
                          </label>
                          <div className="d-flex flex-wrap gap-2">
                            {opt.choices.map((choice) => {
                              const isSelected = selections[opt.type] === choice.value;
                              return (
                                <button
                                  key={choice.value}
                                  type="button"
                                  className={`btn btn-sm ${
                                    isSelected
                                      ? "btn-success"
                                      : "btn-outline-secondary bg-white"
                                  }`}
                                  style={{
                                    fontSize: "0.78rem",
                                    borderColor: isSelected ? "#198754" : "#ebdcc5",
                                  }}
                                  onClick={() =>
                                    setSelections((prev) => ({
                                      ...prev,
                                      [opt.type]: choice.value,
                                    }))
                                  }
                                >
                                  {choice.value}
                                  {choice.priceModifier > 0 && (
                                    <span className="ms-1 opacity-75">
                                      (+₱{choice.priceModifier})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Quantity Selector */}
                  {product.stock > 0 && (
                    <div className="mb-3">
                      <label className="small fw-semibold text-muted d-block mb-1">Qty:</label>
                      <div
                        className="d-inline-flex align-items-center border rounded bg-white shadow-sm"
                        style={{ borderColor: "#ebdcc5" }}
                      >
                        <button
                          className="btn btn-sm btn-light border-0 py-1 px-3"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          aria-label="Decrease quantity"
                        >
                          <i className="bi bi-dash" />
                        </button>
                        <span className="px-3 fw-semibold small">{quantity}</span>
                        <button
                          className="btn btn-sm btn-light border-0 py-1 px-3"
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          aria-label="Increase quantity"
                        >
                          <i className="bi bi-plus" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Total Amount below quantity */}
                  <div
                    className="d-flex justify-content-between align-items-center mb-3 p-3 rounded-3 bg-white shadow-sm"
                    style={{ border: "1px solid #ebdcc5" }}
                  >
                    <span className="fw-semibold text-muted small">Total Amount:</span>
                    <span className="fs-5 fw-bold text-success">
                      ₱{(currentPrice * quantity).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Add to Cart button (No total amount inside) */}
                <div className="mt-2">
                  <button
                    className={`btn ${addedToCart ? "btn-outline-success" : "btn-success"} w-100 rounded-3 py-2 fw-semibold shadow-sm`}
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                  >
                    {addedToCart ? (
                      <>
                        <i className="bi bi-check-lg me-2" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cart-plus me-2" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
