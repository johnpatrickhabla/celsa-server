/** Shared TypeScript types used across the frontend */

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
}

export interface CustomizationChoice {
  value: string;
  priceModifier: number;
}

export interface CustomizationOption {
  _id: string;
  type: "material" | "color" | "size" | "engraving" | "add-on" | "other";
  label: string;
  required: boolean;
  choices: CustomizationChoice[];
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: Category | string;
  basePrice: number;
  images: ProductImage[];
  customizationOptions: CustomizationOption[];
  stock: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;
  isCustomizable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SelectedCustomization {
  type: string;
  label: string;
  selectedValue: string;
  priceModifier: number;
}

export interface OrderItem {
  product: string;
  productName: string;
  productImage: string;
  customizations: SelectedCustomization[];
  quantity: number;
  unitPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  zip: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: { _id: string; name: string; email: string } | string;
  items: OrderItem[];
  orderType: "regular" | "pre-order" | "custom";
  shippingAddress: ShippingAddress;
  paymentMethod: "stripe" | "paypal" | "gcash" | "cod";
  paymentStatus: "unpaid" | "deposit_paid" | "fully_paid" | "cod_pending" | "paid";
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "completed" | "cancelled";
  totalAmount: number;
  depositAmount: number;
  balanceDue: number;
  notes: string;
  referenceImage?: string;
  designDescription?: string;
  customApprovalStatus?: "none" | "pending" | "approved" | "rejected";
  customRejectionReason?: string;
  courierName?: string;
  trackingNumber?: string;
  assignedTo: { _id: string; name: string; email?: string } | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "customer";
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    zip: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface InventoryReportItem {
  _id: string;
  name: string;
  categoryName: string;
  stock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  basePrice: number;
  totalValue: number;
}

export interface InventoryReport {
  items: InventoryReportItem[];
  totalProducts: number;
  totalInventoryUnits: number;
  totalInventoryValue: number;
  lowStockCount: number;
}

export interface StaffWorkloadItem {
  staffId: string;
  name: string;
  email: string;
  activeCount: number;
  completedCount: number;
}

export interface ProductionReport {
  ordersByStatus: Array<{ _id: string; count: number }>;
  staffWorkload: StaffWorkloadItem[];
  totalInProduction: number;
  totalPending: number;
  totalShipped: number;
  totalCompleted: number;
}

export interface TopCustomerItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface CustomerReport {
  topCustomers: TopCustomerItem[];
  totalCustomersCount: number;
}

export interface DashboardReportData {
  revenueData: Array<{ _id: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ _id: string; count: number }>;
  bestSellers: Array<{ _id: string; totalSold: number; revenue: number }>;
  inventoryReport?: InventoryReport;
  productionReport?: ProductionReport;
  customerReport?: CustomerReport;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: "order_status" | "custom_approved" | "custom_rejected" | "shipped" | "general";
  order?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSlide {
  _id: string;
  type: "image" | "video";
  mediaUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  publicId?: string;
  createdAt?: string;
  updatedAt?: string;
}


