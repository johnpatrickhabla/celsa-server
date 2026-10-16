"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SheinErrorToastContent() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const errorType = searchParams.get("shein_error");
    if (errorType) {
      if (errorType === "not_found" || errorType === "404") {
        setMessage("Sorry, the page you requested is unavailable or does not exist.");
      } else {
        setMessage("Access restricted. Returned to home page.");
      }
      setVisible(true);

      // Clean the search parameter from the browser URL bar so user sees clean home URL
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("shein_error");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div
      className="shein-toast-banner position-fixed start-50 translate-middle-x"
      style={{
        top: 24,
        zIndex: 999999,
        maxWidth: "92vw",
        width: "auto",
        pointerEvents: "auto",
      }}
    >
      <div
        className="d-flex align-items-center gap-2.5 px-3 py-2 rounded-pill shadow-lg"
        style={{
          backgroundColor: "rgba(18, 18, 18, 0.94)",
          color: "#ffffff",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
        }}
      >
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{
            width: 20,
            height: 20,
            backgroundColor: "#e03131",
            color: "#ffffff",
            fontSize: "0.75rem",
          }}
        >
          <i className="bi bi-exclamation" style={{ fontWeight: 900 }} />
        </span>

        <span style={{ fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.2px" }}>
          {message}
        </span>

        <button
          type="button"
          className="btn-close btn-close-white p-1 ms-2 flex-shrink-0"
          style={{ fontSize: "0.65rem", opacity: 0.7 }}
          onClick={() => setVisible(false)}
          aria-label="Close error toast"
        />
      </div>
    </div>
  );
}

export default function SheinErrorToast() {
  return (
    <Suspense fallback={null}>
      <SheinErrorToastContent />
    </Suspense>
  );
}
