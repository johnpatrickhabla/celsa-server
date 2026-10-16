"use client";

import Link from "next/link";

interface AccessDeniedProps {
  requiredRole?: "admin" | "staff";
  customMessage?: string;
  title?: string;
}

export default function AccessDenied({
  title = "PAGE NOT FOUND",
  customMessage = "Sorry! We couldn't find the page you're looking for. The link may be broken, or the page may have been moved or removed.",
}: AccessDeniedProps) {
  return (
    <div
      className="shein-error-wrapper d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        className="text-center mx-auto"
        style={{
          maxWidth: 580,
          width: "100%",
        }}
      >
        {/* SHEIN-style 404 Illustration / Graphic */}
        <div className="position-relative d-inline-block mb-3">
          <div
            className="shein-404-number text-dark user-select-none"
            style={{
              fontSize: "clamp(5rem, 15vw, 8rem)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              fontFamily: "var(--bs-font-sans-serif, system-ui)",
              color: "#111111",
              fontWeight: 900,
            }}
          >
            4<span style={{ color: "var(--celsa-gold, #b8863b)" }}>0</span>4
          </div>

          <div
            className="position-absolute bottom-0 end-0 translate-middle-y rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: 52,
              height: 52,
              backgroundColor: "#f5f3ee",
              border: "2px solid #ffffff",
              color: "#222222",
            }}
          >
            <i className="bi bi-bag-x fs-4" />
          </div>
        </div>

        {/* Heading in SHEIN bold uppercase style */}
        <h2
          className="fw-bold text-dark text-uppercase mb-2"
          style={{
            fontSize: "clamp(1.2rem, 3.5vw, 1.6rem)",
            letterSpacing: "1.5px",
          }}
        >
          {title}
        </h2>

        {/* Subtitle description */}
        <p
          className="text-muted mx-auto mb-4"
          style={{
            maxWidth: 440,
            fontSize: "0.92rem",
            lineHeight: 1.6,
          }}
        >
          {customMessage}
        </p>

        {/* SHEIN-style Action Buttons */}
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-2.5 mb-4 pb-2">
          <Link
            href="/products"
            className="btn btn-dark fw-bold text-uppercase px-4 py-2.5 rounded-1 shadow-sm d-inline-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: "#111111",
              borderColor: "#111111",
              fontSize: "0.85rem",
              letterSpacing: "1px",
            }}
          >
            <i className="bi bi-bag me-1" />
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="btn btn-outline-dark fw-bold text-uppercase px-4 py-2.5 rounded-1 d-inline-flex align-items-center justify-content-center"
            style={{
              fontSize: "0.85rem",
              letterSpacing: "1px",
              borderWidth: "1.5px",
            }}
          >
            Back to Home
          </Link>
        </div>

        {/* Popular Categories / Trending Tags like SHEIN */}
        <div className="pt-4 border-top" style={{ borderColor: "#eee" }}>
          <div
            className="text-muted text-uppercase fw-semibold mb-2.5"
            style={{ fontSize: "0.72rem", letterSpacing: "1.2px" }}
          >
            Popular Categories
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {[
              { label: "Woven Bags", href: "/products" },
              { label: "Baskets & Planters", href: "/products" },
              { label: "Home Decor", href: "/products" },
              { label: "Tabletop Crafts", href: "/products" },
              { label: "Native Gifts", href: "/products" },
            ].map((cat, i) => (
              <Link
                key={i}
                href={cat.href}
                className="badge bg-light text-dark border text-decoration-none py-2 px-3 fw-medium rounded-pill"
                style={{
                  fontSize: "0.78rem",
                  borderColor: "#e5ded3",
                  transition: "all 0.2s ease",
                }}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
