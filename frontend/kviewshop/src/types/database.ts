// Database Types for KviewShop

export type UserRole = 'super_admin' | 'brand_admin' | 'creator';
export type Country = 'US' | 'JP';
export type Currency = 'USD' | 'JPY';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
export type MoCRAStatus = 'green' | 'yellow' | 'red';
export type SettlementStatus = 'pending' | 'completed';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      brands: {
        Row: Brand;
        Insert: Omit<Brand, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Brand, 'id'>>;
      };
      creators: {
        Row: Creator;
        Insert: Omit<Creator, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Creator, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id'>>;
      };
      creator_products: {
        Row: CreatorProduct;
        Insert: Omit<CreatorProduct, 'id' | 'created_at'>;
        Update: Partial<Omit<CreatorProduct, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at'>;
        Update: Partial<Omit<OrderItem, 'id'>>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at'>;
        Update: Partial<Omit<Settlement, 'id'>>;
      };
    };
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// Brand Types
export interface Brand {
  id: string;
  user_id: string;
  company_name: string;
  company_name_en?: string;
  company_name_jp?: string;
  business_number?: string;
  logo_url?: string;
  description?: string;
  description_en?: string;
  description_jp?: string;
  monthly_fee: number; // 월 구독료 (KRW)
  creator_commission_rate: number; // 크리에이터 수수료율 (20-30%)
  mocra_status: MoCRAStatus;
  us_sales_ytd: number; // 연간 미국 매출
  jp_sales_ytd: number; // 연간 일본 매출
  approved: boolean;
  approved_at?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

// Creator Types
export interface Creator {
  id: string;
  user_id: string;
  username: string; // @username for shop URL
  display_name?: string;
  profile_image?: string;
  bio?: string;
  bio_en?: string;
  bio_jp?: string;
  theme_color: string;
  country: Country;
  social_links?: SocialLinks;
  total_revenue: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
}

// Product Types
export interface Product {
  id: string;
  brand_id: string;
  sku?: string;
  name_ko: string;
  name_en: string;
  name_jp?: string;
  price_usd: number;
  price_jpy: number;
  original_price_usd?: number;
  original_price_jpy?: number;
  stock: number;
  description_ko?: string;
  description_en?: string;
  description_jp?: string;
  images: string[];
  category?: string;
  is_cosmetic: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  brand?: Brand;
}

// Creator's Product Pick
export interface CreatorProduct {
  id: string;
  creator_id: string;
  product_id: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  // Joined fields
  product?: Product;
  creator?: Creator;
}

// Order Types
export interface Order {
  id: string;
  order_number: string;
  creator_id: string;
  brand_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address: ShippingAddress;
  country: Country;
  currency: Currency;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  creator_revenue: number;
  platform_revenue: number;
  brand_revenue: number;
  status: OrderStatus;
  payment_intent_id?: string;
  tracking_number?: string;
  shipped_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: Creator;
  brand?: Brand;
  items?: OrderItem[];
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  // Joined fields
  product?: Product;
}

// Settlement Types
export interface Settlement {
  id: string;
  user_id: string;
  user_role: UserRole;
  period: string; // '2026-01'
  total_revenue: number;
  currency: Currency;
  details: SettlementDetails;
  status: SettlementStatus;
  paid_at?: string;
  created_at: string;
}

export interface SettlementDetails {
  order_count: number;
  items: SettlementItem[];
}

export interface SettlementItem {
  order_id: string;
  order_number: string;
  amount: number;
  date: string;
}

// Dashboard Stats Types
export interface AdminDashboardStats {
  total_revenue: number;
  total_orders: number;
  active_brands: number;
  active_creators: number;
  us_revenue: number;
  jp_revenue: number;
  pending_brand_approvals: number;
  pending_settlements: number;
}

export interface BrandDashboardStats {
  total_revenue: number;
  total_orders: number;
  product_count: number;
  active_creators: number;
  us_sales_ytd: number;
  jp_sales_ytd: number;
  mocra_status: MoCRAStatus;
  top_products: ProductStat[];
  top_creators: CreatorStat[];
}

export interface CreatorDashboardStats {
  total_revenue: number;
  total_orders: number;
  picked_products: number;
  pending_settlement: number;
  recent_orders: Order[];
}

export interface ProductStat {
  product_id: string;
  product_name: string;
  total_sold: number;
  revenue: number;
}

export interface CreatorStat {
  creator_id: string;
  creator_name: string;
  total_sold: number;
  revenue: number;
}

// MoCRA Thresholds
export const MOCRA_THRESHOLDS = {
  WARNING: 800000, // $800,000
  CRITICAL: 1000000, // $1,000,000
} as const;

// Commission Rates
export const COMMISSION_RATES = {
  PLATFORM_FEE: 0.05, // 5%
  MIN_CREATOR_RATE: 0.20, // 20%
  MAX_CREATOR_RATE: 0.30, // 30%
  DEFAULT_CREATOR_RATE: 0.25, // 25%
} as const;
