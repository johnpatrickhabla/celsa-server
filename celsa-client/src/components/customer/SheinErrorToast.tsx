"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SheinErrorToastContent() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [message, setMessage] = useState("");

  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const errorType = searchParams.get("shein_error");
    if (errorType) {
      if (errorType === "not_found" || errorType === "404") {
        setMessage("Sorry, the page you requested is unavailable or does not exist.");
      } else {
        setMessage("Access restricted. Returned to home page.");
      }

      setVisible(true);
      setIsLeaving(false);

      // Clean the search parameter from the browser URL bar so user sees clean home URL
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("shein_error");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }

      // Clear any prior active timers
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      // Start vanishing transition after 2.8 seconds
      leaveTimerRef.current = setTimeout(() => {
        setIsLeaving(true);
      }, 2800);

      // Completely remove from DOM after vanish animation finishes (3.15 seconds total)
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        setIsLeaving(false);
      }, 3150);
    }
  }, [searchParams]);

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setIsLeaving(false);
    }, 250);
  };

  if (!visible) return null;

  return (
    <div
      className={`shein-toast-banner position-fixed start-50 translate-middle-x ${
        isLeaving ? "shein-toast-leaving" : ""
      }`}
      style={{
        top: 32,
        zIndex: 999999,
        maxWidth: "90vw",
        width: "auto",
        cursor: "pointer",
      }}
      onClick={handleDismiss}
      title="Click to dismiss"
    >
      <div
        className="d-flex align-items-center shadow-lg rounded-pill"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.88)",
          color: "#ffffff",
          backdropFilter: "blur(12px)",
          padding: "13px 30px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
          gap: "14px",
        }}
      >
        {/* Warning Icon Badge */}
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{
            width: 22,
            height: 22,
            backgroundColor: "#f59f00",
            color: "#ffffff",
            fontSize: "0.85rem",
          }}
        >
          <i className="bi bi-exclamation" style={{ fontWeight: 900 }} />
        </span>

        {/* Message Text */}
        <span
          style={{
            fontSize: "0.9rem",
            fontWeight: 500,
            letterSpacing: "0.25px",
            lineHeight: 1.4,
            display: "inline-block",
          }}
        >
          {message}
        </span>
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
