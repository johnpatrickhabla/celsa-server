"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import type { HeroSlide } from "@/lib/types";

interface Props {
  role: "admin" | "staff";
}

export default function HeroSlidesEditor({ role }: Props) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState({
    type: "image" as "image" | "video",
    mediaUrl: "",
    title: "",
    subtitle: "",
    linkUrl: "/products",
    order: 0,
    isActive: true,
    publicId: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all slides (admin & staff authorized)
  async function fetchSlides() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/hero-slides/all");
      setSlides(res.data.slides || []);
    } catch (err: any) {
      console.error("Failed to load hero slides:", err);
      setError(err?.response?.data?.error || "Failed to load hero slides.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSlides();
  }, []);

  function handleOpenCreate() {
    setEditingSlide(null);
    setFormData({
      type: "image",
      mediaUrl: "",
      title: "",
      subtitle: "",
      linkUrl: "/products",
      order: slides.length + 1,
      isActive: true,
      publicId: "",
    });
    setShowModal(true);
  }

  function handleOpenEdit(slide: HeroSlide) {
    setEditingSlide(slide);
    setFormData({
      type: slide.type || "image",
      mediaUrl: slide.mediaUrl || "",
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      linkUrl: slide.linkUrl || "",
      order: slide.order ?? 0,
      isActive: slide.isActive !== false,
      publicId: slide.publicId || "",
    });
    setShowModal(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect if file is video or image
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setError("Please select a valid image or video file.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const data = new FormData();
      data.append("file", file);
      data.append("folder", isVideo ? "celsa/hero_videos" : "celsa/hero_slides");

      const res = await api.post("/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData((prev) => ({
        ...prev,
        mediaUrl: res.data.url,
        publicId: res.data.publicId || "",
        type: isVideo ? "video" : "image",
      }));
      setSuccess("Media uploaded successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err?.response?.data?.error || "Failed to upload media file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.mediaUrl.trim()) {
      setError("Please provide a media URL or upload an image/video.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingSlide) {
        await api.put(`/hero-slides/${editingSlide._id}`, formData);
        setSuccess("Slide updated successfully!");
      } else {
        await api.post("/hero-slides", formData);
        setSuccess("New slide added successfully!");
      }

      setShowModal(false);
      fetchSlides();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      console.error("Failed to save slide:", err);
      setError(err?.response?.data?.error || "Failed to save slide.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(slide: HeroSlide) {
    try {
      await api.put(`/hero-slides/${slide._id}`, { isActive: !slide.isActive });
      setSlides((prev) =>
        prev.map((s) => (s._id === slide._id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch (err: any) {
      console.error("Failed to toggle status:", err);
      setError("Failed to update slide status.");
    }
  }

  async function handleDelete(id: string) {
    try {
      setError(null);
      await api.delete(`/hero-slides/${id}`);
      setDeleteConfirmId(null);
      setSuccess("Slide removed successfully!");
      setSlides((prev) => prev.filter((s) => s._id !== id));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to delete slide:", err);
      setError(err?.response?.data?.error || "Failed to delete slide.");
    }
  }

  const activeSlides = slides.filter((s) => s.isActive);

  return (
    <div className="p-4">
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-film me-2 text-success" />
            Hero Section Slide &amp; Video Editor
          </h2>
          <p className="text-muted small mb-0">
            Customize the slides and videos displayed on the homepage hero carousel. (Authorized for {role === "admin" ? "Admin" : "Staff"})
          </p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchSlides}
            title="Refresh slides"
          >
            <i className="bi bi-arrow-clockwise" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-success btn-sm px-3 d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenCreate}
          >
            <i className="bi bi-plus-circle" />
            <span>Add Slide / Video</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5" />
          <div className="flex-grow-1">{error}</div>
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill fs-5" />
          <div className="flex-grow-1">{success}</div>
          <button type="button" className="btn-close" onClick={() => setSuccess(null)} />
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <span className="text-muted small">Total Slides</span>
            <h3 className="fw-bold text-dark mb-0">{slides.length}</h3>
          </div>
        </div>
        <div className="col-sm-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <span className="text-muted small">Active on Homepage</span>
            <h3 className="fw-bold text-success mb-0">{activeSlides.length}</h3>
          </div>
        </div>
        <div className="col-sm-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <span className="text-muted small">Videos</span>
            <h3 className="fw-bold text-primary mb-0">{slides.filter((s) => s.type === "video").length}</h3>
          </div>
        </div>
        <div className="col-sm-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <span className="text-muted small">Pictures</span>
            <h3 className="fw-bold text-secondary mb-0">{slides.filter((s) => s.type === "image").length}</h3>
          </div>
        </div>
      </div>

      {/* Slides List Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
        <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
          <span className="fw-bold text-dark">Current Hero Slides</span>
          <span className="badge bg-light text-muted border">
            {slides.length} {slides.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle table-hover mb-0">
            <thead className="table-light small text-uppercase text-muted">
              <tr>
                <th style={{ width: "80px" }}>Order</th>
                <th style={{ width: "160px" }}>Media Preview</th>
                <th>Type</th>
                <th>Title &amp; Subtitle</th>
                <th>Target Link</th>
                <th>Status</th>
                <th className="text-end" style={{ width: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
                    Loading slides...
                  </td>
                </tr>
              ) : slides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <i className="bi bi-images fs-1 d-block text-secondary mb-2" />
                    No hero slides found. Click &quot;Add Slide / Video&quot; above to create one.
                  </td>
                </tr>
              ) : (
                slides.map((slide) => (
                  <tr key={slide._id}>
                    {/* Order */}
                    <td className="fw-semibold text-secondary">
                      <span className="badge bg-light text-dark border px-2 py-1">
                        #{slide.order}
                      </span>
                    </td>

                    {/* Preview Thumbnail */}
                    <td>
                      <div
                        className="rounded-3 overflow-hidden bg-dark position-relative shadow-sm"
                        style={{ width: "130px", height: "76px" }}
                      >
                        {slide.type === "video" ? (
                          <video
                            src={slide.mediaUrl}
                            muted
                            playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <img
                            src={slide.mediaUrl}
                            alt={slide.title || "Slide"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/hero-basket.png";
                            }}
                          />
                        )}
                        {slide.type === "video" && (
                          <span
                            className="position-absolute bottom-0 end-0 m-1 badge bg-dark bg-opacity-75"
                            style={{ fontSize: "0.6rem" }}
                          >
                            <i className="bi bi-play-fill text-white" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td>
                      {slide.type === "video" ? (
                        <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary px-2 py-1">
                          <i className="bi bi-camera-video-fill me-1" />
                          Video
                        </span>
                      ) : (
                        <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success px-2 py-1">
                          <i className="bi bi-image me-1" />
                          Picture
                        </span>
                      )}
                    </td>

                    {/* Title & Subtitle */}
                    <td>
                      <div className="fw-semibold text-dark">
                        {slide.title || <span className="text-muted fst-italic">Untitled</span>}
                      </div>
                      {slide.subtitle && (
                        <div className="small text-muted text-truncate" style={{ maxWidth: 260 }}>
                          {slide.subtitle}
                        </div>
                      )}
                    </td>

                    {/* Target Link */}
                    <td>
                      <code className="text-secondary small">{slide.linkUrl || "/products"}</code>
                    </td>

                    {/* Status Toggle */}
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill fw-semibold ${
                          slide.isActive
                            ? "btn-success bg-opacity-10 text-success border-success"
                            : "btn-secondary bg-opacity-10 text-secondary border-secondary"
                        }`}
                        onClick={() => handleToggleActive(slide)}
                        title="Click to toggle active status"
                      >
                        <i className={`bi ${slide.isActive ? "bi-check-circle" : "bi-dash-circle"} me-1`} />
                        {slide.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleOpenEdit(slide)}
                          title="Edit Slide"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => setDeleteConfirmId(slide._id)}
                          title="Delete Slide"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-body p-4 text-center">
                <i className="bi bi-exclamation-circle text-danger fs-1 mb-2 d-block" />
                <h5 className="fw-bold mb-2">Delete Slide?</h5>
                <p className="text-muted small mb-4">
                  Are you sure you want to remove this slide? This action cannot be undone.
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light px-3"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-3 shadow-sm"
                    onClick={() => handleDelete(deleteConfirmId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Slide Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1055 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-sliders text-success" />
                  {editingSlide ? "Edit Hero Slide" : "Add New Hero Slide"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  disabled={saving || uploading}
                />
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  {/* Media Type Toggle */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-dark small text-uppercase">
                      Media Type
                    </label>
                    <div className="d-flex gap-3">
                      <div
                        className={`card flex-grow-1 p-3 text-center border cursor-pointer rounded-3 ${
                          formData.type === "image"
                            ? "border-success bg-success bg-opacity-10 text-success fw-bold"
                            : "bg-white text-muted"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setFormData((p) => ({ ...p, type: "image" }))}
                      >
                        <i className="bi bi-image fs-4 d-block mb-1" />
                        <span>Picture (Image)</span>
                      </div>
                      <div
                        className={`card flex-grow-1 p-3 text-center border cursor-pointer rounded-3 ${
                          formData.type === "video"
                            ? "border-primary bg-primary bg-opacity-10 text-primary fw-bold"
                            : "bg-white text-muted"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setFormData((p) => ({ ...p, type: "video" }))}
                      >
                        <i className="bi bi-camera-video fs-4 d-block mb-1" />
                        <span>Video Clip (MP4 / WebM)</span>
                      </div>
                    </div>
                  </div>

                  {/* File Upload or Direct URL */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-dark small text-uppercase">
                      {formData.type === "video" ? "Upload Video or Enter URL" : "Upload Picture or Enter URL"}
                    </label>

                    {/* Upload button */}
                    <div className="d-flex gap-2 mb-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={formData.type === "video" ? "video/*" : "image/*"}
                        className="d-none"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-success d-flex align-items-center gap-2"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" />
                            <span>Uploading {formData.type}...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cloud-arrow-up-fill" />
                            <span>Upload {formData.type === "video" ? "Video File" : "Image File"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Direct URL input */}
                    <div className="input-group">
                      <span className="input-group-text bg-white text-muted">
                        <i className="bi bi-link-45deg" />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={
                          formData.type === "video"
                            ? "https://example.com/sample-video.mp4 or uploaded Cloudinary URL"
                            : "/images/hero-basket.png or https://..."
                        }
                        value={formData.mediaUrl}
                        onChange={(e) => setFormData((p) => ({ ...p, mediaUrl: e.target.value }))}
                        required
                      />
                    </div>
                    <small className="text-muted">
                      You can either upload a local {formData.type} file (auto-stored in Cloudinary) or paste a direct {formData.type} link.
                    </small>
                  </div>

                  {/* Live Media Preview Card */}
                  {formData.mediaUrl && (
                    <div className="mb-4">
                      <label className="form-label fw-bold text-dark small text-uppercase">
                        Live Preview
                      </label>
                      <div
                        className="rounded-4 overflow-hidden shadow-sm bg-black position-relative"
                        style={{ height: "240px" }}
                      >
                        {formData.type === "video" ? (
                          <video
                            src={formData.mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <img
                            src={formData.mediaUrl}
                            alt="Preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/hero-basket.png";
                            }}
                          />
                        )}
                        {/* Title overlay simulation */}
                        {(formData.title || formData.subtitle) && (
                          <div
                            className="position-absolute bottom-0 start-0 end-0 p-3"
                            style={{
                              background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                              color: "#fff",
                            }}
                          >
                            <h6 className="fw-bold mb-1">{formData.title}</h6>
                            <p className="small mb-0 text-white-50">{formData.subtitle}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Title & Subtitle */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark small text-uppercase">
                        Title / Caption (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Handcrafted Buri Basket"
                        value={formData.title}
                        onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark small text-uppercase">
                        Subtitle (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 100% natural, woven by local artisans"
                        value={formData.subtitle}
                        onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Link URL, Order, and Active */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark small text-uppercase">
                        Destination Link (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="/products"
                        value={formData.linkUrl}
                        onChange={(e) => setFormData((p) => ({ ...p, linkUrl: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold text-dark small text-uppercase">
                        Display Order
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={formData.order}
                        onChange={(e) => setFormData((p) => ({ ...p, order: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="col-md-3 d-flex align-items-end">
                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isActiveSwitch"
                          checked={formData.isActive}
                          onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                        />
                        <label className="form-check-label fw-semibold text-dark small" htmlFor="isActiveSwitch">
                          Active Slide
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-secondary px-4"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success px-4 fw-semibold shadow-sm d-flex align-items-center gap-2"
                    disabled={saving || uploading}
                  >
                    {saving && <span className="spinner-border spinner-border-sm" role="status" />}
                    <span>{editingSlide ? "Update Slide" : "Add Slide"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
