import Link from "next/link";

export default function CustomerFooter() {
  return (
    <footer className="mt-5" style={{ backgroundColor: "var(--celsa-green-dark)", color: "#e9efe9" }}>
      <div className="container-fluid px-4 py-5">
        <div className="row g-4">
          {/* Brand Info */}
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <div className="fw-bold text-white fs-4 lh-1" style={{ letterSpacing: "1px" }}>
                CELSA
              </div>
              <small
                className="text-uppercase fw-semibold d-block mt-1"
                style={{
                  letterSpacing: "3px",
                  fontSize: "0.72rem",
                  color: "#e5be65",
                }}
              >
                Handicrafts
              </small>
            </div>
            <p className="small mb-3" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
              Celsa Handicrafts offers unique and high-quality handcrafted products crafted with passion and tradition.
            </p>
            {/* Social Icons */}
            <div className="d-flex gap-3">
              <a
                href="https://www.facebook.com/share/1Dn7EWtx8w/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none"
                style={{ color: "rgba(255,255,255,0.6)" }}
                aria-label="Facebook"
              >
                <i className="bi bi-facebook fs-5" />
              </a>
              <a href="#" className="text-decoration-none" style={{ color: "rgba(255,255,255,0.6)" }} aria-label="Instagram">
                <i className="bi bi-instagram fs-5" />
              </a>
              <a href="#" className="text-decoration-none" style={{ color: "rgba(255,255,255,0.6)" }} aria-label="Tiktok">
                <i className="bi bi-tiktok fs-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6 col-6">
            <div className="fw-semibold mb-3">Quick Links</div>
            <ul className="list-unstyled small d-flex flex-column gap-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              <li><Link href="/" className="text-decoration-none" style={{ color: "inherit" }}>Home</Link></li>
              <li><Link href="/products" className="text-decoration-none" style={{ color: "inherit" }}>Products</Link></li>
              <li><Link href="/custom-orders" className="text-decoration-none" style={{ color: "inherit" }}>Custom Orders</Link></li>
              <li><Link href="/my-orders" className="text-decoration-none" style={{ color: "inherit" }}>My Orders</Link></li>
              <li><Link href="/about" className="text-decoration-none" style={{ color: "inherit" }}>About Us</Link></li>
              <li><Link href="/contact" className="text-decoration-none" style={{ color: "inherit" }}>Contact Us</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-lg-3 col-md-6 col-6">
            <div className="fw-semibold mb-3">Customer Service</div>
            <ul className="list-unstyled small d-flex flex-column gap-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              <li>FAQs</li>
              <li>Shipping &amp; Delivery</li>
              <li>Returns &amp; Refunds</li>
              <li>Terms &amp; Conditions</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="col-lg-3 col-md-6">
            <div className="fw-semibold mb-3">Contact Us</div>
            <ul className="list-unstyled small d-flex flex-column gap-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-telephone-fill mt-1" style={{ fontSize: "0.75rem" }} />
                <span>+63 912 345 6789</span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-envelope-fill mt-1" style={{ fontSize: "0.75rem" }} />
                <span>celsahandicrafts@gmail.com</span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-geo-alt-fill mt-1" style={{ fontSize: "0.75rem" }} />
                <span>Sitio Comon, Barangay Bangate,<br />Barcelona, Sorsogon City</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <hr style={{ borderColor: "rgba(255,255,255,0.15)" }} />
        <div className="text-center small" style={{ color: "rgba(255,255,255,0.45)" }}>
          &copy; 2026 Celsa Handicrafts. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
