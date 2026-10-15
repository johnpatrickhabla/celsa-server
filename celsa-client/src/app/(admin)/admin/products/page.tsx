"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import CreateProductModal from "@/components/admin/CreateProductModal";
import CreateCategoryModal from "@/components/admin/CreateCategoryModal";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Product, PaginationInfo, Category } from "@/lib/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await api.get("/products/admin/all", {
        params: { page, limit: 15, search },
      });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  // Open create modal if URL includes ?new=true
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("new=true")) {
      setProductToEdit(null);
      setIsModalOpen(true);
      window.history.replaceState({}, "", "/admin/products");
    }
  }, []);

  function handleOpenCreateModal() {
    setProductToEdit(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(product: Product) {
    setProductToEdit(product);
    setIsModalOpen(true);
  }

  function handleProductSaved(savedProduct?: Product) {
    const wasEditing = Boolean(productToEdit);
    setSuccessMessage(
      savedProduct?.name
        ? `Product "${savedProduct.name}" ${wasEditing ? "updated" : "created"} successfully!`
        : `Product ${wasEditing ? "updated" : "created"} successfully!`
    );
    setProductToEdit(null);
    fetchProducts();
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  function handleCategoryCreated(newCategory?: Category) {
    setSuccessMessage(
      newCategory?.name
        ? `Category "${newCategory.name}" created successfully!`
        : "Category created successfully!"
    );
    fetchProducts();
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  function handleCategoryRemoved(removedCategory?: Category) {
    setSuccessMessage(
      removedCategory?.name
        ? `Category "${removedCategory.name}" removed successfully.`
        : "Category removed successfully."
    );
    fetchProducts();
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  async function toggleActive(product: Product) {
    try {
      await api.put(`/products/${product._id}`, {
        isActive: !product.isActive,
      });
      fetchProducts();
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  }

  async function handleDelete(product: Product) {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone and will remove all product data and images.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      setSuccessMessage(`Product "${product.name}" permanently deleted.`);
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  }

  return (
    <>
      <DashboardTopbar title="Product Management" roleLabel="Admin" />
      <div className="p-4">
        {successMessage && (
          <div className="alert alert-success py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center justify-content-between shadow-sm">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill fs-6 text-success flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-close-sm"
              aria-label="Close"
              onClick={() => setSuccessMessage(null)}
            />
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="input-group" style={{ maxWidth: 320 }}>
            <input
              className="form-control form-control-sm"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <button className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-search" />
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-success rounded-pill px-3 shadow-sm fw-semibold"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <i className="bi bi-plus-lg me-1" /> Add New Category
            </button>

            <button
              type="button"
              className="btn btn-sm btn-success rounded-pill px-3 shadow-sm fw-semibold"
              onClick={handleOpenCreateModal}
            >
              <i className="bi bi-plus-lg me-1" /> Add New Product
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton variant="table" />
        ) : products.length === 0 ? (
          <div className="celsa-stat-card bg-white p-5 text-center text-muted">
            <i className="bi bi-box-seam fs-1 d-block mb-2" />
            <p>No products found in catalog.</p>
            <button
              type="button"
              className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm"
              onClick={handleOpenCreateModal}
            >
              <i className="bi bi-plus-lg me-1" /> Create First Product
            </button>
          </div>
        ) : (
          <div className="celsa-stat-card bg-white p-3">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Base Price</th>
                    <th>Stock</th>
                    <th>Customizable</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {products.map((p) => {
                  const catName = typeof p.category === "object" ? p.category.name : "Uncategorized";
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="bg-light rounded d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                            style={{ width: 44, height: 44 }}
                          >
                            {p.images?.[0]?.url ? (
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                style={{ objectFit: "cover", width: "100%", height: "100%" }}
                              />
                            ) : (
                              <i className="bi bi-image text-muted" />
                            )}
                          </div>
                          <div>
                            <div className="fw-semibold small">{p.name}</div>
                            {p.isFeatured && (
                              <span className="badge bg-warning text-dark" style={{ fontSize: "0.6rem" }}>
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="small">{catName}</td>
                      <td className="fw-bold text-success small">₱{p.basePrice.toFixed(2)}</td>
                      <td className="small">
                        <span className={p.stock <= p.lowStockThreshold ? "text-warning fw-bold" : ""}>
                          {p.stock}
                        </span>
                      </td>
                      <td>
                        {p.isCustomizable ? (
                          <span className="badge bg-info text-dark" style={{ fontSize: "0.65rem" }}>
                            Yes ({p.customizationOptions?.length || 0} opts)
                          </span>
                        ) : (
                          <span className="text-muted small">Standard</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm rounded-pill fw-semibold ${
                            p.isActive ? "btn-success text-white" : "btn-secondary text-white"
                          }`}
                          style={{ fontSize: "0.72rem", padding: "0.2rem 0.65rem" }}
                          onClick={() => toggleActive(p)}
                          title="Click to toggle visibility on storefront"
                        >
                          <i className={`bi ${p.isActive ? "bi-check-circle-fill" : "bi-eye-slash"} me-1`} />
                          {p.isActive ? "Live" : "Hidden"}
                        </button>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border"
                            title="Edit Product"
                            onClick={() => handleOpenEditModal(p)}
                            aria-label={`Edit ${p.name}`}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border text-danger"
                            title="Delete Product"
                            onClick={() => handleDelete(p)}
                            aria-label={`Delete ${p.name}`}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {pagination && pagination.pages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)}>
                      ‹
                    </button>
                  </li>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setPage(p)}>
                        {p}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${page >= pagination.pages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(page + 1)}>
                      ›
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
        onSuccess={handleProductSaved}
        productToEdit={productToEdit}
      />

      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
        onCategoryRemoved={handleCategoryRemoved}
      />
    </>
  );
}
