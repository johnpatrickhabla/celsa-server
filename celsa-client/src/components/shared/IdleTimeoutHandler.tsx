"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_DURATION_MS = 60 * 1000;  // 1 minute warning before logout
const CHECK_INTERVAL_MS = 1000;         // Check every 1 second
const THROTTLE_MS = 3000;               // Throttle activity recording to every 3s
const STORAGE_KEY = "celsa_last_activity";

export default function IdleTimeoutHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const lastRecordedRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  // Update last activity timestamp in localStorage and local ref
  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordedRef.current > THROTTLE_MS) {
      lastRecordedRef.current = now;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {
          // Ignore localStorage errors (e.g. quota/incognito)
        }
      }
    }
    // If warning was showing and user moves/types, dismiss warning
    setShowWarning((prev) => {
      if (prev) {
        lastRecordedRef.current = now;
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {}
        return false;
      }
      return prev;
    });
  }, []);

  // Explicit "Stay Logged In" button handler
  const handleStayLoggedIn = () => {
    const now = Date.now();
    lastRecordedRef.current = now;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {}
    }
    setShowWarning(false);
  };

  // Perform logout due to inactivity
  const handleIdleLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setShowWarning(false);

    try {
      await logout();
    } catch {
      // Ignore network errors
    } finally {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem("celsa_access_token");
        } catch {}
      }
      isLoggingOutRef.current = false;
      router.push("/login?reason=idle_timeout");
    }
  }, [logout, router]);

  useEffect(() => {
    // Only track idle timeout for logged-in users (especially customers)
    if (!isAuthenticated || !user) {
      setShowWarning(false);
      return;
    }

    // Initialize last activity timestamp
    const now = Date.now();
    lastRecordedRef.current = now;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {}
    }

    // User activity event listeners
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    const handleUserActivity = () => recordActivity();

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Sync across browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = Number(e.newValue);
        if (!isNaN(remoteTime)) {
          lastRecordedRef.current = remoteTime;
          setShowWarning(false);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Visibility change check (when user returns to this tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const stored = localStorage.getItem(STORAGE_KEY);
        const lastAct = stored ? Number(stored) : lastRecordedRef.current;
        const elapsed = Date.now() - lastAct;

        if (elapsed >= IDLE_TIMEOUT_MS) {
          handleIdleLogout();
        } else if (elapsed >= IDLE_TIMEOUT_MS - WARNING_DURATION_MS) {
          const remaining = Math.max(1, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
          setSecondsRemaining(remaining);
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic check timer
    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const lastAct = stored ? Number(stored) : lastRecordedRef.current;
      const elapsed = Date.now() - lastAct;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        handleIdleLogout();
      } else if (elapsed >= IDLE_TIMEOUT_MS - WARNING_DURATION_MS) {
        const remaining = Math.max(1, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setShowWarning(true);
      } else {
        setShowWarning((prev) => (prev ? false : prev));
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, user, recordActivity, handleIdleLogout, pathname]);

  if (!showWarning || !isAuthenticated) {
    return null;
  }

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-0 bg-warning bg-opacity-10 pb-0 pt-4 px-4">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark p-2 rounded-circle">
                <i className="bi bi-clock-history fs-5" />
              </span>
              <h5 className="modal-title fw-bold text-dark mb-0">Session Expiring Soon</h5>
            </div>
          </div>
          <div className="modal-body p-4 text-center">
            <p className="text-secondary mb-3">
              You have been inactive for almost 15 minutes. For your security, you will be automatically logged out in:
            </p>
            <div className="my-3">
              <span className="display-5 fw-bold text-danger">{secondsRemaining}</span>
              <span className="text-muted ms-2 fw-semibold">seconds</span>
            </div>
            <p className="small text-muted mb-0">
              Click below or move your mouse anywhere on the page to stay signed in.
            </p>
          </div>
          <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-warning px-4 py-2 rounded-3 fw-bold text-dark shadow-sm"
              onClick={handleStayLoggedIn}
            >
              <i className="bi bi-shield-check me-2" />
              Stay Logged In
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary px-3 py-2 rounded-3 small"
              onClick={handleIdleLogout}
            >
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
