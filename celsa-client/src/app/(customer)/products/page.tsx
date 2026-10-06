"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import type { Product, Category, PaginationInfo } from "@/lib/types";
import { useCartStore } from "@/stores/cartStore";
import ProductDetailsModal from "@/components/customer/ProductDetailsModal";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

function ProductsContent() {
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";
  const categoryParam = searchParams?.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const addItem = useCartStore((s) => s.addItem);

  const handleQuickAdd = useCallback((product: Product) => {
    addItem({
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images.length > 0 ? product.images[0].url : "",
      basePrice: product.basePrice,
      customizations: [],
      quantity: 1,
    });
  }, [addItem]);

  // Fetch categories on mount
  useEffect(() => {
    api.get("/categories")
      .then((res) => {
        if (res.data?.categories) {
          setCategories(res.data.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Reset page whenever search or category query changes
  useEffect(() => {
    setPage(1);
  }, [search, categoryParam]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: "12" };
      if (search) params.search = search;
      if (categoryParam) params.category = categoryParam;

      const res = await api.get("/products", { params });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const activeCategory = categories.find(
    (c) => c._id === categoryParam || c.slug === categoryParam
  );

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
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <span style={{ color: "#198754" }}>Products</span>
            </h4>
            <p className="text-muted small mb-0">
              Browse our handcrafted collection
              {pagination && ` — ${pagination.total} product${pagination.total === 1 ? "" : "s"}`}
            </p>
          </div>

          {/* Active Filters Indicators */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {activeCategory && (
              <div className="d-flex align-items-center gap-1 bg-white border border-success border-opacity-50 rounded-pill px-2.5 py-1 shadow-sm">
                <i className="bi bi-tag text-success" style={{ fontSize: "0.8rem" }} />
                <span className="small fw-semibold text-success" style={{ fontSize: "0.78rem" }}>
                  {activeCategory.name}
                </span>
                <Link
                  href={search ? `/products?search=${encodeURIComponent(search)}` : "/products"}
                  className="text-muted text-decoration-none ms-1 d-flex align-items-center"
                  title="Remove category filter"
                  style={{ fontSize: "0.75rem" }}
                >
                  <i className="bi bi-x-circle-fill text-secondary opacity-75" />
                </Link>
              </div>
            )}

            {search && (
              <div className="d-flex align-items-center gap-1 bg-white border rounded-pill px-2.5 py-1 shadow-sm">
                <i className="bi bi-search text-muted" style={{ fontSize: "0.75rem" }} />
                <span className="small text-dark" style={{ fontSize: "0.78rem" }}>
                  &ldquo;{search}&rdquo;
                </span>
                <Link
                  href={categoryParam ? `/products?category=${encodeURIComponent(categoryParam)}` : "/products"}
                  className="text-muted text-decoration-none ms-1 d-flex align-items-center"
                  title="Clear search"
                  style={{ fontSize: "0.75rem" }}
                >
                  <i className="bi bi-x-circle-fill text-secondary opacity-75" />
                </Link>
              </div>
            )}

            {(activeCategory || search) && (
              <Link
                href="/products"
                className="btn btn-sm btn-link text-muted py-0 px-1 text-decoration-none"
                style={{ fontSize: "0.75rem" }}
              >
                Clear all
              </Link>
            )}
          </div>
        </div>

        {/* Product Grid (Default unified grid layout) */}
        {loading ? (
          <div className="row g-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="col-6 col-md-4 col-lg-3" key={i}>
                <div className="border rounded p-3 h-100 bg-white shadow-sm">
                  <div className="celsa-skeleton" style={{ height: 180, borderRadius: "0.4rem", marginBottom: "0.5rem" }} />
                  <div className="celsa-skeleton celsa-skeleton-line" style={{ width: "70%" }} />
                  <div className="celsa-skeleton celsa-skeleton-line" style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-box-seam fs-1 d-block mb-2" />
            <p className="mb-2">No products found.</p>
            {(activeCategory || search) && (
              <Link href="/products" className="btn btn-sm btn-success">
                View all products
              </Link>
            )}
          </div>
        ) : (
          <div className="row g-3">
            {products.map((product) => (
              <div className="col-6 col-md-4 col-lg-3" key={product._id}>
                <div className="product-card border rounded p-3 h-100 d-flex flex-column justify-content-between bg-white shadow-sm">
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-decoration-none text-dark"
                  >
                    <div
                      className="product-image bg-light rounded mb-2 d-flex align-items-center justify-content-center overflow-hidden p-2"
                      style={{ height: 180 }}
                    >
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="d-block w-100 h-100"
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <i className="bi bi-image text-muted fs-1" />
                      )}
                    </div>
                    <div className="product-content">
                      {/* Category tag removed from flashcards */}
                      <h3
                        className="product-title fw-bold text-dark fs-6 mb-2 text-truncate"
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                      <div className="product-price mb-2 d-flex align-items-center justify-content-between">
                        <span className="price text-success fw-bold fs-6">
                          ₱{product.basePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div>
                    {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                      <div className="text-warning small mb-2" style={{ fontSize: "0.7rem" }}>
                        Only {product.stock} left
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="text-danger small mb-2" style={{ fontSize: "0.7rem" }}>
                        Out of stock
                      </div>
                    )}
                    <div className="product-actions d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm flex-grow-1 small"
                        onClick={() => handleQuickAdd(product)}
                        disabled={product.stock === 0}
                      >
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm flex-grow-1 small text-center d-flex align-items-center justify-content-center"
                        onClick={() => {
                          setSelectedProduct(product);
                          setModalOpen(true);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <nav className="mt-4 d-flex justify-content-center">
            <ul className="pagination pagination-sm">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(page - 1)}>
                  ‹
                </button>
              </li>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (p) => (
                  <li
                    key={p}
                    className={`page-item ${p === page ? "active" : ""}`}
                  >
                    <button className="page-link" onClick={() => setPage(p)}>
                      {p}
                    </button>
                  </li>
                )
              )}
              <li
                className={`page-item ${
                  page >= (pagination?.pages || 1) ? "disabled" : ""
                }`}
              >
                <button className="page-link" onClick={() => setPage(page + 1)}>
                  ›
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="productGrid" />}>
      <ProductsContent />
    </Suspense>
  );
}
