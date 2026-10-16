"use client";

/**
 * Reusable loading-skeleton components.
 *
 * Variants:
 *  - spinner          Centred branded spinner (auth pages, simple states)
 *  - dashboard        Stat-card row  + chart area
 *  - table            Header row + 8 data rows
 *  - cardGrid         Grid of placeholder cards (customization, reports)
 *  - productGrid      Customer-facing product-card grid
 *  - productDetail    Image + text block side-by-side
 *  - contentBlock     Title + text lines + image area (about, custom-orders)
 *  - formCard         Title + form rows inside a card (account)
 *  - cartLayout       Item list + sidebar summary
 *  - checkoutLayout   Form rows + sidebar summary
 */

/* ---------- primitive blocks ---------- */
const Skeleton = ({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`celsa-skeleton ${className}`} style={style} />
);

const SkeletonLine = ({ width = "100%" }: { width?: string }) => (
  <Skeleton className="celsa-skeleton-line" style={{ width }} />
);

const SkeletonTitle = ({ width = "40%" }: { width?: string }) => (
  <Skeleton className="celsa-skeleton-title" style={{ width }} />
);

const SkeletonRow = ({ style = {} }: { style?: React.CSSProperties }) => (
  <Skeleton className="celsa-skeleton-row" style={style} />
);

const SkeletonCard = ({ height = "120px" }: { height?: string }) => (
  <Skeleton className="celsa-skeleton-card" style={{ height }} />
);

import PageLoader from "./PageLoader";

/* ---------- composed variants ---------- */

function Spinner({ message, submessage }: { message?: string; submessage?: string }) {
  return <PageLoader message={message} submessage={submessage} />;
}

function DashboardSkeleton() {
  return (
    <div className="p-4">
      <SkeletonTitle width="30%" />
      <div className="row g-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-md-3"><SkeletonCard /></div>
        ))}
      </div>
      <Skeleton style={{ height: "300px", borderRadius: "0.6rem" }} />
    </div>
  );
}

function TableSkeleton({ rows = 8, titleWidth = "25%" }: { rows?: number; titleWidth?: string }) {
  return (
    <div className="p-4">
      <SkeletonTitle width={titleWidth} />
      <SkeletonRow style={{ width: "100%" }} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

function CardGridSkeleton({ cols = 6, colClass = "col-md-4", titleWidth = "30%" }: { cols?: number; colClass?: string; titleWidth?: string }) {
  return (
    <div className="p-4">
      <SkeletonTitle width={titleWidth} />
      <div className="row g-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={colClass}><SkeletonCard /></div>
        ))}
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="container py-5">
      <SkeletonTitle width="25%" />
      <div className="row g-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="col-6 col-md-4 col-lg-3">
            <SkeletonCard height="200px" />
            <div className="mt-2"><SkeletonLine width="70%" /></div>
            <SkeletonLine width="40%" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container py-5">
      <div className="row g-4">
        <div className="col-md-6">
          <Skeleton style={{ height: "350px", borderRadius: "0.75rem" }} />
        </div>
        <div className="col-md-6">
          <SkeletonTitle width="60%" />
          <SkeletonLine width="30%" />
          <div className="mt-3"><SkeletonLine width="100%" /></div>
          <SkeletonLine width="90%" />
          <SkeletonLine width="75%" />
          <div className="mt-4"><SkeletonRow style={{ width: "40%", height: "2.8rem" }} /></div>
        </div>
      </div>
    </div>
  );
}

function ContentBlockSkeleton() {
  return (
    <div className="container py-5">
      <SkeletonTitle width="30%" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="90%" />
      <SkeletonLine width="95%" />
      <div className="mb-4"><SkeletonLine width="60%" /></div>
      <Skeleton style={{ height: "250px", borderRadius: "0.75rem" }} />
    </div>
  );
}

function FormCardSkeleton() {
  return (
    <div className="container py-5" style={{ maxWidth: "720px" }}>
      <SkeletonTitle />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="container py-5">
      <SkeletonTitle width="20%" />
      <div className="row g-4">
        <div className="col-lg-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-3"><SkeletonRow style={{ height: "5rem" }} /></div>
          ))}
        </div>
        <div className="col-lg-4"><SkeletonCard height="180px" /></div>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="container py-5">
      <SkeletonTitle width="25%" />
      <div className="row g-4">
        <div className="col-lg-7">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
        <div className="col-lg-5"><SkeletonCard height="220px" /></div>
      </div>
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="container py-5">
      <SkeletonTitle width="25%" />
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

function CustomOrdersSkeleton() {
  return (
    <div className="container py-5">
      <SkeletonTitle width="35%" />
      <SkeletonLine width="70%" />
      <div className="mb-4"><SkeletonLine width="50%" /></div>
      <SkeletonCard height="200px" />
      <div className="row g-3 mt-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="col-md-4"><SkeletonCard /></div>
        ))}
      </div>
    </div>
  );
}

function FormRowsSkeleton({ rows = 8, titleWidth = "30%" }: { rows?: number; titleWidth?: string }) {
  return (
    <div className="p-4">
      <SkeletonTitle width={titleWidth} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

/* ---------- main component ---------- */

export type LoadingVariant =
  | "spinner"
  | "dashboard"
  | "table"
  | "cardGrid"
  | "productGrid"
  | "productDetail"
  | "contentBlock"
  | "formCard"
  | "cartLayout"
  | "checkoutLayout"
  | "orderList"
  | "customOrders"
  | "formRows";

interface LoadingSkeletonProps {
  variant?: LoadingVariant;
  message?: string;
  submessage?: string;
}

export default function LoadingSkeleton({
  variant = "spinner",
  message,
  submessage,
}: LoadingSkeletonProps) {
  let defaultSub = "Loading handcrafted experience...";
  if (variant === "dashboard") defaultSub = "Loading dashboard analytics...";
  else if (variant === "table" || variant === "orderList") defaultSub = "Loading records & data...";
  else if (variant === "productGrid" || variant === "productDetail") defaultSub = "Loading handcrafted collection...";
  else if (variant === "customOrders") defaultSub = "Loading custom order studio...";
  else if (variant === "cartLayout") defaultSub = "Loading shopping cart...";
  else if (variant === "checkoutLayout") defaultSub = "Preparing secure checkout...";
  else if (variant === "formCard" || variant === "formRows") defaultSub = "Loading information...";

  return (
    <PageLoader
      message={message || "CELSA HANDICRAFTS"}
      submessage={submessage || defaultSub}
      minHeight={variant === "table" || variant === "formRows" ? "50vh" : "65vh"}
    />
  );
}
