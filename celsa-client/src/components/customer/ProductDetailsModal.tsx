"use client";

import { useState, useEffect } from "react";
import { useCartStore, type CartCustomization } from "@/stores/cartStore";
import type { Product, CustomizationOption } from "@/lib/types";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Reset local state when product changes or modal opens
  useEffect(() => {
    if (product) {
      setSelectedImage(0);
      setQuantity(1);
      setAddedToCart(false);

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
  const currentPrice = basePrice + totalModifier;

  function handleAddToCart() {
    if (!product) return;
    addItem({
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images.length > 0 ? product.images[0].url : "",
      basePrice: product.basePrice,
      customizations: customizationsForCart,
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
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
          {/* Header */}
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold text-dark mb-0">Quick View</h5>
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
              {/* Left Column: Gallery */}
              <div className="col-md-6">
                <div
                  className="bg-light rounded d-flex align-items-center justify-content-center overflow-hidden mb-3"
                  style={{ height: 300 }}
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
                {product.images.length > 1 && (
                  <div className="d-flex gap-2 flex-wrap">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        className={`border rounded overflow-hidden p-0 ${
                          i === selectedImage ? "border-success border-2" : ""
                        }`}
                        style={{ width: 50, height: 50, cursor: "pointer" }}
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
              </div>

              {/* Right Column: Info */}
              <div className="col-md-6 d-flex flex-column justify-content-between">
                <div>
                  {categoryName && (
                    <span
                      className="badge rounded-pill mb-2"
                      style={{
                        backgroundColor: "var(--celsa-cream)",
                        color: "var(--celsa-gold-dark)",
                      }}
                    >
                      {categoryName}
                    </span>
                  )}

                  <h4 className="fw-bold text-dark mb-1">{product.name}</h4>

                  <div className="fs-5 fw-bold text-success mb-3">
                    ₱{currentPrice.toFixed(2)}
                    {totalModifier > 0 && (
                      <span className="text-muted small fw-normal ms-2" style={{ fontSize: "0.8rem" }}>
                        (base ₱{basePrice.toFixed(2)} + ₱{totalModifier.toFixed(2)})
                      </span>
                    )}
                  </div>

                  <p className="text-muted small mb-3">{product.description}</p>

                  {/* Stock Info */}
                  <div className="mb-3">
                    {product.stock > 0 ? (
                      <span className="text-success small">
                        <i className="bi bi-check-circle me-1" />
                        In stock ({product.stock} available)
                      </span>
                    ) : (
                      <span className="text-danger small">
                        <i className="bi bi-x-circle me-1" />
                        Out of stock
                      </span>
                    )}
                  </div>

                  {/* Customization Options */}
                  {product.customizationOptions.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-semibold mb-2 small text-dark">Customize Your Order</h6>
                      {product.customizationOptions.map((opt: CustomizationOption) => (
                        <div className="mb-3" key={opt._id}>
                          <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: "0.75rem" }}>
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
                                    isSelected ? "btn-success" : "btn-outline-secondary"
                                  }`}
                                  style={{ fontSize: "0.75rem" }}
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
                  )}
                </div>

                {/* Bottom Actions inside Modal */}
                <div>
                  {product.stock > 0 && (
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <label className="small fw-semibold text-muted me-2">Qty:</label>
                      <div className="d-flex align-items-center border rounded">
                        <button
                          className="btn btn-sm btn-light border-0 py-1"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <i className="bi bi-dash" />
                        </button>
                        <span className="px-3 fw-semibold small">{quantity}</span>
                        <button
                          className="btn btn-sm btn-light border-0 py-1"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <i className="bi bi-plus" />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    className={`btn ${addedToCart ? "btn-outline-success" : "btn-success"} w-100 rounded-3 py-2 fw-semibold`}
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
                        Add to Cart — ₱{(currentPrice * quantity).toFixed(2)}
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
