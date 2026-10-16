"use client";

interface PageLoaderProps {
  message?: string;
  submessage?: string;
  minHeight?: string;
  fullScreen?: boolean;
}

export default function PageLoader({
  message = "CELSA HANDICRAFTS",
  submessage,
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
      {/* Brand Title */}
      {message && <div className="celsa-loader-brand">{message}</div>}

      {/* Circling Spinner with "Loading" word inside the circle */}
      <div className="celsa-circling-loader">
        <div className="celsa-circling-ring" />
        <span className="celsa-circling-text">Loading</span>
      </div>

      {/* Contextual Subtitle (if distinct from "Loading") */}
      {submessage && submessage.toLowerCase().trim() !== "loading" && submessage.toLowerCase().trim() !== "loading..." && (
        <div className="celsa-loader-caption mt-1">{submessage}</div>
      )}
    </div>
  );
}
