import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container-fluid px-4 py-5">
      {/* Hero section */}
      <div className="text-center py-5 rounded mb-5" style={{ backgroundColor: "var(--celsa-cream)", border: "1px solid var(--celsa-border)" }}>
        <i className="bi bi-flower1 fs-1 celsa-logo-mark mb-2 d-block" />
        <h1 className="display-5 fw-bold mb-3">About Celsa Handicrafts</h1>
        <p className="lead text-secondary max-w-2xl mx-auto" style={{ maxWidth: 640 }}>
          Preserving Filipino heritage and sustainable craftsmanship, one handwoven piece at a time.
        </p>
      </div>

      {/* Story section */}
      <div className="row g-5 align-items-center mb-5">
        <div className="col-lg-6">
          <h3 className="fw-bold mb-3">Our Story &amp; Craftsmanship</h3>
          <p className="text-muted">
            Founded in the heart of Pangasinan, Celsa Handicrafts began with a vision to share authentic Filipino 
            artistry with every home. Each item in our collection is handwoven by local artisans using locally 
            sourced natural materials including dried buri palm, abaca fibers, rattan, and native bamboo.
          </p>
          <p className="text-muted">
            Beyond offering ready-to-use home items, we specialize in <strong>customized product orders</strong>, allowing 
            our customers to tailor dimensions, materials, color palettes, and personal engravings to fit their unique 
            lifestyle and aesthetic preferences.
          </p>
          <div className="d-flex gap-3 mt-4">
            <Link href="/products" className="btn btn-success px-4 py-2">
              Browse Collection
            </Link>
            <Link href="/custom-orders" className="btn btn-outline-success px-4 py-2">
              Start Customization
            </Link>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="row g-3">
            <div className="col-6">
              <div className="p-4 border rounded bg-light text-center h-100">
                <i className="bi bi-house-heart fs-1 celsa-logo-mark mb-2 d-block" />
                <h5 className="fw-bold mb-1">Locally Sourced</h5>
                <small className="text-muted">100% natural Philippines fibers &amp; palm leaves</small>
              </div>
            </div>
            <div className="col-6">
              <div className="p-4 border rounded bg-light text-center h-100">
                <i className="bi bi-people fs-1 celsa-logo-mark mb-2 d-block" />
                <h5 className="fw-bold mb-1">Artisan-Made</h5>
                <small className="text-muted">Supporting local weavers &amp; community livelihood</small>
              </div>
            </div>
            <div className="col-6">
              <div className="p-4 border rounded bg-light text-center h-100">
                <i className="bi bi-tree fs-1 celsa-logo-mark mb-2 d-block" />
                <h5 className="fw-bold mb-1">Eco-Friendly</h5>
                <small className="text-muted">Sustainable and zero-waste crafting process</small>
              </div>
            </div>
            <div className="col-6">
              <div className="p-4 border rounded bg-light text-center h-100">
                <i className="bi bi-palette fs-1 celsa-logo-mark mb-2 d-block" />
                <h5 className="fw-bold mb-1">Tailored for You</h5>
                <small className="text-muted">Personalized customization options available</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values banner */}
      <div className="border rounded p-4 p-md-5 mb-5 bg-white text-center">
        <h4 className="fw-bold mb-4">Our Core Values</h4>
        <div className="row g-4">
          <div className="col-md-4">
            <i className="bi bi-award fs-2 text-success mb-2 d-block" />
            <h6 className="fw-bold">Uncompromised Quality</h6>
            <p className="text-muted small">
              Every basket, bag, and tray undergoes thorough quality checking to ensure longevity and durable beauty.
            </p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-heart fs-2 text-danger mb-2 d-block" />
            <h6 className="fw-bold">Community Empowerment</h6>
            <p className="text-muted small">
              We provide fair employment and sustainable income to rural Filipino weaving families.
            </p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-shield-check fs-2 text-primary mb-2 d-block" />
            <h6 className="fw-bold">Customer Satisfaction</h6>
            <p className="text-muted small">
              Clear communication, transparent payment options (Stripe, PayPal, GCash, COD), and tracking from craft to delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
