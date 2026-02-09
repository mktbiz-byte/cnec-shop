// Database Types for KviewShop

export type UserRole = 'super_admin' | 'brand_admin' | 'creator' | 'buyer';
export type Country = string;
export type Currency = string;
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
export type MoCRAStatus = 'green' | 'yellow' | 'red';
export type SettlementStatus = 'pending' | 'completed';
export type CreatorLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type LivePlatform = 'instagram' | 'youtube' | 'tiktok' | 'internal';
export type PointsType = 'review_text' | 'review_instagram' | 'purchase' | 'referral' | 'event' | 'expiry' | 'use_order' | 'admin_adjustment';
export type CommunityPostType = 'general' | 'review' | 'question' | 'announcement';

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
      sample_requests: {
        Row: SampleRequest;
        Insert: Omit<SampleRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SampleRequest, 'id'>>;
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
export interface BrandCertification {
  id: string;
  type: string;
  name: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Brand {
  id: string;
  user_id: string;
  company_name: string;
  company_name_en?: string;
  company_name_jp?: string;
  brand_name?: string;
  business_number?: string;
  logo_url?: string;
  description?: string;
  description_en?: string;
  description_jp?: string;
  monthly_fee: number;
  creator_commission_rate: number;
  mocra_status: MoCRAStatus;
  us_sales_ytd: number;
  jp_sales_ytd: number;
  approved: boolean;
  approved_at?: string;
  contact_email?: string;
  contact_phone?: string;
  // Shipping countries (ISO codes)
  shipping_countries?: string[];
  // Product safety certifications
  certifications?: BrandCertification[];
  // Tiered commission
  enable_tiered_commission?: boolean;
  tier1_rate?: number;
  tier2_rate?: number;
  tier3_rate?: number;
  tier4_rate?: number;
  // Settlement
  settlement_cycle?: string;
  minimum_payout?: number;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
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
  email?: string;
  phone?: string;
  theme_color: string;
  background_color?: string;
  text_color?: string;
  country?: Country;
  social_links?: SocialLinks;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  picked_products?: string[];
  level?: CreatorLevel;
  total_revenue: number;
  total_orders: number;
  community_enabled?: boolean;
  community_type?: 'board' | 'chat';
  shop_settings?: ShopSettings;
  payment_method?: string;
  paypal_email?: string;
  bank_name?: string;
  account_number?: string;
  swift_code?: string;
  notification_settings?: Record<string, boolean>;
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
  name?: string;
  name_ko: string;
  name_en: string;
  name_jp?: string;
  price?: number;
  price_usd: number;
  price_jpy: number;
  price_krw?: number;
  price_eur?: number;
  original_price_usd?: number;
  original_price_jpy?: number;
  stock: number;
  description?: string;
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

// Sample Request Types
export type SampleRequestStatus = 'pending' | 'approved' | 'shipped' | 'received' | 'rejected';

export interface SampleRequest {
  id: string;
  creator_id: string;
  brand_id: string;
  product_ids: string[];
  status: SampleRequestStatus;
  shipping_address?: ShippingAddress;
  message?: string;
  admin_note?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  products?: Product[];
  brand?: Brand;
  creator?: Creator;
}

// Support Ticket Types
export type SupportTicketCategory = 'product' | 'cs';
export type SupportTicketStatus = 'open' | 'resolved';

export interface SupportTicket {
  id: string;
  brand_id: string;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  from_name: string;
  from_email?: string;
  order_id?: string;
  response?: string;
  created_at: string;
  updated_at: string;
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

// =============================================
// BUYER TYPES
// =============================================

export interface Buyer {
  id: string;
  user_id: string;
  nickname: string;
  profile_image?: string;
  phone?: string;
  default_shipping_address?: ShippingAddress;
  points_balance: number;
  total_points_earned: number;
  total_points_used: number;
  total_orders: number;
  total_spent: number;
  total_reviews: number;
  preferred_language: string;
  preferred_currency: string;
  marketing_consent: boolean;
  eligible_for_creator: boolean;
  creator_conversion_date?: string;
  instagram_username?: string;
  instagram_verified: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// SHORT URL TYPES
// =============================================

export interface ShortUrl {
  id: string;
  creator_id: string;
  short_code: string;
  custom_domain?: string;
  is_primary: boolean;
  total_clicks: number;
  last_clicked_at?: string;
  is_active: boolean;
  expires_at?: string;
  source_tag?: string;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Creator;
}

export interface ShortUrlAnalytics {
  id: string;
  short_url_id: string;
  clicked_at: string;
  referrer?: string;
  user_agent?: string;
  ip_country?: string;
  device_type?: string;
}

// =============================================
// SUBSCRIPTION TYPES
// =============================================

export interface MallSubscription {
  id: string;
  buyer_id: string;
  creator_id: string;
  status: SubscriptionStatus;
  notify_new_products: boolean;
  notify_sales: boolean;
  notify_live_streams: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
  // Joined
  buyer?: Buyer;
  creator?: Creator;
}

// =============================================
// COMMUNITY TYPES
// =============================================

export interface CommunityPost {
  id: string;
  creator_id: string;
  buyer_id?: string;
  title?: string;
  content: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  is_hidden: boolean;
  hidden_reason?: string;
  post_type: CommunityPostType;
  created_at: string;
  updated_at: string;
  // Joined
  buyer?: Buyer;
  creator?: Creator;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  buyer_id?: string;
  parent_comment_id?: string;
  content: string;
  likes_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  buyer?: Buyer;
  replies?: CommunityComment[];
}

// =============================================
// REVIEW & Q&A TYPES
// =============================================

export interface ProductQuestion {
  id: string;
  product_id: string;
  buyer_id?: string;
  question: string;
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  is_public: boolean;
  is_answered: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  buyer?: Buyer;
  product?: Product;
}

export interface ProductReview {
  id: string;
  product_id: string;
  buyer_id?: string;
  order_id?: string;
  rating: number;
  title?: string;
  content: string;
  images: string[];
  instagram_post_url?: string;
  instagram_verified: boolean;
  points_awarded: number;
  points_awarded_at?: string;
  helpful_count: number;
  is_verified_purchase: boolean;
  is_approved: boolean;
  is_featured: boolean;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined
  buyer?: Buyer;
  product?: Product;
}

// =============================================
// POINTS SYSTEM TYPES
// =============================================

export interface PointsHistory {
  id: string;
  buyer_id: string;
  amount: number;
  balance_after: number;
  type: PointsType;
  reference_id?: string;
  description?: string;
  expires_at?: string;
  created_at: string;
}

// =============================================
// CREATOR LEVEL TYPES
// =============================================

export interface CreatorLevelDefinition {
  id: string;
  level_name: CreatorLevel;
  min_points: number;
  commission_bonus: number;
  badge_color: string;
  badge_icon: string;
  benefits: string[];
  created_at: string;
}

export interface CreatorLevelHistory {
  id: string;
  creator_id: string;
  from_level?: string;
  to_level: string;
  points_at_change: number;
  reason?: string;
  created_at: string;
}

// Extended Creator with level
export interface CreatorWithLevel extends Creator {
  level: CreatorLevel;
  level_points: number;
  level_updated_at?: string;
  community_enabled: boolean;
  community_type: 'board' | 'chat';
  shop_settings: ShopSettings;
  background_color: string;
  background_image?: string;
  text_color: string;
}

export interface ShopSettings {
  show_footer: boolean;
  footer_type: 'full' | 'minimal';
  show_social_links: boolean;
  show_subscriber_count: boolean;
  layout: 'grid' | 'list';
  products_per_row: number;
  show_prices: boolean;
  currency_display: 'local' | 'usd' | 'both';
  announcement: string;
  announcement_active: boolean;
}

// =============================================
// LIVE SHOPPING TYPES
// =============================================

export interface LiveSession {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  platform: LivePlatform;
  external_url?: string;
  stream_key?: string;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  status: LiveSessionStatus;
  featured_product_ids: string[];
  peak_viewers: number;
  total_viewers: number;
  total_orders: number;
  total_revenue: number;
  chat_enabled: boolean;
  bot_enabled: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Creator;
  products?: LiveProduct[];
}

export interface LiveProduct {
  id: string;
  live_session_id: string;
  product_id: string;
  display_order: number;
  live_price_usd?: number;
  live_price_jpy?: number;
  clicks: number;
  orders: number;
  created_at: string;
  // Joined
  product?: Product;
}

export interface LiveBotSettings {
  id: string;
  creator_id: string;
  is_enabled: boolean;
  welcome_message: string;
  product_link_interval: number;
  scheduled_messages: ScheduledMessage[];
  auto_responses: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ScheduledMessage {
  time_offset: number; // seconds from start
  message: string;
}

export interface LiveChatMessage {
  id: string;
  live_session_id: string;
  buyer_id?: string;
  is_bot_message: boolean;
  message: string;
  product_id?: string;
  product_link?: string;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  // Joined
  buyer?: Buyer;
}

// =============================================
// CREATOR APPLICATION (Buyer -> Creator)
// =============================================

export interface CreatorApplication {
  id: string;
  buyer_id: string;
  desired_username: string;
  display_name: string;
  bio?: string;
  instagram_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  follower_count?: number;
  motivation?: string;
  content_plan?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_creator_id?: string;
  created_at: string;
  updated_at: string;
  // Joined
  buyer?: Buyer;
}

export interface ConversionCriteria {
  id: string;
  min_orders: number;
  min_reviews: number;
  min_spent: number;
  min_account_age_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// LEGAL CONTENT TYPES
// =============================================

export type LegalContentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'refund_policy'
  | 'shipping_policy'
  | 'business_info'
  | 'contact_info';

export interface LegalContent {
  id: string;
  content_type: LegalContentType;
  country: string;
  language: string;
  title: string;
  content: string;
  is_active: boolean;
  version: number;
  effective_date?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// WISHLIST & CART TYPES
// =============================================

export interface BuyerWishlist {
  id: string;
  buyer_id: string;
  product_id: string;
  creator_id: string;
  created_at: string;
  // Joined
  product?: Product;
  creator?: Creator;
}

export interface BuyerCart {
  id: string;
  buyer_id: string;
  product_id: string;
  creator_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined
  product?: Product;
  creator?: Creator;
}

// =============================================
// BUYER DASHBOARD STATS
// =============================================

export interface BuyerDashboardStats {
  total_orders: number;
  total_spent: number;
  points_balance: number;
  active_subscriptions: number;
  wishlist_count: number;
  pending_reviews: number;
  recent_orders: Order[];
  subscribed_malls: MallSubscription[];
}
