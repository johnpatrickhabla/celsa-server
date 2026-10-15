"use client";

import { useEffect, useState } from "react";
import api, { getApiError } from "@/lib/api";
import type { Category } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdCategory?: Category) => void;
  onCategoryRemoved?: (removedCategory?: Category) => void;
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  onCategoryRemoved,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Existing categories for quick reference & removal
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setError(null);
    setNotice(null);
    loadExistingCategories();
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading && !deletingId) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, deletingId, onClose]);

  async function loadExistingCategories() {
    setLoadingList(true);
    try {
      const res = await api.get("/categories");
      setExistingCategories(res.data?.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await api.post("/categories", {
        name: name.trim(),
        description: description.trim(),
      });
      const savedCat: Category = res.data?.category;
      setName("");
      setDescription("");
      onSuccess(savedCat);
      onClose();
    } catch (err) {
      setError(getApiError(err, "Failed to create category. Please verify input."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    if (!window.confirm(`Are you sure you want to remove the category "${category.name}"?`)) {
      return;
    }

    setDeletingId(category._id);
    setError(null);
    setNotice(null);

    try {
      await api.delete(`/categories/${category._id}`);
      setExistingCategories((prev) => prev.filter((c) => c._id !== category._id));
      setNotice(`Category "${category.name}" was removed successfully.`);
      if (onCategoryRemoved) {
        onCategoryRemoved(category);
      }
    } catch (err) {
      setError(getApiError(err, `Failed to remove category "${category.name}".`));
    } finally {
      setDeletingId(null);
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
      onClick={() => {
        if (!loading && !deletingId) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-category-modal-title"
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-md"
        style={{ maxWidth: 580 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
          {/* Modal Header without X button */}
          <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center bg-white">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                style={{ width: 34, height: 34 }}
              >
                <i className="bi bi-tag fs-6" />
              </div>
              <div>
                <h5 id="create-category-modal-title" className="fw-bold mb-0 text-dark">
                  Categories Management
                </h5>
                <small className="text-muted" style={{ fontSize: "0.78rem" }}>
                  Create new product groups or remove unused categories from your catalog.
                </small>
              </div>
            </div>
          </div>

          {/* Modal Body without nested container card boxes */}
          <div className="modal-body p-4 bg-white">
            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center justify-content-between">
                <span>{error}</span>
                <button
                  type="button"
                  className="btn-close btn-close-sm"
                  aria-label="Close"
                  onClick={() => setError(null)}
                />
              </div>
            )}

            {notice && (
              <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center justify-content-between">
                <span>
                  <i className="bi bi-check-circle me-1.5" />
                  {notice}
                </span>
                <button
                  type="button"
                  className="btn-close btn-close-sm"
                  aria-label="Close"
                  onClick={() => setNotice(null)}
                />
              </div>
            )}

            <form id="categoryForm" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  Category Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="e.g. Bamboo Handbags, Woven Hats, Tableware"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  Description
                </label>
                <textarea
                  className="form-control rounded-3"
                  rows={2}
                  placeholder="Optional brief description of handicraft items in this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Existing Categories Reference & Removal */}
              <div className="border-top pt-3 mt-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-muted fw-semibold" style={{ fontSize: "0.75rem" }}>
                    EXISTING CATEGORIES ({existingCategories.length})
                  </span>
                  <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Click <i className="bi bi-trash3 text-danger" /> to remove an unused category
                  </small>
                </div>

                {loadingList ? (
                  <div className="small text-muted py-2">
                    <span className="spinner-border spinner-border-sm me-1.5" /> Loading categories…
                  </div>
                ) : existingCategories.length === 0 ? (
                  <div className="small text-muted py-1">No existing categories found.</div>
                ) : (
                  <div className="d-flex flex-column gap-1.5" style={{ maxHeight: 180, overflowY: "auto" }}>
                    {existingCategories.map((c) => (
                      <div
                        key={c._id}
                        className="d-flex align-items-center justify-content-between px-3 py-2 rounded-3 bg-light border"
                      >
                        <div className="d-flex align-items-center gap-2 text-truncate me-2">
                          <i className="bi bi-tag-fill text-success opacity-75" />
                          <span className="small fw-semibold text-dark text-truncate">{c.name}</span>
                          {c.description && (
                            <span
                              className="small text-muted text-truncate d-none d-sm-inline"
                              style={{ fontSize: "0.75rem" }}
                            >
                              — {c.description}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 p-1 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 28, height: 28 }}
                          title={`Remove category "${c.name}"`}
                          disabled={deletingId === c._id || loading}
                          onClick={() => handleDeleteCategory(c)}
                        >
                          {deletingId === c._id ? (
                            <span
                              className="spinner-border spinner-border-sm"
                              style={{ width: 12, height: 12 }}
                            />
                          ) : (
                            <i className="bi bi-trash3" style={{ fontSize: "0.82rem" }} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-top py-2.5 px-4 bg-white d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-light border rounded-pill px-4 fw-semibold"
              onClick={onClose}
              disabled={loading || Boolean(deletingId)}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="categoryForm"
              className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
              disabled={loading || Boolean(deletingId)}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving…
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-1.5" />
                  Save Category
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
