"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import api from "@/lib/api";
import type { Category } from "@/lib/types";

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

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
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

  useEffect(() => {
    async function loadCats() {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.categories || []);
        if (res.data.categories?.length > 0) {
          setForm((prev) => ({ ...prev, category: res.data.categories[0]._id }));
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCats();
  }, []);

  function handleFileSelect(file: File | undefined) {
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, JPEG, WEBP, or GIF).");
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB. Please choose a smaller picture.");
      return;
    }

    setError(null);
    setImageFile(file);

    // Create local preview URL
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

      // Upload image attachment from device if selected
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
        name: form.name,
        description: form.description,
        category: form.category,
        basePrice: parseFloat(form.basePrice) || 0,
        stock: parseInt(form.stock) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        isFeatured: form.isFeatured,
        images: finalImageUrl ? [{ url: finalImageUrl }] : [],
        customizationOptions: options,
      };

      await api.post("/products", payload);
      router.push("/admin/products");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { error: string } } }).response?.data?.error
          : "Failed to create product.";
      setError(msg || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DashboardTopbar title="Add New Product" roleLabel="Admin" />
      <div className="p-4" style={{ maxWidth: 880 }}>
        <Link href="/admin/products" className="btn btn-sm btn-outline-secondary mb-3">
          ← Back to Products
        </Link>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="celsa-stat-card bg-white p-4 mb-4">
            <h6 className="fw-bold mb-3">Basic Information</h6>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label small">Product Name *</label>
                <input
                  className="form-control form-control-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small">Category *</label>
                <select
                  className="form-select form-select-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small">Description</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small">Base Price (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small">Initial Stock *</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-dark d-flex align-items-center justify-content-between">
                  <span>Product Picture Attachment</span>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    Image files only (PNG, JPG, WEBP, GIF up to 5MB)
                  </span>
                </label>

                {/* Hidden File Input for Device/Desktop Picture Picker */}
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
                    <i className="bi bi-cloud-arrow-up fs-1 text-success mb-2 d-block" />
                    <div className="fw-bold text-dark small mb-1">
                      Click to choose picture from your device or drag &amp; drop here
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Supports PNG, JPG, JPEG, WEBP, or GIF (Max 5MB)
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success mt-3 px-3 py-1 rounded-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <i className="bi bi-folder2-open me-1" /> Browse Desktop / Device
                    </button>
                  </div>
                ) : (
                  <div className="border rounded-3 p-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="bg-white border rounded-2 p-1 overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                        style={{ width: 80, height: 80 }}
                      >
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                      <div>
                        <div className="fw-semibold text-dark small text-truncate" style={{ maxWidth: 300 }}>
                          {imageFile?.name || "Attached Picture"}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : "Ready"} •{" "}
                          <span className="text-success fw-semibold">
                            <i className="bi bi-check-circle-fill me-1" /> Attached
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Picture
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={removeImage}
                        title="Remove Picture"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="featCheck"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  <label className="form-check-label small" htmlFor="featCheck">
                    Feature on Homepage
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Customization Options Builder */}
          <div className="celsa-stat-card bg-white p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Customization Options Builder</h6>
              <button type="button" className="btn btn-sm btn-outline-success" onClick={addOption}>
                <i className="bi bi-plus-lg me-1" /> Add Customization Option
              </button>
            </div>

            {options.length === 0 ? (
              <div className="text-muted small border rounded p-3 text-center">
                No customization options added yet. Click &quot;Add Customization Option&quot; if this item has variable materials, sizes, colors, or add-ons.
              </div>
            ) : (
              options.map((opt, optIdx) => (
                <div key={optIdx} className="border rounded p-3 mb-3 bg-light">
                  <div className="row g-2 mb-2 align-items-center">
                    <div className="col-md-4">
                      <label className="form-label small mb-1">Option Type</label>
                      <select
                        className="form-select form-select-sm"
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
                      <label className="form-label small mb-1">Display Label</label>
                      <input
                        className="form-control form-control-sm"
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
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeOption(optIdx)}
                      >
                        <i className="bi bi-trash" /> Remove Option
                      </button>
                    </div>
                  </div>

                  {/* Choice items */}
                  <div className="ms-3 border-start ps-3 pt-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-semibold">Choices &amp; Price Modifiers:</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-success p-0"
                        onClick={() => addChoice(optIdx)}
                      >
                        + Add Choice
                      </button>
                    </div>

                    {opt.choices.map((choice, cIdx) => (
                      <div key={cIdx} className="d-flex gap-2 mb-2 align-items-center">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Choice name (e.g. Red / Large)"
                          value={choice.value}
                          onChange={(e) => {
                            const updated = [...options];
                            updated[optIdx].choices[cIdx].value = e.target.value;
                            setOptions(updated);
                          }}
                        />
                        <div className="input-group input-group-sm" style={{ maxWidth: 160 }}>
                          <span className="input-group-text">+₱</span>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            value={choice.priceModifier}
                            onChange={(e) => {
                              const updated = [...options];
                              updated[optIdx].choices[cIdx].priceModifier = parseFloat(e.target.value) || 0;
                              setOptions(updated);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={() => removeChoice(optIdx, cIdx)}
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

          <div className="d-flex justify-content-end gap-2">
            <Link href="/admin/products" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
