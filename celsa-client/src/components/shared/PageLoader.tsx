"use client";

interface PageLoaderProps {
  message?: string;
  submessage?: string;
  minHeight?: string;
  fullScreen?: boolean;
}

export default function PageLoader({
  message = "CELSA HANDICRAFTS",
  submessage = "Loading handcrafted experience...",
  minHeight = "65vh",
  fullScreen = false,
}: PageLoaderProps) {
  return (
    <div
      className={`celsa-page-loader-wrapper ${fullScreen ? "celsa-page-loader-fullscreen" : ""}`}
      style={{ minHeight: fullScreen ? "100vh" : minHeight }}
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      {/* Animated Orb & Spinner Rings */}
      <div className="celsa-loader-stage">
        <div className="celsa-ring-outer" />
        <div className="celsa-ring-inner" />
        <div className="celsa-loader-emblem">
          <i className="bi bi-gem" />
        </div>
      </div>

      {/* Brand Title */}
      <div className="celsa-loader-brand">{message}</div>

      {/* Subtitle / Context Message */}
      {submessage && <div className="celsa-loader-caption">{submessage}</div>}

      {/* Glowing Animated Progress Bar */}
      <div className="celsa-loader-progress-track">
        <div className="celsa-loader-progress-bar" />
      </div>
    </div>
  );
}
