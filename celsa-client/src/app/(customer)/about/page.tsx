import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container-fluid px-4 py-5">
      <div
        className="rounded-4 p-4 p-md-5"
        style={{
          backgroundColor: "#fcfaf6",
          border: "1px solid #ebdcc5",
        }}
      >
        {/* Hero section */}
        <div className="text-center mb-5 pb-2">
          <h1 className="display-5 fw-bold mb-3 text-dark">About Celsa Handicrafts</h1>
          <p className="lead text-secondary mx-auto" style={{ maxWidth: 640 }}>
            Preserving Filipino heritage and sustainable craftsmanship, one handwoven piece at a time.
          </p>
        </div>

        {/* Story section */}
        <div className="row g-5 align-items-center mb-5">
          <div className="col-lg-6">
            <div className="p-4 p-md-5 border rounded-4 bg-white shadow-sm h-100 d-flex flex-column justify-content-between">
              <div>
                <h3 className="fw-bold mb-3 text-dark">Our Story &amp; Craftsmanship</h3>
                <p className="text-muted mb-3">
                  Founded in 2024 by Celsa L. Gabrentina, Celsa Handicrafts is a local handicraft business located in Sitio Comon, Barangay Bangate, Barcelona, Sorsogon. We create and sell handcrafted products made from natural and locally available materials such as buri, bariw, karagumoy, bandala, and other similar materials.
                </p>
                <p className="text-muted mb-3">
                  Each handcrafted product is carefully made according to its intended design and purpose. We also welcome customized orders, allowing customers to share their preferred designs, specifications, quantities, and other requirements to create products that suit their individual needs and preferences.
                </p>
                <p className="text-muted mb-3">
                  Our products are created through a hands-on production process, with selected workers contributing to the crafting of orders from their homes when additional assistance is needed. Once completed, the finished products are collected and stored at our residence before being prepared for delivery or shipment.
                </p>
                <p className="text-muted mb-4">
                  At Celsa Handicrafts, we value the use of locally available materials and the hands-on craftsmanship that goes into every product. Through our handcrafted and customized creations, we aim to provide products that are made with care and shaped according to the needs and preferences of our customers.
                </p>
              </div>
              <div className="d-flex gap-3 mt-3 flex-wrap">
                <Link href="/products" className="btn btn-success px-4 py-2 rounded-3 shadow-sm">
                  Browse Collection
                </Link>
                <Link href="/custom-orders" className="btn btn-outline-success px-4 py-2 rounded-3">
                  Start Customization
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="row g-3 h-100">
              <div className="col-6">
                <div className="why-choose-card p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                  <div className="icon-wrapper mb-3">
                    <i className="bi bi-house-heart fs-3" />
                  </div>
                  <div className="fw-bold small why-choose-title">Locally Sourced</div>
                  <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                    100% natural Philippines fibers &amp; palm leaves
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="why-choose-card p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                  <div className="icon-wrapper mb-3">
                    <i className="bi bi-people fs-3" />
                  </div>
                  <div className="fw-bold small why-choose-title">Artisan-Made</div>
                  <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                    Supporting local weavers &amp; community livelihood
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="why-choose-card p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                  <div className="icon-wrapper mb-3">
                    <i className="bi bi-tree fs-3" />
                  </div>
                  <div className="fw-bold small why-choose-title">Eco-Friendly</div>
                  <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                    Sustainable and zero-waste crafting process
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="why-choose-card p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                  <div className="icon-wrapper mb-3">
                    <i className="bi bi-palette fs-3" />
                  </div>
                  <div className="fw-bold small why-choose-title">Tailored for You</div>
                  <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                    Personalized customization options available
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values banner */}
        <div className="border rounded-4 p-4 p-md-5 bg-white text-center shadow-sm">
          <h4 className="fw-bold mb-4 text-dark">Our Core Values</h4>
          <div className="row g-4">
            <div className="col-md-4">
              <i className="bi bi-award fs-2 text-success mb-2 d-block" />
              <h6 className="fw-bold text-dark">Uncompromised Quality</h6>
              <p className="text-muted small">
                Every basket, bag, and tray undergoes thorough quality checking to ensure longevity and durable beauty.
              </p>
            </div>
            <div className="col-md-4">
              <i className="bi bi-heart fs-2 text-danger mb-2 d-block" />
              <h6 className="fw-bold text-dark">Community Empowerment</h6>
              <p className="text-muted small">
                We provide fair employment and sustainable income to rural Filipino weaving families.
              </p>
            </div>
            <div className="col-md-4">
              <i className="bi bi-shield-check fs-2 text-primary mb-2 d-block" />
              <h6 className="fw-bold text-dark">Customer Satisfaction</h6>
              <p className="text-muted small">
                Clear communication, transparent payment options (GCash, COD), and tracking from craft to delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
