export type ProductCategory = 
  | 'Tote Bags'
  | 'Shoulder Bags'
  | 'Crossbody Bags'
  | 'Clutches'
  | 'Backpacks'
  | 'Mini Bags'
  | string;

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  image?: string;
}

export interface ProductColorVariation {
  id: string;
  colorName: string;
  colorCode: string; // hex
  sku: string;
  price?: number | null; // optional override
  salePrice?: number | null; // optional override
  stock: number;
  images: string[]; // first image is primary
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number; // 1-5
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  price: number;
  salePrice?: number | null;
  description: string;
  materials: string;
  dimensions: string;
  careInstructions: string;
  featured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  active: boolean;
  variations: ProductColorVariation[];
  reviews: ProductReview[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  variationId: string;
  quantity: number;
  // Snapshot for quick client display
  productName: string;
  colorName: string;
  colorCode: string;
  sku: string;
  image: string;
  price: number;
  salePrice?: number | null;
  maxStock: number;
}

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  variationId: string;
  colorName: string;
  colorCode: string;
  sku: string;
  image: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  deliveryInstructions?: string;
}

export interface Order {
  id: string;
  userId?: string | null;
  customer: ShippingAddress;
  items: OrderItemSnapshot[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'CARD';
  paymentStatus: 'Pending' | 'Paid';
  status: OrderStatus;
  stockRestored?: boolean;
  statusHistory: {
    status: OrderStatus;
    date: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  address?: Partial<ShippingAddress>;
  createdAt: string;
}

export interface CustomerSummary extends User {
  ordersCount: number;
  totalSpent: number;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSpend: number;
  active: boolean;
  description: string;
}

export interface StoreSettings {
  shippingFee: number;
  freeShippingThreshold: number;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  codEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSender?: string;
}

export interface EmailNotificationLog {
  id: string;
  orderId: string;
  recipientEmail: string;
  sentAt: string;
  status: 'sent' | 'simulated';
  subject: string;
  screenshotUrl?: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  lowStockItems: number;
  outOfStockItems: number;
  bestSellingProducts: {
    id: string;
    name: string;
    category: string;
    unitsSold: number;
    revenue: number;
  }[];
}
