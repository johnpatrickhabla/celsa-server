"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { Product, Category, PaginationInfo } from "@/lib/types";
import { useCartStore } from "@/stores/cartStore";
import ProductDetailsModal from "@/components/customer/ProductDetailsModal";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: "12" };
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      // TODO: Remove this delay — only for testing loading skeleton
      await new Promise((r) => setTimeout(r, 2000));

      const res = await api.get("/products", { params });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, search, minPrice, maxPrice]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.categories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setSelectedCategory("");
    setSearch("");
    setSearchInput("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  }

  const getCategoryName = (product: Product): string => {
    if (typeof product.category === "object" && product.category !== null) {
      return product.category.name;
    }
    return "";
  };

  return (
    <div className="container-fluid px-3 px-sm-4 py-4 py-md-5">
      <div
        className="rounded-4 p-4 p-md-5"
        style={{
          backgroundColor: "#fcfaf6",
          border: "1px solid #ebdcc5",
        }}
      >
        {/* Combined Header & Filters Container */}
        <div className="mb-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            {/* Left: Title & Subtitle */}
            <div>
              <h4 className="fw-bold mb-1">
                Our <span style={{ color: "#198754" }}>Products</span>
              </h4>
              <p className="text-muted small mb-0">
                Browse our handcrafted collection
                {pagination && ` — ${pagination.total} products`}
              </p>
            </div>

            {/* Right Corner: Filters */}
            <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-lg-auto">
              <form onSubmit={handleSearch} className="input-group input-group-sm flex-grow-1" style={{ minWidth: "160px", maxWidth: "100%" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="submit" aria-label="Search">
                  <i className="bi bi-search" />
                </button>
              </form>

              <select
                className="form-select form-select-sm flex-grow-1"
                style={{ minWidth: "150px" }}
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
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
            <p>No products found. Try adjusting your filters.</p>
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
                    <div className="product-image bg-light rounded mb-2 d-flex align-items-center justify-content-center overflow-hidden p-2" style={{ height: 180 }}>
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
                      <div className="text-muted mb-1" style={{ fontSize: "0.7rem" }}>
                        {getCategoryName(product)}
                      </div>
                      <h3 className="product-title fw-bold text-dark fs-6 mb-2 text-truncate" title={product.name}>{product.name}</h3>
                      <div className="product-price mb-2 d-flex align-items-center justify-content-between">
                        <span className="price text-success fw-bold fs-6">
                          ₱{product.basePrice.toFixed(2)}
                        </span>
                        {product.isCustomizable && (
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: "var(--celsa-cream)",
                              color: "var(--celsa-gold-dark)",
                              fontSize: "0.65rem",
                            }}
                          >
                            Customizable
                          </span>
                        )}
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
                    <div className="product-actions d-flex flex-column flex-sm-row gap-1 gap-sm-2">
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
                className={`page-item ${page >= (pagination?.pages || 1) ? "disabled" : ""
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
