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

interface ProductPictureItem {
  id: string;
  file?: File | null;
  previewUrl: string;
  uploadedUrl?: string | null;
  isUploading?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedProduct?: Product) => void;
  productToEdit?: Product | null;
  categories?: Category[];
}

export default function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
  categories: initialCategories,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(productToEdit && productToEdit._id);

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

  const [images, setImages] = useState<ProductPictureItem[]>([]);
  const replaceIndexRef = useRef<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
        if (cats.length > 0 && !form.category && !productToEdit) {
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
      if (initialCategories.length > 0 && !form.category && !productToEdit) {
        setForm((prev) => ({ ...prev, category: initialCategories[0]._id }));
      }
    }
  }, [isOpen, initialCategories, productToEdit]);

  // Initialize or reset state when modal opens or productToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      const catId =
        typeof productToEdit.category === "object" && productToEdit.category !== null
          ? productToEdit.category._id
          : (productToEdit.category as string) || "";

      setForm({
        name: productToEdit.name || "",
        description: productToEdit.description || "",
        category: catId,
        basePrice: productToEdit.basePrice !== undefined ? productToEdit.basePrice.toString() : "",
        stock: productToEdit.stock !== undefined ? productToEdit.stock.toString() : "0",
        lowStockThreshold:
          productToEdit.lowStockThreshold !== undefined ? productToEdit.lowStockThreshold.toString() : "5",
        isFeatured: Boolean(productToEdit.isFeatured),
      });

      if (productToEdit.images && productToEdit.images.length > 0) {
        const loaded: ProductPictureItem[] = productToEdit.images
          .filter((img) => Boolean(img?.url))
          .slice(0, 3)
          .map((img, idx) => ({
            id: `existing-${idx}-${img.url}`,
            previewUrl: img.url,
            uploadedUrl: img.url,
            file: null,
            isUploading: false,
          }));
        setImages(loaded);
      } else {
        setImages([]);
      }

      // Deep clone customization options
      const mappedOptions: CustomOptionInput[] = (productToEdit.customizationOptions || []).map((opt) => ({
        type: opt.type,
        label: opt.label,
        required: opt.required,
        choices: (opt.choices || []).map((ch) => ({
          value: ch.value,
          priceModifier: ch.priceModifier,
        })),
      }));
      setOptions(mappedOptions);
      setError(null);
    } else {
      resetState();
    }
  }, [isOpen, productToEdit]);

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
    images.forEach((img) => {
      if (img.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setImages([]);
    replaceIndexRef.current = null;
    setStatusMessage(null);
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

  async function uploadSingleImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", "celsa/products");

    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.url || "";
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
    const previewUrl = URL.createObjectURL(file);
    const pictureId = `pic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newPic: ProductPictureItem = {
      id: pictureId,
      file,
      previewUrl,
      uploadedUrl: null,
      isUploading: true,
    };

    const replaceIdx = replaceIndexRef.current;
    replaceIndexRef.current = null;

    if (replaceIdx !== null && replaceIdx >= 0 && replaceIdx < images.length) {
      if (images[replaceIdx].previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(images[replaceIdx].previewUrl);
      }
      setImages((prev) => {
        const copy = [...prev];
        copy[replaceIdx] = newPic;
        return copy;
      });
    } else {
      if (images.length >= 3) {
        setError("Maximum of 3 product pictures allowed.");
        return;
      }
      setImages((prev) => [...prev, newPic]);
    }

    // Pre-upload in background
    uploadSingleImage(file)
      .then((url) => {
        setImages((prev) =>
          prev.map((item) => (item.id === pictureId ? { ...item, uploadedUrl: url, isUploading: false } : item))
        );
      })
      .catch((err) => {
        console.error("Background image upload error:", err);
        setImages((prev) =>
          prev.map((item) => (item.id === pictureId ? { ...item, isUploading: false } : item))
        );
      });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    handleFileSelect(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  function removeImage(index: number) {
    setImages((prev) => {
      const item = prev[index];
      if (item && item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
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
      setStatusMessage("Processing images…");
      const finalImages: { url: string }[] = [];

      for (const item of images) {
        if (item.uploadedUrl) {
          finalImages.push({ url: item.uploadedUrl });
        } else if (item.file) {
          setStatusMessage("Uploading product images…");
          const url = await uploadSingleImage(item.file);
          if (url) finalImages.push({ url });
        } else if (item.previewUrl && !item.previewUrl.startsWith("blob:")) {
          finalImages.push({ url: item.previewUrl });
        }
      }

      setStatusMessage(isEditing ? "Updating product…" : "Saving product…");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        basePrice: parseFloat(form.basePrice) || 0,
        stock: parseInt(form.stock) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        isFeatured: form.isFeatured,
        isActive: productToEdit ? productToEdit.isActive : true,
        images: finalImages,
        customizationOptions: options,
      };

      let res;
      if (isEditing && productToEdit?._id) {
        res = await api.put(`/products/${productToEdit._id}`, payload);
      } else {
        res = await api.post("/products", payload);
      }

      const savedProduct = res.data?.product;
      resetState();
      onSuccess(savedProduct);
      onClose();
    } catch (err) {
      setError(getApiError(err, `Failed to ${isEditing ? "update" : "create"} product. Please verify fields.`));
    } finally {
      setLoading(false);
      setStatusMessage(null);
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
      aria-labelledby="product-modal-title"
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
        style={{ maxWidth: 840 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
          {/* Modal Header without X button */}
          <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center bg-white">
            <div>
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                  style={{ width: 34, height: 34 }}
                >
                  <i className={`bi ${isEditing ? "bi-pencil-square" : "bi-box-seam"} fs-6`} />
                </div>
                <h5 id="product-modal-title" className="fw-bold mb-0 text-dark">
                  {isEditing ? `Edit Product: ${productToEdit?.name || ""}` : "Add New Product"}
                </h5>
              </div>
              <small className="text-muted d-block mt-0.5" style={{ fontSize: "0.78rem" }}>
                {isEditing
                  ? "Update product pricing, inventory levels, media, or customization choices."
                  : "Create a new handcrafted catalog item with pricing, inventory, and customization options."}
              </small>
            </div>
          </div>

          {/* Modal Body: Unboxed Clean Flow (no nested container cards) */}
          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger py-2.5 px-3 small rounded-3 mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle fs-6 text-danger flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form id="productForm" onSubmit={handleSubmit}>
              {/* Section 1: Basic Information */}
              <div>
                <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle text-success" />
                  Product Details &amp; Pricing
                </h6>

                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold text-dark">
                      Product Name <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control rounded-3"
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
                      className="form-select rounded-3"
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
                      className="form-control rounded-3"
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
                    <div className="input-group">
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
                      className="form-control rounded-3"
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
                      className="form-control rounded-3"
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

              {/* Section 2: Product Pictures (Up to 3 images for slide / hover) */}
              <div className="border-top pt-4 mt-4">
                <div className="d-flex align-items-center justify-content-between mb-2.5">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <i className="bi bi-images text-success" />
                    Product Pictures ({images.length}/3)
                  </h6>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    PNG, JPG, WEBP, or GIF (Max 5MB each • Up to 3 pictures)
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

                {/* Picture List when pictures are attached */}
                {images.length > 0 && (
                  <div className="d-flex flex-column gap-2.5 mb-3">
                    {images.map((img, idx) => {
                      const isMain = idx === 0;
                      const isSecond = idx === 1;
                      const slotLabel = isMain
                        ? "Main Picture (Cover)"
                        : isSecond
                        ? "Second Picture (Hover / Slide)"
                        : "Third Picture (Slide)";
                      const slotBadgeBg = isMain
                        ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                        : isSecond
                        ? "bg-info bg-opacity-10 text-info border border-info border-opacity-25"
                        : "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";

                      return (
                        <div
                          key={img.id}
                          className="border rounded-3 p-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-3"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="bg-white border rounded-2 p-1 overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                              style={{ width: 72, height: 72 }}
                            >
                              <img
                                src={img.previewUrl}
                                alt={`Product picture ${idx + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              />
                            </div>
                            <div>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span className={`badge rounded-pill fw-semibold ${slotBadgeBg}`} style={{ fontSize: "0.68rem" }}>
                                  #{idx + 1} • {slotLabel}
                                </span>
                              </div>
                              <div className="fw-semibold text-dark small text-truncate" style={{ maxWidth: 260 }}>
                                {img.file?.name || (isEditing ? "Current Product Image" : `Picture ${idx + 1}`)}
                              </div>
                              <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                                {img.file ? `${(img.file.size / 1024 / 1024).toFixed(2)} MB • ` : ""}
                                {img.isUploading ? (
                                  <span className="text-primary fw-medium">
                                    <span className="spinner-border spinner-border-sm me-1" style={{ width: 11, height: 11 }} />
                                    Uploading in background…
                                  </span>
                                ) : img.uploadedUrl ? (
                                  <span className="text-success fw-semibold">
                                    <i className="bi bi-cloud-check-fill me-1" /> Uploaded to cloud
                                  </span>
                                ) : (
                                  <span className="text-success fw-semibold">
                                    <i className="bi bi-check-circle-fill me-1" /> Existing picture active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                              onClick={() => {
                                replaceIndexRef.current = idx;
                                fileInputRef.current?.click();
                              }}
                              disabled={loading}
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-pill px-3"
                              onClick={() => removeImage(idx)}
                              disabled={loading}
                              title="Remove Picture"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Picture Button or Empty Dropzone */}
                {images.length === 0 ? (
                  <div
                    className={`border border-2 border-dashed rounded-3 p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-success bg-success bg-opacity-10"
                        : "border-secondary border-opacity-25 bg-light bg-opacity-50"
                    }`}
                    style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                    onClick={() => {
                      replaceIndexRef.current = null;
                      fileInputRef.current?.click();
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <i className="bi bi-cloud-arrow-up fs-2 text-success mb-1 d-block" />
                    <div className="fw-semibold text-dark small mb-1">
                      Click to choose pictures or drag &amp; drop here
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                      Upload high quality photographs of the handcrafted item (Up to 3 pictures)
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success mt-2.5 px-3 py-1 rounded-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        replaceIndexRef.current = null;
                        fileInputRef.current?.click();
                      }}
                    >
                      <i className="bi bi-folder2-open me-1" /> Browse Computer / Device
                    </button>
                  </div>
                ) : images.length < 3 ? (
                  <div className="d-flex align-items-center justify-content-between p-3 border border-dashed rounded-3 bg-light bg-opacity-50">
                    <div>
                      <div className="small fw-semibold text-dark">
                        {images.length === 1
                          ? "Add a second picture for hover & slide"
                          : "Add a third picture for the slide gallery"}
                      </div>
                      <small className="text-muted" style={{ fontSize: "0.73rem" }}>
                        You can upload up to 3 pictures for each product ({images.length}/3 attached).
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm"
                      onClick={() => {
                        replaceIndexRef.current = null;
                        fileInputRef.current?.click();
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-plus-lg me-1" />
                      {images.length === 1 ? "Add Second Picture" : "Add Third Picture"}
                    </button>
                  </div>
                ) : (
                  <div className="small text-muted py-1 d-flex align-items-center gap-1.5">
                    <i className="bi bi-check2-circle text-success" />
                    <span>Maximum of 3 product pictures reached.</span>
                  </div>
                )}
              </div>

              {/* Section 3: Customization Options (no card container box) */}
              <div className="border-top pt-4 mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2.5">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <i className="bi bi-palette text-success" />
                    Customization Options
                  </h6>
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
          <div className="modal-footer border-top py-2.5 px-4 bg-white d-flex justify-content-between">
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
              form="productForm"
              className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  {statusMessage || (isEditing ? "Updating Product…" : "Saving Product…")}
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-1.5" />
                  {isEditing ? "Save Changes" : "Save Product"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
