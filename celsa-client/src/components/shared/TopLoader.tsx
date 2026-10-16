"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start animation on route change
    setLoading(true);
    setProgress(20);

    const step1 = setTimeout(() => setProgress(65), 120);
    const step2 = setTimeout(() => setProgress(90), 300);
    const step3 = setTimeout(() => {
      setProgress(100);
      timerRef.current = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
    }, 450);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="celsa-top-loader-bar"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
        transition: progress === 100 ? "width 0.2s ease, opacity 0.3s ease" : "width 0.35s ease",
      }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}
