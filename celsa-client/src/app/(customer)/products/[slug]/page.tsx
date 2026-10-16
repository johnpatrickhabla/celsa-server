"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useCartStore, type CartCustomization } from "@/stores/cartStore";
import type { Product, CustomizationOption } from "@/lib/types";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Customization selections — keyed by option type
  const [selections, setSelections] = useState<Record<string, string>>({});

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/products/${slug}`);
        const prod = res.data.product as Product;
        setProduct(prod);

        // Initialize selections with first choice for required options
        const initialSelections: Record<string, string> = {};
        for (const opt of prod.customizationOptions) {
          if (opt.required && opt.choices.length > 0) {
            initialSelections[opt.type] = opt.choices[0].value;
          }
        }
        setSelections(initialSelections);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  if (loading) {
    return <LoadingSkeleton variant="productDetail" />;
  }

  if (!product) {
    return (
      <div className="container-fluid px-4 py-5 text-center">
        <i className="bi bi-exclamation-triangle fs-1 text-muted d-block mb-2" />
        <h5>Product not found</h5>
        <Link href="/products" className="btn btn-success btn-sm mt-3">
          Back to Products
        </Link>
      </div>
    );
  }

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
    setTimeout(() => setAddedToCart(false), 2000);
  }

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? (product.category as { name: string }).name
      : "";

  return (
    <div className="container-fluid px-4 py-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link href="/">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/products">Products</Link>
          </li>
          <li className="breadcrumb-item active">{product.name}</li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* Image gallery */}
        <div className="col-md-6">
          <div
            className="bg-light rounded d-flex align-items-center justify-content-center overflow-hidden mb-3"
            style={{ height: 400 }}
          >
            {product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]?.url}
                alt={product.name}
                className="img-fluid"
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <i className="bi bi-image text-muted" style={{ fontSize: "4rem" }} />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="d-flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`border rounded overflow-hidden p-0 ${
                    i === selectedImage ? "border-success border-2" : ""
                  }`}
                  style={{ width: 70, height: 70, cursor: "pointer" }}
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

        {/* Product info */}
        <div className="col-md-6">
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

          <h3 className="fw-bold">{product.name}</h3>

          <div className="fs-4 fw-bold text-success mb-3">
            ₱{currentPrice.toFixed(2)}
            {totalModifier > 0 && (
              <span className="text-muted small fw-normal ms-2">
                (base ₱{basePrice.toFixed(2)} + ₱{totalModifier.toFixed(2)})
              </span>
            )}
          </div>

          <p className="text-muted">{product.description}</p>

          {/* Stock info */}
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

          {/* Customization options */}
          {product.customizationOptions.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-semibold mb-3">Customize Your Order</h6>
              {product.customizationOptions.map((opt: CustomizationOption) => (
                <div className="mb-3" key={opt._id}>
                  <label className="form-label small fw-semibold">
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
                              : "btn-outline-secondary"
                          }`}
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

          {/* Quantity + Add to Cart */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center border rounded">
              <button
                className="btn btn-sm btn-light border-0"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <i className="bi bi-dash" />
              </button>
              <span className="px-3 fw-semibold">{quantity}</span>
              <button
                className="btn btn-sm btn-light border-0"
                onClick={() => setQuantity(quantity + 1)}
              >
                <i className="bi bi-plus" />
              </button>
            </div>

            <button
              className={`btn ${addedToCart ? "btn-outline-success" : "btn-success"} flex-grow-1`}
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

          {/* Quick info */}
          <div className="border-top pt-3">
            <div className="row g-2 text-muted small">
              <div className="col-6">
                <i className="bi bi-truck me-2" />
                Secure Delivery
              </div>
              <div className="col-6">
                <i className="bi bi-shield-check me-2" />
                Quality Guaranteed
              </div>
              <div className="col-6">
                <i className="bi bi-arrow-counterclockwise me-2" />
                Easy Returns
              </div>
              <div className="col-6">
                <i className="bi bi-credit-card me-2" />
                Multiple Payment Options
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
