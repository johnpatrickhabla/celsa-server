"use client";

interface PageLoaderProps {
  message?: string;
  submessage?: string;
  minHeight?: string;
  fullScreen?: boolean;
}

export default function PageLoader({
  message = "CELSA HANDICRAFTS",
  submessage = "Loading...",
  minHeight = "65vh",
  fullScreen = false,
}: PageLoaderProps) {
  // Extract dots if already part of submessage or provide animated dots
  const cleanSub = (submessage || "Loading").replace(/\.+$/, "");

  return (
    <div
      className={`celsa-page-loader-wrapper ${fullScreen ? "celsa-page-loader-fullscreen" : ""}`}
      style={{ minHeight: fullScreen ? "100vh" : minHeight }}
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      {/* Brand Title */}
      <div className="celsa-loader-brand">{message}</div>

      {/* Clean Animated Loading Text */}
      <div className="celsa-loader-caption d-inline-flex align-items-center">
        <span>{cleanSub}</span>
        <span className="celsa-loading-dots ms-1">
          <span className="dot dot-1">.</span>
          <span className="dot dot-2">.</span>
          <span className="dot dot-3">.</span>
        </span>
      </div>
    </div>
  );
}
