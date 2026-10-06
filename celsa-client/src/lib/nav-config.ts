export interface NavItem {
  label: string;
  href: string;
  icon?: string; // bootstrap-icons class name
}

// Admin: full module list per the RBAC table (Reports + Users are Admin-only)
export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "bi-grid-1x2" },
  { label: "Products", href: "/admin/products", icon: "bi-box-seam" },
  { label: "Categories", href: "/admin/categories", icon: "bi-tags" },
  { label: "Inventory", href: "/admin/inventory", icon: "bi-clipboard-data" },
  { label: "Orders", href: "/admin/orders", icon: "bi-receipt" },
  { label: "Customization", href: "/admin/customization", icon: "bi-palette" },
  { label: "Production", href: "/admin/production", icon: "bi-gear" },
  { label: "Customers", href: "/admin/customers", icon: "bi-people" },
  { label: "Reports", href: "/admin/reports", icon: "bi-bar-chart" },
  { label: "Users", href: "/admin/users", icon: "bi-person-badge" },
  { label: "Hero Slides", href: "/admin/hero-slides", icon: "bi-film" },
  { label: "Settings", href: "/admin/settings", icon: "bi-sliders" },
];

// Staff: no Reports, no Users (Staff Account Management) per RBAC decision
export const STAFF_NAV: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard", icon: "bi-grid-1x2" },
  { label: "Orders", href: "/staff/orders", icon: "bi-receipt" },
  { label: "Customization", href: "/staff/customization", icon: "bi-palette" },
  { label: "Production", href: "/staff/production", icon: "bi-gear" },
  { label: "Inventory", href: "/staff/inventory", icon: "bi-clipboard-data" },
  { label: "Hero Slides", href: "/staff/hero-slides", icon: "bi-film" },
];

export const CUSTOMER_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Customization", href: "/custom-orders" },
  { label: "Track Order", href: "/my-orders" },
  { label: "About Us", href: "/about" },
];
