"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import type { Product, CustomizationOption } from "@/lib/types";

export default function CustomOrdersPage() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated, hydrate } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [designDescription, setDesignDescription] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    async function fetchCustomizableProducts() {
      try {
        const res = await api.get("/products");
        const allProds: Product[] = res.data.products || [];
        const customProds = allProds.filter(
          (p) => p.isCustomizable || p.customizationOptions?.length > 0
        );
        const list = customProds.length > 0 ? customProds : allProds;
        setProducts(list);
        if (list.length > 0) {
          handleSelectProduct(list[0]);
        }
      } catch (err) {
        console.error("Failed to load products for custom order:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomizableProducts();
  }, []);

  function handleSelectProduct(prod: Product) {
    setSelectedProduct(prod);
    const initial: Record<string, string> = {};
    prod.customizationOptions?.forEach((opt) => {
      if (opt.choices && opt.choices.length > 0) {
        initial[opt.type] = opt.choices[0].value;
      }
    });
    setSelections(initial);
  }

  // Handle Reference Image File Upload to Cloudinary
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", "celsa/custom_orders");

    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReferenceImageUrl(res.data.url);
    } catch (err: unknown) {
      console.error("Image upload failed:", err);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { error: string } } }).response?.data?.error
          : "Failed to upload reference image. Please try again.";
      setUploadError(msg || "Failed to upload reference image.");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleRemoveImage() {
    setReferenceImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Calculate live dynamic price
  let totalModifier = 0;
  const activeCustomizations: {
    type: string;
    label: string;
    selectedValue: string;
    priceModifier: number;
  }[] = [];

  if (selectedProduct) {
    selectedProduct.customizationOptions?.forEach((opt: CustomizationOption) => {
      const val = selections[opt.type];
      if (val) {
        const choice = opt.choices.find((c) => c.value === val);
        const mod = choice ? choice.priceModifier : 0;
        totalModifier += mod;
        activeCustomizations.push({
          type: opt.type,
          label: opt.label,
          selectedValue: val,
          priceModifier: mod,
        });
      }
    });
  }

  const basePrice = selectedProduct ? selectedProduct.basePrice : 0;
  const unitPrice = basePrice + totalModifier;
  const totalPrice = unitPrice * quantity;

  function handleAddToCart() {
    if (!selectedProduct) return;

    addItem({
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      productSlug: selectedProduct.slug,
      productImage: selectedProduct.images?.[0]?.url || "",
      basePrice: selectedProduct.basePrice,
      customizations: activeCustomizations,
      quantity,
      referenceImage: referenceImageUrl,
      designDescription,
      isCustomOrder: true,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      router.push("/cart");
    }, 800);
  }

  return (
    <div className="container-fluid px-4 py-5">
      <div
        className="rounded-4 p-4 p-md-5"
        style={{
          backgroundColor: "#fcfaf6",
          border: "1px solid #ebdcc5",
        }}
      >
        {/* Header Container */}
        <div
          className="mb-5 text-center"
          style={{
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <h2 className="fw-bold display-6 text-dark mb-3">
            Design Your <span style={{ color: "#198754" }}>Custom Handicraft</span>
          </h2>
          <p className="text-muted mb-3 mx-auto" style={{ maxWidth: 660 }}>
            Upload reference photos and provide detailed design descriptions.
            Our skilled artisans will review your custom specifications before
            handcrafting your personalized item.
          </p>
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-white border small text-muted shadow-sm">
            <i className="bi bi-shield-check text-success fs-6" />
            <span>Reviewed &amp; Approved by Administrator before production</span>
          </div>
        </div>

      {loading ? (
        <LoadingSkeleton variant="customOrders" />
      ) : products.length === 0 ? (
        <div className="text-center py-5 border rounded bg-light">
          <i className="bi bi-palette fs-1 text-muted d-block mb-2" />
          <p>No customizable products available right now.</p>
          <Link href="/products" className="btn btn-success btn-sm">
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {/* Step 1: Select Product */}
          <div className="col-lg-4">
            <div className="border rounded-4 p-4 bg-white shadow-sm h-100">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <span className="badge bg-success rounded-circle">1</span>
                Select Base Item
              </h6>
              <div
                className="d-flex flex-column gap-2 overflow-auto"
                style={{ maxHeight: 600 }}
              >
                {products.map((prod) => {
                  const isSelected = selectedProduct?._id === prod._id;
                  return (
                    <div
                      key={prod._id}
                      className={`border rounded-3 p-3 d-flex align-items-center gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-success bg-success bg-opacity-10 shadow-sm"
                          : "bg-light"
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSelectProduct(prod)}
                    >
                      <div
                        className="rounded bg-white d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden border"
                        style={{ width: 54, height: 54 }}
                      >
                        {prod.images?.[0]?.url ? (
                          <img
                            src={prod.images[0].url}
                            alt={prod.name}
                            style={{
                              objectFit: "cover",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        ) : (
                          <i className="bi bi-image text-muted" />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{prod.name}</div>
                        <div className="text-success small fw-bold">
                          ₱{prod.basePrice.toFixed(2)}
                        </div>
                      </div>
                      {isSelected && (
                        <i className="bi bi-check-circle-fill text-success fs-5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Customization Options & Image Upload */}
          <div className="col-lg-5">
            <div className="border rounded-4 p-4 bg-white shadow-sm h-100">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <span className="badge bg-success rounded-circle">2</span>
                Design &amp; Custom Specifications
              </h6>

              {selectedProduct ? (
                <>
                  <div className="mb-4 pb-3 border-bottom d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 bg-light d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden border"
                      style={{ width: 64, height: 64 }}
                    >
                      {selectedProduct.images?.[0]?.url ? (
                        <img
                          src={selectedProduct.images[0].url}
                          alt={selectedProduct.name}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : (
                        <i className="bi bi-image text-muted fs-4" />
                      )}
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0">{selectedProduct.name}</h5>
                      <small className="text-muted">
                        Base Price: ₱{selectedProduct.basePrice.toFixed(2)}
                      </small>
                    </div>
                  </div>

                  {/* Predefined Customization Options */}
                  {selectedProduct.customizationOptions?.length > 0 && (
                    <div className="mb-4">
                      {selectedProduct.customizationOptions.map((opt) => (
                        <div key={opt._id} className="mb-3">
                          <label className="form-label small fw-semibold text-dark mb-2">
                            {opt.label}
                            {opt.required && (
                              <span className="text-danger ms-1">*</span>
                            )}
                          </label>
                          <div className="d-flex flex-wrap gap-2">
                            {opt.choices?.map((choice) => {
                              const active =
                                selections[opt.type] === choice.value;
                              return (
                                <button
                                  key={choice.value}
                                  type="button"
                                  className={`btn btn-sm ${
                                    active
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

                  {/* Reference Image Upload Section */}
                  <div className="mb-4 p-3 rounded-3 border bg-light">
                    <label className="form-label small fw-bold text-dark d-flex justify-content-between align-items-center mb-1">
                      <span>
                        <i className="bi bi-image me-1 text-success" /> Upload
                        Reference Image
                      </span>
                      <span className="text-muted fw-normal" style={{ fontSize: "0.75rem" }}>
                        JPG, PNG (Max 5MB)
                      </span>
                    </label>
                    <p className="text-muted small mb-2" style={{ fontSize: "0.75rem" }}>
                      Upload a sketch, photo, or reference design for the artisans.
                    </p>

                    {referenceImageUrl ? (
                      <div className="position-relative d-inline-block border rounded-3 overflow-hidden shadow-sm bg-white p-1">
                        <img
                          src={referenceImageUrl}
                          alt="Reference design"
                          style={{ width: 140, height: 140, objectFit: "cover" }}
                          className="rounded-2 d-block"
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle p-1"
                          style={{ width: 26, height: 26, lineHeight: 1 }}
                          onClick={handleRemoveImage}
                          title="Remove image"
                        >
                          <i className="bi bi-x" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        {uploadingImage && (
                          <div className="d-flex align-items-center gap-2 mt-2 text-success small">
                            <span className="spinner-border spinner-border-sm" />
                            <span>Uploading reference image...</span>
                          </div>
                        )}
                        {uploadError && (
                          <div className="alert alert-danger py-1 mt-2 small mb-0">
                            {uploadError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Written Design Description */}
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-dark mb-1">
                      <i className="bi bi-pencil-square me-1 text-success" />
                      Detailed Design Description &amp; Specifications *
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={4}
                      placeholder="Specify your preferred dimensions (height, width), color tones, custom engraved names/monograms, pattern variations, or special materials..."
                      value={designDescription}
                      onChange={(e) => setDesignDescription(e.target.value)}
                      required
                    />
                    <div className="form-text text-muted" style={{ fontSize: "0.75rem" }}>
                      Please provide as much detail as possible to ensure accurate production.
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="d-flex align-items-center gap-3">
                    <label className="small fw-semibold mb-0">Quantity:</label>
                    <div className="d-flex align-items-center border rounded">
                      <button
                        className="btn btn-sm btn-light border-0 px-3"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </button>
                      <span className="px-3 fw-bold">{quantity}</span>
                      <button
                        className="btn btn-sm btn-light border-0 px-3"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted">
                  Select a product on the left to customize.
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Live Summary & Price */}
          <div className="col-lg-3">
            <div className="border rounded-4 p-4 bg-white shadow-sm h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-success rounded-circle">3</span>
                  Order Summary
                </h6>

                {selectedProduct && (
                  <div className="small mb-3">
                    <div className="fw-semibold text-dark fs-6">
                      {selectedProduct.name}
                    </div>
                    <div className="text-muted mb-2">
                      Base: ₱{basePrice.toFixed(2)}
                    </div>

                    <div className="border-top pt-2 mt-2">
                      <div
                        className="fw-semibold mb-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Selected Options:
                      </div>
                      {activeCustomizations.length > 0 ? (
                        activeCustomizations.map((c) => (
                          <div
                            key={c.type}
                            className="d-flex justify-content-between text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <span>
                              {c.label}: <strong>{c.selectedValue}</strong>
                            </span>
                            {c.priceModifier > 0 && (
                              <span>+₱{c.priceModifier}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div
                          className="text-muted italic"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Standard specifications
                        </div>
                      )}
                    </div>

                    {referenceImageUrl && (
                      <div className="mt-3 p-2 bg-light rounded border text-center">
                        <span className="badge bg-success bg-opacity-10 text-success mb-1">
                          Reference Image Attached
                        </span>
                        <div className="d-flex justify-content-center">
                          <img
                            src={referenceImageUrl}
                            alt="Attached Reference"
                            style={{ width: 60, height: 60, objectFit: "cover" }}
                            className="rounded border"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-top pt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Estimated Unit Price:</span>
                  <span className="fw-semibold small">
                    ₱{unitPrice.toFixed(2)}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold">Total ({quantity}x):</span>
                  <span className="fw-bold text-success fs-4">
                    ₱{totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="alert alert-info py-2 px-3 small mb-3 border-0 bg-info bg-opacity-10 text-dark">
                  <i className="bi bi-info-circle me-1 text-info" />
                  <strong>Note:</strong> Custom requests are reviewed by our team prior to production.
                </div>

                <button
                  className={`btn ${
                    added ? "btn-outline-success" : "btn-success"
                  } w-100 py-2 rounded-3 fw-semibold shadow-sm`}
                  onClick={handleAddToCart}
                  disabled={!selectedProduct || added || uploadingImage}
                >
                  {added ? (
                    <>
                      <i className="bi bi-check-circle me-2" />
                      Added! Redirecting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus me-2" />
                      Add Customization to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
