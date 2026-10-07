"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import type { Product, PaginationInfo } from "@/lib/types";
import { useCartStore } from "@/stores/cartStore";
import ProductDetailsModal from "@/components/customer/ProductDetailsModal";
import ProductCard from "@/components/customer/ProductCard";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

function ProductsContent() {
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";
  const categoryParam = searchParams?.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);
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

  // Reset page whenever search or category query changes
  useEffect(() => {
    setPage(1);
  }, [search, categoryParam]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: "15" };
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

  return (
    <div className="container-fluid px-4 py-5">
      <div
        className="rounded-4 p-4 p-md-5"
        style={{
          backgroundColor: "#fcfaf6",
          border: "1px solid #ebdcc5",
        }}
      >
        {/* Product Grid */}
        {loading ? (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-2 g-md-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div className="col" key={i}>
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
            <p className="mb-0">No products found.</p>
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-2 g-md-3">
            {products.map((product) => (
              <div className="col" key={product._id}>
                <ProductCard
                  product={product}
                  onQuickAdd={handleQuickAdd}
                  onViewDetails={(prod) => {
                    setSelectedProduct(prod);
                    setModalOpen(true);
                  }}
                />
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
