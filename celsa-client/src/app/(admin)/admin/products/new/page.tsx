"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProductRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the products list page and automatically trigger the Add New Product modal
    router.replace("/admin/products?new=true");
  }, [router]);

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center p-5 text-muted"
      style={{ minHeight: "50vh" }}
    >
      <div className="spinner-border spinner-border-sm text-success mb-2" role="status" />
      <span className="small">Opening Product Creation Modal...</span>
    </div>
  );
}
