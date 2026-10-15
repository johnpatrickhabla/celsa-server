"use client";

import { useEffect, useState, useRef } from "react";
import api, { getApiError } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

interface CustomChoiceInput {
  value: string;
  priceModifier: number;
}

interface CustomOptionInput {
  type: "material" | "color" | "size" | "engraving" | "add-on" | "other";
  label: string;
  required: boolean;
  choices: CustomChoiceInput[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct?: Product) => void;
  categories?: Category[];
}

export default function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
  categories: initialCategories,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    basePrice: "",
    stock: "10",
    lowStockThreshold: "5",
    isFeatured: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [options, setOptions] = useState<CustomOptionInput[]>([]);

  // Load categories if not provided
  useEffect(() => {
    if (!isOpen) return;

    async function loadCats() {
      try {
        const res = await api.get("/categories");
        const cats: Category[] = res.data.categories || [];
        setCategories(cats);
        if (cats.length > 0 && !form.category) {
          setForm((prev) => ({ ...prev, category: cats[0]._id }));
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }

    if (!initialCategories || initialCategories.length === 0) {
      loadCats();
    } else {
      setCategories(initialCategories);
      if (initialCategories.length > 0 && !form.category) {
        setForm((prev) => ({ ...prev, category: initialCategories[0]._id }));
      }
    }
  }, [isOpen, initialCategories]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !loading) {
        handleModalClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading]);

  function resetState() {
    setForm({
      name: "",
      description: "",
      category: categories.length > 0 ? categories[0]._id : "",
      basePrice: "",
      stock: "10",
      lowStockThreshold: "5",
      isFeatured: false,
    });
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setOptions([]);
    setError(null);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleModalClose() {
    if (loading) return;
    resetState();
    onClose();
  }

  function handleFileSelect(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, JPEG, WEBP, or GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB limit. Please choose a smaller picture.");
      return;
    }

    setError(null);
    setImageFile(file);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function addOption() {
    setOptions([
      ...options,
      {
        type: "material",
        label: "New Option",
        required: false,
        choices: [{ value: "Standard", priceModifier: 0 }],
      },
    ]);
  }

  function removeOption(idx: number) {
    setOptions(options.filter((_, i) => i !== idx));
  }

  function addChoice(optIdx: number) {
    const updated = [...options];
    updated[optIdx].choices.push({ value: "", priceModifier: 0 });
    setOptions(updated);
  }

  function removeChoice(optIdx: number, choiceIdx: number) {
    const updated = [...options];
    updated[optIdx].choices = updated[optIdx].choices.filter((_, i) => i !== choiceIdx);
    setOptions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = "";

      // Upload product image if attached
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("folder", "celsa/products");

        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        finalImageUrl = uploadRes.data?.url || "";
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        basePrice: parseFloat(form.basePrice) || 0,
        stock: parseInt(form.stock) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        isFeatured: form.isFeatured,
        isActive: true,
        images: finalImageUrl ? [{ url: finalImageUrl }] : [],
        customizationOptions: options,
      };

      const res = await api.post("/products", payload);
      const createdProduct = res.data?.product;

      resetState();
      onSuccess(createdProduct);
      onClose();
    } catch (err) {
      setError(getApiError(err, "Failed to create product. Please verify fields."));
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        zIndex: 1060,
        backdropFilter: "blur(4px)",
      }}
      onClick={handleModalClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-product-title"
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
        style={{ maxWidth: 880 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
          style={{
            backgroundColor: "#fcfaf6",
            border: "1px solid #ebdcc5",
          }}
        >
          {/* Modal Header */}
          <div
            className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center bg-white"
            style={{ borderColor: "#ebdcc5" }}
          >
            <div>
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                  style={{ width: 34, height: 34 }}
                >
                  <i className="bi bi-box-seam fs-6" />
                </div>
                <h5 id="create-product-title" className="fw-bold mb-0 text-dark">
                  Add New Product
                </h5>
              </div>
              <small className="text-muted d-block mt-0.5" style={{ fontSize: "0.78rem" }}>
                Create a new handcrafted catalog item with pricing, inventory, and customization options.
              </small>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={handleModalClose}
              disabled={loading}
            />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle fs-6 text-danger flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form id="createProductForm" onSubmit={handleSubmit}>
              {/* Section 1: Basic Information */}
              <div
                className="card border-0 rounded-3 p-3.5 mb-3.5 bg-white shadow-sm"
                style={{ border: "1px solid #ebdcc5" }}
              >
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill fw-bold">
                    1
                  </span>
                  <h6 className="fw-bold mb-0 text-dark">Product Details &amp; Pricing</h6>
                </div>

                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold text-dark">
                      Product Name <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control form-control-sm rounded-3"
                      placeholder="e.g. Bicolano Woven Abaca Tote Bag"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-sm rounded-3"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      {categories.length === 0 ? (
                        <option value="">No categories available</option>
                      ) : (
                        categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">
                      Description
                    </label>
                    <textarea
                      className="form-control form-control-sm rounded-3"
                      rows={3}
                      placeholder="Describe the handicraft materials, artisanal weaving technique, dimensions, and styling notes..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">
                      Base Price (₱) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control rounded-end-3"
                        placeholder="0.00"
                        value={form.basePrice}
                        onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">
                      Initial Stock Units <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control form-control-sm rounded-3"
                      placeholder="10"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control form-control-sm rounded-3"
                      placeholder="5"
                      value={form.lowStockThreshold}
                      onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <div className="form-check form-switch mt-1">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        role="switch"
                        id="modalFeatCheck"
                        checked={form.isFeatured}
                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      />
                      <label className="form-check-label small fw-medium text-dark" htmlFor="modalFeatCheck">
                        Feature this product on customer homepage hero &amp; showcase
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Product Picture Attachment */}
              <div
                className="card border-0 rounded-3 p-3.5 mb-3.5 bg-white shadow-sm"
                style={{ border: "1px solid #ebdcc5" }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill fw-bold">
                      2
                    </span>
                    <h6 className="fw-bold mb-0 text-dark">Product Picture Attachment</h6>
                  </div>
                  <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                    PNG, JPG, WEBP, or GIF (Max 5MB)
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="d-none"
                  onChange={handleFileChange}
                />

                {!imagePreview ? (
                  <div
                    className={`border border-2 border-dashed rounded-3 p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-success bg-success bg-opacity-10"
                        : "border-secondary border-opacity-25 bg-light"
                    }`}
                    style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <i className="bi bi-cloud-arrow-up fs-2 text-success mb-1 d-block" />
                    <div className="fw-semibold text-dark small mb-1">
                      Click to choose picture or drag &amp; drop here
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                      Upload high quality photograph of the handcrafted item
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success mt-2.5 px-3 py-1 rounded-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <i className="bi bi-folder2-open me-1" /> Browse Computer / Device
                    </button>
                  </div>
                ) : (
                  <div className="border rounded-3 p-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="bg-white border rounded-2 p-1 overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                        style={{ width: 72, height: 72 }}
                      >
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                      <div>
                        <div className="fw-semibold text-dark small text-truncate" style={{ maxWidth: 280 }}>
                          {imageFile?.name || "Attached Picture"}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : "Ready"} •{" "}
                          <span className="text-success fw-semibold">
                            <i className="bi bi-check-circle-fill me-1" /> Attached &amp; Ready
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-3"
                        onClick={removeImage}
                        title="Remove Picture"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Customization Options Builder */}
              <div
                className="card border-0 rounded-3 p-3.5 bg-white shadow-sm"
                style={{ border: "1px solid #ebdcc5" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2.5">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill fw-bold">
                      3
                    </span>
                    <h6 className="fw-bold mb-0 text-dark">Customization Options</h6>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success rounded-pill px-3 py-1"
                    onClick={addOption}
                  >
                    <i className="bi bi-plus-lg me-1" /> Add Option
                  </button>
                </div>

                <p className="text-muted small mb-3" style={{ fontSize: "0.75rem" }}>
                  Add options if this item allows customers to pick variable materials, weave colors, sizes, or custom engraving.
                </p>

                {options.length === 0 ? (
                  <div className="text-muted small border rounded-3 p-3 text-center bg-light">
                    Standard product (no custom choices). Click <strong>&quot;Add Option&quot;</strong> to configure variable choices.
                  </div>
                ) : (
                  options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="border rounded-3 p-3 mb-3 bg-light"
                      style={{ borderColor: "#ebdcc5" }}
                    >
                      <div className="row g-2 mb-2 align-items-center">
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Option Type
                          </label>
                          <select
                            className="form-select form-select-sm rounded-3"
                            value={opt.type}
                            onChange={(e) => {
                              const updated = [...options];
                              updated[optIdx].type = e.target.value as CustomOptionInput["type"];
                              setOptions(updated);
                            }}
                          >
                            <option value="material">Material</option>
                            <option value="color">Color</option>
                            <option value="size">Size</option>
                            <option value="engraving">Engraving</option>
                            <option value="add-on">Add-on</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="col-md-5">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Display Label
                          </label>
                          <input
                            className="form-control form-control-sm rounded-3"
                            placeholder="e.g. Choose Abaca Color"
                            value={opt.label}
                            onChange={(e) => {
                              const updated = [...options];
                              updated[optIdx].label = e.target.value;
                              setOptions(updated);
                            }}
                          />
                        </div>

                        <div className="col-md-3 text-end pt-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                            onClick={() => removeOption(optIdx)}
                          >
                            <i className="bi bi-trash me-1" /> Remove
                          </button>
                        </div>
                      </div>

                      {/* Choice items */}
                      <div className="ms-2 border-start ps-3 pt-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-semibold text-dark" style={{ fontSize: "0.75rem" }}>
                            Choices &amp; Price Modifiers:
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-success p-0 text-decoration-none fw-semibold"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => addChoice(optIdx)}
                          >
                            + Add Choice
                          </button>
                        </div>

                        {opt.choices.map((choice, cIdx) => (
                          <div key={cIdx} className="d-flex gap-2 mb-2 align-items-center">
                            <input
                              className="form-control form-control-sm rounded-3"
                              placeholder="Choice name (e.g. Natural Tan / Large)"
                              value={choice.value}
                              onChange={(e) => {
                                const updated = [...options];
                                updated[optIdx].choices[cIdx].value = e.target.value;
                                setOptions(updated);
                              }}
                            />
                            <div className="input-group input-group-sm" style={{ maxWidth: 170 }}>
                              <span className="input-group-text bg-white">+₱</span>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control rounded-end-3"
                                placeholder="0.00"
                                value={choice.priceModifier}
                                onChange={(e) => {
                                  const updated = [...options];
                                  updated[optIdx].choices[cIdx].priceModifier =
                                    parseFloat(e.target.value) || 0;
                                  setOptions(updated);
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-0"
                              onClick={() => removeChoice(optIdx, cIdx)}
                              title="Delete choice"
                            >
                              <i className="bi bi-x-circle" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer border-top py-2.5 px-4 bg-white d-flex justify-content-between"
            style={{ borderColor: "#ebdcc5" }}
          >
            <button
              type="button"
              className="btn btn-light border rounded-pill px-4 fw-semibold"
              onClick={handleModalClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="createProductForm"
              className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving Product…
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-1.5" />
                  Save Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
