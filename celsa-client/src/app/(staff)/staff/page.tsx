"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function StaffRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/staff/dashboard");
  }, [router]);

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "80vh" }}
    >
      <LoadingSkeleton variant="spinner" />
    </div>
  );
}
