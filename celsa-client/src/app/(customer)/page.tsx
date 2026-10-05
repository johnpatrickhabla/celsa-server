"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { useCartStore } from "@/stores/cartStore";
import type { Product, HeroSlide } from "@/lib/types";
import { Carousel } from "react-bootstrap";
import ProductDetailsModal from "@/components/customer/ProductDetailsModal";

const whyChooseUsTop = [
  { icon: "bi-hand-thumbs-up", title: "100% Handmade", subtitle: "By skilled artisans" },
  { icon: "bi-award", title: "Quality Materials", subtitle: "Sourced locally" },
  { icon: "bi-scissors", title: "Customizable", subtitle: "Made according to your preference" },
  { icon: "bi-truck", title: "Secure Delivery", subtitle: "Safe and reliable shipping" },
];

const defaultSlides: HeroSlide[] = [
  {
    _id: "default-1",
    type: "image",
    mediaUrl: "/images/hero-basket.png",
    title: "Handcrafted Buri Basket",
    subtitle: "Woven by master artisans",
    order: 1,
    isActive: true,
  },
  {
    _id: "default-2",
    type: "image",
    mediaUrl: "/images/hero-bag.png",
    title: "Native Abaca Handbag",
    subtitle: "Eco-friendly, durable, and stylish",
    order: 2,
    isActive: true,
  },
  {
    _id: "default-3",
    type: "image",
    mediaUrl: "/images/hero-tray.png",
    title: "Decorative Handicraft Tray",
    subtitle: "Perfect centerpiece for your home",
    order: 3,
    isActive: true,
  },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<HeroSlide[]>(defaultSlides);
  const addItem = useCartStore((s) => s.addItem);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await api.get("/products", {
          params: { featured: "true", limit: "4" },
        });
        setFeatured(res.data.products);
      } catch (err) {
        console.error("Failed to fetch featured products:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchHeroSlides() {
      try {
        const res = await api.get("/hero-slides");
        if (res.data?.slides && res.data.slides.length > 0) {
          setSlides(res.data.slides);
        }
      } catch (err) {
        console.error("Failed to fetch hero slides:", err);
      }
    }

    fetchFeatured();
    fetchHeroSlides();
  }, []);

  function handleQuickAdd(product: Product) {
    addItem({
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images.length > 0 ? product.images[0].url : "",
      basePrice: product.basePrice,
      customizations: [],
      quantity: 1,
    });
  }

  return (
    <>
      {/* Hero */}
      <section
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255, 255, 255, 0.75)",
          }}
        />
        <div className="container-fluid px-4 py-5" style={{ position: "relative", zIndex: 1 }}>
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-3 text-dark">Handcrafted with Love,<br />Made for You.</h1>
              <p className="text-muted fs-5 mb-4">
                Explore our unique handmade products and request your own custom design.
              </p>
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <Link href="/products" className="btn btn-success btn-lg px-4 py-2 shadow-sm">
                  Shop Now
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="shadow rounded-4 overflow-hidden position-relative bg-dark" style={{ height: "380px" }}>
                <Carousel controls={slides.length > 1} indicators={slides.length > 1} interval={5000} pause="hover">
                  {slides.map((slide, idx) => (
                    <Carousel.Item key={slide._id || idx}>
                      {slide.type === "video" ? (
                        <div
                          style={{
                            height: "380px",
                            width: "100%",
                            position: "relative",
                            overflow: "hidden",
                            backgroundColor: "#0b0f0c",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {/* Ambient blurred backdrop for portrait / vertical videos */}
                          <video
                            src={slide.mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            aria-hidden="true"
                            style={{
                              position: "absolute",
                              inset: "-20px",
                              width: "calc(100% + 40px)",
                              height: "calc(100% + 40px)",
                              objectFit: "cover",
                              filter: "blur(24px) brightness(0.55)",
                              transform: "scale(1.15)",
                              pointerEvents: "none",
                              zIndex: 0,
                            }}
                          />
                          {/* Crisp uncropped unstretched foreground video */}
                          <video
                            src={slide.mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{
                              position: "relative",
                              zIndex: 1,
                              height: "100%",
                              width: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      ) : (
                        <img
                          src={slide.mediaUrl}
                          className="d-block w-100"
                          alt="Handcrafted item"
                          style={{ height: "380px", objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/hero-basket.png";
                          }}
                        />
                      )}
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container-fluid px-4 py-4">
        <div
          className="rounded-4 p-4 p-md-5"
          style={{
            backgroundColor: "#fcfaf6",
            border: "1px solid #ebdcc5",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold text-dark mb-1">
                Featured <span style={{ color: "#198754" }}>Products</span>
              </h4>
              <p className="text-muted small mb-0">Explore our most popular handcrafted items</p>
            </div>
            <Link
              href="/products"
              className="btn btn-outline-success btn-sm rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
            >
              <span>View All</span>
              <i className="bi bi-arrow-right" />
            </Link>
          </div>
          <div className="row g-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                <div className="col-6 col-md-3" key={i}>
                  <div className="border rounded p-3 h-100 bg-white shadow-sm">
                    <div className="celsa-skeleton" style={{ height: 140, borderRadius: "0.4rem", marginBottom: "0.5rem" }} />
                    <div className="celsa-skeleton celsa-skeleton-line" style={{ width: "70%" }} />
                    <div className="celsa-skeleton celsa-skeleton-line" style={{ width: "40%" }} />
                  </div>
                </div>
              ))
              : featured.map((p) => (
                <div className="col-6 col-md-3" key={p._id}>
                  <div className="product-card border rounded p-3 h-100 d-flex flex-column justify-content-between bg-white shadow-sm">
                    <div>
                      <div className="product-image bg-light rounded mb-2 d-flex align-items-center justify-content-center overflow-hidden p-2" style={{ height: 180 }}>
                        {p.images.length > 0 ? (
                          <img
                            src={p.images[0].url}
                            alt={p.name}
                            className="d-block w-100 h-100"
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          <i className="bi bi-image text-muted fs-1" />
                        )}
                      </div>
                      <div className="product-content">
                        <h3 className="product-title fw-bold text-dark fs-6 mb-2 text-truncate" title={p.name}>{p.name}</h3>
                        <div className="product-price mb-3">
                          <span className="price text-success fw-bold fs-6">₱{p.basePrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="product-actions d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm flex-grow-1 small"
                        onClick={() => handleQuickAdd(p)}
                      >
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm flex-grow-1 small"
                        onClick={() => {
                          setSelectedProduct(p);
                          setModalOpen(true);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Promo cards */}
      <section className="container-fluid px-4 pb-5">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="rounded p-4 d-flex justify-content-between align-items-center h-100 shadow-sm" style={{ backgroundColor: "var(--celsa-cream)" }}>
              <div className="pe-3" style={{ flex: 1 }}>
                <h6 className="fw-bold mb-2">Custom Orders</h6>
                <p className="small text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                  Have a specific design in mind? We create personalized handicrafts just for you. Choose your own colors, materials, and sizes.
                </p>
                <Link href="/custom-orders" className="btn btn-success btn-sm px-3 rounded-3 fw-semibold">
                  Create Custom Order
                </Link>
              </div>
              <div className="d-none d-sm-block rounded overflow-hidden shadow-sm" style={{ width: 120, height: 120, flexShrink: 0 }}>
                <img
                  src="/images/customization-promo.jpg"
                  alt="Custom Handicrafts Design"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="rounded p-4 d-flex justify-content-between align-items-center h-100 shadow-sm" style={{ backgroundColor: "var(--celsa-cream)" }}>
              <div className="pe-3" style={{ flex: 1 }}>
                <h6 className="fw-bold mb-2">Track Your Order</h6>
                <p className="small text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                  Stay updated with your order status. Know exactly when your handcrafted items will arrive.
                </p>
                <Link href="/my-orders" className="btn btn-success btn-sm px-3 rounded-3 fw-semibold">
                  Track Order
                </Link>
              </div>
              <div className="d-none d-sm-block rounded overflow-hidden shadow-sm" style={{ width: 120, height: 120, flexShrink: 0 }}>
                <img
                  src="/images/tracking-promo.jpg"
                  alt="Order Tracking & Delivery"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="container-fluid px-4 pb-5">
        <div
          className="rounded-4 p-4 p-md-5"
          style={{
            backgroundColor: "#fcfaf6",
            border: "1px solid #ebdcc5",
          }}
        >
          <div className="text-center mb-4">
            <h4 className="fw-bold text-dark mb-1">
              Why Choose <span style={{ color: "#198754" }}>Celsa Handicrafts</span>?
            </h4>
            <p className="text-muted small mb-0">Crafted with passion, dedication, and cultural heritage</p>
          </div>

          <div className="row g-3 text-center">
            {whyChooseUsTop.map((item) => (
              <div className="col-6 col-md-3" key={item.title}>
                <div className="why-choose-card p-4 h-100 d-flex flex-column align-items-center justify-content-center shadow-sm bg-white">
                  <div className="icon-wrapper mb-3">
                    <i className={`bi ${item.icon} fs-3`} />
                  </div>
                  <div className="fw-bold small why-choose-title">{item.title}</div>
                  <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <ProductDetailsModal
        product={selectedProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
