-- ============================================================
-- KviewShop Supabase 전체 수정 스크립트
-- 순서대로 Supabase SQL Editor에서 실행하세요
-- 스토리지, 테이블, RLS, 함수, 트리거 전부 포함
-- ============================================================


-- ============================================================
-- STEP 0: 필수 Extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- STEP 1: 스토리지 버킷 생성 (가장 중요!)
-- ============================================================

-- products 버킷 (상품 이미지)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- profiles 버킷 (프로필 이미지)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;


-- ============================================================
-- STEP 2: 스토리지 RLS 정책 (업로드/다운로드 권한)
-- ============================================================

-- products 버킷 정책
DROP POLICY IF EXISTS "Public read products" ON storage.objects;
CREATE POLICY "Public read products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Authenticated upload products" ON storage.objects;
CREATE POLICY "Authenticated upload products" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated update products" ON storage.objects;
CREATE POLICY "Authenticated update products" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated delete products" ON storage.objects;
CREATE POLICY "Authenticated delete products" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

-- profiles 버킷 정책
DROP POLICY IF EXISTS "Public access to profile images" ON storage.objects;
CREATE POLICY "Public access to profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profiles' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profiles' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profiles' AND auth.role() = 'authenticated'
  );


-- ============================================================
-- STEP 3: 핵심 함수 생성 (테이블보다 먼저!)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'KV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- STEP 4: 모든 테이블 생성 (IF NOT EXISTS)
-- ============================================================

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'brand_admin', 'creator', 'buyer')) NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- brands
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_name_en TEXT,
  company_name_jp TEXT,
  business_number TEXT,
  logo_url TEXT,
  description TEXT,
  description_en TEXT,
  description_jp TEXT,
  monthly_fee INTEGER DEFAULT 55000,
  creator_commission_rate INTEGER DEFAULT 25,
  mocra_status TEXT DEFAULT 'green' CHECK (mocra_status IN ('green', 'yellow', 'red')),
  us_sales_ytd NUMERIC DEFAULT 0,
  jp_sales_ytd NUMERIC DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  contact_email TEXT,
  contact_phone TEXT,
  brand_name TEXT,
  shipping_countries TEXT[] DEFAULT '{}',
  certifications JSONB DEFAULT '[]',
  enable_tiered_commission BOOLEAN DEFAULT false,
  tier1_rate INTEGER DEFAULT 15,
  tier2_rate INTEGER DEFAULT 20,
  tier3_rate INTEGER DEFAULT 25,
  tier4_rate INTEGER DEFAULT 30,
  settlement_cycle TEXT DEFAULT 'monthly',
  minimum_payout INTEGER DEFAULT 50,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  bank_code TEXT,
  bank_verified BOOLEAN DEFAULT false,
  bank_verified_at TIMESTAMPTZ,
  brand_lines JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- creators
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_image TEXT,
  bio TEXT,
  bio_en TEXT,
  bio_jp TEXT,
  theme_color TEXT DEFAULT '#d4af37',
  background_color TEXT DEFAULT '#1a1a1a',
  background_image TEXT,
  text_color TEXT DEFAULT '#ffffff',
  country TEXT,
  social_links JSONB DEFAULT '{}',
  instagram TEXT,
  youtube TEXT,
  tiktok TEXT,
  picked_products TEXT[] DEFAULT '{}',
  community_enabled BOOLEAN DEFAULT false,
  community_type TEXT DEFAULT 'board',
  shop_settings JSONB DEFAULT '{"show_footer":true,"footer_type":"full","show_social_links":true,"show_subscriber_count":false,"layout":"grid","products_per_row":3,"show_prices":true,"announcement":"","announcement_active":false}'::jsonb,
  level TEXT DEFAULT 'bronze',
  level_points INTEGER DEFAULT 0,
  level_updated_at TIMESTAMPTZ,
  total_revenue NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  commission_rate NUMERIC,
  payment_method TEXT DEFAULT 'paypal',
  paypal_email TEXT,
  bank_name TEXT,
  account_number TEXT,
  swift_code TEXT,
  email TEXT,
  phone TEXT,
  notification_settings JSONB DEFAULT '{"email_notifications":true,"order_notifications":true,"settlement_notifications":true}'::jsonb,
  shipping_countries TEXT[],
  certifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT,
  name_ko TEXT,
  name_en TEXT,
  name_jp TEXT,
  price NUMERIC,
  price_usd INTEGER,
  price_jpy INTEGER,
  original_price_usd INTEGER,
  original_price_jpy INTEGER,
  stock INTEGER DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  description TEXT,
  description_ko TEXT,
  description_en TEXT,
  description_jp TEXT,
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  category TEXT,
  subcategory TEXT,
  currency TEXT,
  is_cosmetic BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  commission_rate NUMERIC,
  mocra_status TEXT,
  us_sales_count INTEGER DEFAULT 0,
  certifications JSONB,
  ingredients JSONB,
  tier_pricing JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- creator_products
CREATE TABLE IF NOT EXISTS creator_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, product_id)
);

-- buyers
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  nickname TEXT,
  display_name TEXT,
  email TEXT,
  profile_image TEXT,
  phone TEXT,
  default_shipping_address JSONB,
  shipping_address JSONB,
  points_balance INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_used INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  preferred_language TEXT DEFAULT 'ko',
  preferred_currency TEXT DEFAULT 'KRW',
  marketing_consent BOOLEAN DEFAULT false,
  eligible_for_creator BOOLEAN DEFAULT false,
  creator_conversion_date TIMESTAMPTZ,
  instagram_username TEXT,
  instagram_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE,
  buyer_id UUID,
  creator_id UUID,
  brand_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  shipping_address JSONB,
  shipping_country TEXT,
  country TEXT,
  currency TEXT,
  subtotal NUMERIC,
  shipping_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC,
  commission_amount NUMERIC,
  creator_revenue NUMERIC,
  platform_revenue NUMERIC,
  brand_revenue NUMERIC,
  status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- settlements
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_role TEXT,
  period TEXT,
  total_revenue NUMERIC,
  currency TEXT,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- short_urls
CREATE TABLE IF NOT EXISTS short_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL,
  custom_domain TEXT,
  is_primary BOOLEAN DEFAULT false,
  total_clicks INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  source_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- short_url_analytics
CREATE TABLE IF NOT EXISTS short_url_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  short_url_id UUID REFERENCES short_urls(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip_country TEXT,
  device_type TEXT
);

-- mall_subscriptions
CREATE TABLE IF NOT EXISTS mall_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID,
  creator_id UUID,
  status TEXT DEFAULT 'active',
  notify_new_products BOOLEAN DEFAULT true,
  notify_sales BOOLEAN DEFAULT true,
  notify_live_streams BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- community_posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID,
  buyer_id UUID,
  title TEXT,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  hidden_reason TEXT,
  post_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- community_comments
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID,
  buyer_id UUID,
  parent_comment_id UUID,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- community_likes
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID,
  buyer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- product_questions
CREATE TABLE IF NOT EXISTS product_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID,
  buyer_id UUID,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID,
  answered_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT true,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- product_reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID,
  buyer_id UUID,
  order_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  instagram_post_url TEXT,
  instagram_verified BOOLEAN DEFAULT false,
  points_awarded INTEGER DEFAULT 0,
  points_awarded_at TIMESTAMPTZ,
  helpful_count INTEGER DEFAULT 0,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- review_helpful_votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID,
  buyer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- points_history
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- creator_levels
CREATE TABLE IF NOT EXISTS creator_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_name TEXT UNIQUE NOT NULL,
  min_points INTEGER NOT NULL,
  commission_bonus NUMERIC DEFAULT 0,
  badge_color TEXT,
  badge_icon TEXT,
  benefits JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 레벨 데이터
INSERT INTO creator_levels (level_name, min_points, commission_bonus, badge_color, badge_icon, benefits) VALUES
  ('bronze', 0, 0, '#CD7F32', 'medal', '["기본 커미션율", "월간 리포트"]'),
  ('silver', 1000, 1, '#C0C0C0', 'award', '["커미션 +1%", "우선 샘플 배송"]'),
  ('gold', 5000, 2, '#FFD700', 'crown', '["커미션 +2%", "전용 담당자 배정"]'),
  ('platinum', 15000, 3, '#E5E4E2', 'gem', '["커미션 +3%", "독점 상품 액세스"]'),
  ('diamond', 50000, 5, '#B9F2FF', 'diamond', '["커미션 +5%", "브랜드 콜라보 기회"]')
ON CONFLICT (level_name) DO NOTHING;

-- creator_level_history
CREATE TABLE IF NOT EXISTS creator_level_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID,
  from_level TEXT,
  to_level TEXT NOT NULL,
  points_at_change INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sample_requests
CREATE TABLE IF NOT EXISTS sample_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  product_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  message TEXT,
  admin_note TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- live_sessions
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  external_url TEXT,
  stream_key TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  featured_product_ids UUID[] DEFAULT '{}',
  peak_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  chat_enabled BOOLEAN DEFAULT true,
  bot_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- live_products
CREATE TABLE IF NOT EXISTS live_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID,
  product_id UUID,
  display_order INTEGER DEFAULT 0,
  live_price_usd NUMERIC,
  live_price_jpy NUMERIC,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- live_bot_settings
CREATE TABLE IF NOT EXISTS live_bot_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  welcome_message TEXT DEFAULT '안녕하세요! 오늘 라이브에 오신 것을 환영합니다! 🎉',
  product_link_interval INTEGER DEFAULT 300,
  scheduled_messages JSONB DEFAULT '[]',
  auto_responses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- live_chat_messages
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID,
  buyer_id UUID,
  is_bot_message BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  product_id UUID,
  product_link TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- creator_applications
CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID,
  desired_username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  follower_count INTEGER,
  motivation TEXT,
  content_plan TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_creator_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- conversion_criteria
CREATE TABLE IF NOT EXISTS conversion_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_orders INTEGER DEFAULT 5,
  min_reviews INTEGER DEFAULT 3,
  min_spent NUMERIC DEFAULT 100,
  min_account_age_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO conversion_criteria (min_orders, min_reviews, min_spent, min_account_age_days)
SELECT 5, 3, 100, 30
WHERE NOT EXISTS (SELECT 1 FROM conversion_criteria);

-- legal_content
CREATE TABLE IF NOT EXISTS legal_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- buyer_wishlist
CREATE TABLE IF NOT EXISTS buyer_wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID,
  product_id UUID,
  creator_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- buyer_cart
CREATE TABLE IF NOT EXISTS buyer_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID,
  product_id UUID,
  creator_id UUID,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID,
  category TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  from_name TEXT NOT NULL DEFAULT '',
  from_email TEXT,
  order_id TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- STEP 5: 누락 컬럼 추가 (ALTER TABLE ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- brands 누락 컬럼
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS shipping_countries TEXT[] DEFAULT '{}';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS enable_tiered_commission BOOLEAN DEFAULT false;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tier1_rate INTEGER DEFAULT 15;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tier2_rate INTEGER DEFAULT 20;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tier3_rate INTEGER DEFAULT 25;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tier4_rate INTEGER DEFAULT 30;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS settlement_cycle TEXT DEFAULT 'monthly';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS minimum_payout INTEGER DEFAULT 50;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS account_holder TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN DEFAULT false;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_lines JSONB DEFAULT '[]'::jsonb;

-- creators 누락 컬럼
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#1a1a1a';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS background_image TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS community_enabled BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'board';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS shop_settings JSONB;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'bronze';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS level_points INTEGER DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paypal';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS paypal_email TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS swift_code TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS notification_settings JSONB;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS shipping_countries TEXT[];
ALTER TABLE creators ADD COLUMN IF NOT EXISTS certifications JSONB;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS picked_products TEXT[] DEFAULT '{}';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- products 누락 컬럼
ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mocra_status TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS us_sales_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS certifications JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tier_pricing JSONB;

-- orders 누락 컬럼
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- buyers 누락 컬럼
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS available_points INTEGER DEFAULT 0;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- 데이터 백필
UPDATE products SET name = name_ko WHERE name IS NULL AND name_ko IS NOT NULL;
UPDATE products SET price = price_usd WHERE price IS NULL AND price_usd IS NOT NULL;
UPDATE products SET description = description_ko WHERE description IS NULL AND description_ko IS NOT NULL;


-- ============================================================
-- STEP 6: RLS 활성화 (모든 테이블)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_url_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_level_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 7: RLS 정책 재생성 (DROP + CREATE)
-- ============================================================

-- == users ==
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admin can view all users" ON users;
CREATE POLICY "Super admin can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
);

DROP POLICY IF EXISTS "Anyone can insert users" ON users;
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- == brands ==
DROP POLICY IF EXISTS "Anyone can view approved brands" ON brands;
CREATE POLICY "Anyone can view approved brands" ON brands FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Brand admins can view own brand" ON brands;
CREATE POLICY "Brand admins can view own brand" ON brands FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Brand admins can update own brand" ON brands;
CREATE POLICY "Brand admins can update own brand" ON brands FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert brands" ON brands;
CREATE POLICY "Anyone can insert brands" ON brands FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Creators can view brand info" ON brands;
CREATE POLICY "Creators can view brand info" ON brands FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'creator')
);

DROP POLICY IF EXISTS "Super admin can view all brands" ON brands;
CREATE POLICY "Super admin can view all brands" ON brands FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Super admin can update all brands" ON brands;
CREATE POLICY "Super admin can update all brands" ON brands FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Super admin can delete brands" ON brands;
CREATE POLICY "Super admin can delete brands" ON brands FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == creators ==
DROP POLICY IF EXISTS "Anyone can view creators" ON creators;
CREATE POLICY "Anyone can view creators" ON creators FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can update own profile" ON creators;
CREATE POLICY "Creators can update own profile" ON creators FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert creators" ON creators;
CREATE POLICY "Anyone can insert creators" ON creators FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admin can manage all creators" ON creators;
CREATE POLICY "Super admin can manage all creators" ON creators FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == products ==
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Brand admins can view own products" ON products;
CREATE POLICY "Brand admins can view own products" ON products FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Brand admins can manage own products" ON products;
CREATE POLICY "Brand admins can manage own products" ON products FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Super admin can manage all products" ON products;
CREATE POLICY "Super admin can manage all products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == creator_products ==
DROP POLICY IF EXISTS "Anyone can view creator products" ON creator_products;
CREATE POLICY "Anyone can view creator products" ON creator_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can manage own picks" ON creator_products;
CREATE POLICY "Creators can manage own picks" ON creator_products FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- == orders ==
DROP POLICY IF EXISTS "Brand admins can view brand orders" ON orders;
CREATE POLICY "Brand admins can view brand orders" ON orders FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Brand admins can update brand orders" ON orders;
CREATE POLICY "Brand admins can update brand orders" ON orders FOR UPDATE USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Creators can view own orders" ON orders;
CREATE POLICY "Creators can view own orders" ON orders FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Super admin can manage all orders" ON orders;
CREATE POLICY "Super admin can manage all orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == order_items ==
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE
      brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
      OR creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" ON order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Super admin can manage all order items" ON order_items;
CREATE POLICY "Super admin can manage all order items" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == settlements ==
DROP POLICY IF EXISTS "Users can view own settlements" ON settlements;
CREATE POLICY "Users can view own settlements" ON settlements FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admin can manage all settlements" ON settlements;
CREATE POLICY "Super admin can manage all settlements" ON settlements FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == buyers ==
DROP POLICY IF EXISTS "Buyers can view own profile" ON buyers;
CREATE POLICY "Buyers can view own profile" ON buyers FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Buyers can update own profile" ON buyers;
CREATE POLICY "Buyers can update own profile" ON buyers FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert buyers" ON buyers;
CREATE POLICY "Anyone can insert buyers" ON buyers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Super admin full access buyers" ON buyers;
CREATE POLICY "Super admin full access buyers" ON buyers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == short_urls ==
DROP POLICY IF EXISTS "Anyone can view active short urls" ON short_urls;
CREATE POLICY "Anyone can view active short urls" ON short_urls FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Creators can manage own short urls" ON short_urls;
CREATE POLICY "Creators can manage own short urls" ON short_urls FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Super admin full access short_urls" ON short_urls;
CREATE POLICY "Super admin full access short_urls" ON short_urls FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == mall_subscriptions ==
DROP POLICY IF EXISTS "Buyers can manage own subscriptions" ON mall_subscriptions;
CREATE POLICY "Buyers can manage own subscriptions" ON mall_subscriptions FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Creators can view own subscribers" ON mall_subscriptions;
CREATE POLICY "Creators can view own subscribers" ON mall_subscriptions FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- == community ==
DROP POLICY IF EXISTS "Anyone can view public posts" ON community_posts;
CREATE POLICY "Anyone can view public posts" ON community_posts FOR SELECT USING (is_hidden = false);

DROP POLICY IF EXISTS "Buyers can create posts" ON community_posts;
CREATE POLICY "Buyers can create posts" ON community_posts FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- == reviews ==
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON product_reviews;
CREATE POLICY "Anyone can view approved reviews" ON product_reviews FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Buyers can create reviews" ON product_reviews;
CREATE POLICY "Buyers can create reviews" ON product_reviews FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Super admin full access reviews" ON product_reviews;
CREATE POLICY "Super admin full access reviews" ON product_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == points_history ==
DROP POLICY IF EXISTS "Buyers can view own points history" ON points_history;
CREATE POLICY "Buyers can view own points history" ON points_history FOR SELECT USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- == live_sessions ==
DROP POLICY IF EXISTS "Anyone can view live sessions" ON live_sessions;
CREATE POLICY "Anyone can view live sessions" ON live_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can manage own live sessions" ON live_sessions;
CREATE POLICY "Creators can manage own live sessions" ON live_sessions FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- == legal_content ==
DROP POLICY IF EXISTS "Anyone can view legal content" ON legal_content;
CREATE POLICY "Anyone can view legal content" ON legal_content FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Super admin full access legal" ON legal_content;
CREATE POLICY "Super admin full access legal" ON legal_content FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == wishlist/cart ==
DROP POLICY IF EXISTS "Buyers can manage own wishlist" ON buyer_wishlist;
CREATE POLICY "Buyers can manage own wishlist" ON buyer_wishlist FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Buyers can manage own cart" ON buyer_cart;
CREATE POLICY "Buyers can manage own cart" ON buyer_cart FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- == sample_requests ==
DROP POLICY IF EXISTS "Creators can view own sample requests" ON sample_requests;
CREATE POLICY "Creators can view own sample requests" ON sample_requests FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Creators can insert sample requests" ON sample_requests;
CREATE POLICY "Creators can insert sample requests" ON sample_requests FOR INSERT WITH CHECK (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Brand admins can view brand sample requests" ON sample_requests;
CREATE POLICY "Brand admins can view brand sample requests" ON sample_requests FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Super admin can manage all sample requests" ON sample_requests;
CREATE POLICY "Super admin can manage all sample requests" ON sample_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == support_tickets ==
DROP POLICY IF EXISTS "Brand admins can view own support tickets" ON support_tickets;
CREATE POLICY "Brand admins can view own support tickets" ON support_tickets FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Brand admins can create support tickets" ON support_tickets;
CREATE POLICY "Brand admins can create support tickets" ON support_tickets FOR INSERT WITH CHECK (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Super admin can manage all support tickets" ON support_tickets;
CREATE POLICY "Super admin can manage all support tickets" ON support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- == creator_levels (공개 읽기) ==
DROP POLICY IF EXISTS "Anyone can view creator levels" ON creator_levels;
CREATE POLICY "Anyone can view creator levels" ON creator_levels FOR SELECT USING (true);

-- == conversion_criteria (공개 읽기) ==
DROP POLICY IF EXISTS "Anyone can view conversion criteria" ON conversion_criteria;
CREATE POLICY "Anyone can view conversion criteria" ON conversion_criteria FOR SELECT USING (true);

-- == short_url_analytics (인증된 사용자 쓰기) ==
DROP POLICY IF EXISTS "Anyone can insert analytics" ON short_url_analytics;
CREATE POLICY "Anyone can insert analytics" ON short_url_analytics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Creators can view own analytics" ON short_url_analytics;
CREATE POLICY "Creators can view own analytics" ON short_url_analytics FOR SELECT USING (
  short_url_id IN (
    SELECT id FROM short_urls WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  )
);

-- == product_questions ==
DROP POLICY IF EXISTS "Anyone can view public questions" ON product_questions;
CREATE POLICY "Anyone can view public questions" ON product_questions FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Buyers can create questions" ON product_questions;
CREATE POLICY "Buyers can create questions" ON product_questions FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- == live_products ==
DROP POLICY IF EXISTS "Anyone can view live products" ON live_products;
CREATE POLICY "Anyone can view live products" ON live_products FOR SELECT USING (true);

-- == live_bot_settings ==
DROP POLICY IF EXISTS "Creators can manage own bot settings" ON live_bot_settings;
CREATE POLICY "Creators can manage own bot settings" ON live_bot_settings FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- == live_chat_messages ==
DROP POLICY IF EXISTS "Anyone can view live chat" ON live_chat_messages;
CREATE POLICY "Anyone can view live chat" ON live_chat_messages FOR SELECT USING (is_hidden = false);

DROP POLICY IF EXISTS "Anyone can send live chat" ON live_chat_messages;
CREATE POLICY "Anyone can send live chat" ON live_chat_messages FOR INSERT WITH CHECK (true);

-- == creator_level_history ==
DROP POLICY IF EXISTS "Creators can view own level history" ON creator_level_history;
CREATE POLICY "Creators can view own level history" ON creator_level_history FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- == community_comments ==
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (is_hidden = false);

DROP POLICY IF EXISTS "Buyers can create comments" ON community_comments;
CREATE POLICY "Buyers can create comments" ON community_comments FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- == community_likes ==
DROP POLICY IF EXISTS "Anyone can view likes" ON community_likes;
CREATE POLICY "Anyone can view likes" ON community_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Buyers can manage own likes" ON community_likes;
CREATE POLICY "Buyers can manage own likes" ON community_likes FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- == review_helpful_votes ==
DROP POLICY IF EXISTS "Anyone can view helpful votes" ON review_helpful_votes;
CREATE POLICY "Anyone can view helpful votes" ON review_helpful_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Buyers can manage own votes" ON review_helpful_votes;
CREATE POLICY "Buyers can manage own votes" ON review_helpful_votes FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- == creator_applications ==
DROP POLICY IF EXISTS "Buyers can view own applications" ON creator_applications;
CREATE POLICY "Buyers can view own applications" ON creator_applications FOR SELECT USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Buyers can create applications" ON creator_applications;
CREATE POLICY "Buyers can create applications" ON creator_applications FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Super admin manage applications" ON creator_applications;
CREATE POLICY "Super admin manage applications" ON creator_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);


-- ============================================================
-- STEP 8: 핵심 비즈니스 함수/트리거
-- ============================================================

-- MoCRA 상태 자동 업데이트
CREATE OR REPLACE FUNCTION update_mocra_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE brands
  SET us_sales_ytd = (
    SELECT COALESCE(SUM(total_amount), 0) FROM orders
    WHERE brand_id = NEW.brand_id AND country = 'US'
      AND status IN ('paid', 'shipped', 'completed')
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
  ),
  mocra_status = CASE
    WHEN (SELECT COALESCE(SUM(total_amount), 0) FROM orders
      WHERE brand_id = NEW.brand_id AND country = 'US'
        AND status IN ('paid', 'shipped', 'completed')
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    ) >= 1000000 THEN 'red'
    WHEN (SELECT COALESCE(SUM(total_amount), 0) FROM orders
      WHERE brand_id = NEW.brand_id AND country = 'US'
        AND status IN ('paid', 'shipped', 'completed')
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    ) >= 800000 THEN 'yellow'
    ELSE 'green'
  END
  WHERE id = NEW.brand_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 구매자 크리에이터 전환 자격 확인
CREATE OR REPLACE FUNCTION check_buyer_creator_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  criteria RECORD;
  buyer_data RECORD;
BEGIN
  SELECT * INTO criteria FROM conversion_criteria WHERE is_active = true LIMIT 1;
  SELECT total_orders, total_reviews, total_spent,
    EXTRACT(DAY FROM NOW() - created_at) as account_age_days
  INTO buyer_data FROM buyers WHERE id = NEW.buyer_id;

  IF buyer_data.total_orders >= criteria.min_orders
     AND buyer_data.total_reviews >= criteria.min_reviews
     AND buyer_data.total_spent >= criteria.min_spent
     AND buyer_data.account_age_days >= criteria.min_account_age_days THEN
    UPDATE buyers SET eligible_for_creator = true WHERE id = NEW.buyer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 리뷰 포인트 지급
CREATE OR REPLACE FUNCTION award_review_points()
RETURNS TRIGGER AS $$
DECLARE
  points_amount INTEGER;
  current_balance INTEGER;
BEGIN
  IF NEW.instagram_post_url IS NOT NULL AND NEW.instagram_verified = true THEN
    points_amount := 1000;
  ELSE
    points_amount := 500;
  END IF;

  SELECT points_balance INTO current_balance FROM buyers WHERE id = NEW.buyer_id;

  UPDATE buyers SET
    points_balance = points_balance + points_amount,
    total_points_earned = total_points_earned + points_amount,
    total_reviews = total_reviews + 1
  WHERE id = NEW.buyer_id;

  INSERT INTO points_history (buyer_id, amount, balance_after, type, reference_id, description)
  VALUES (
    NEW.buyer_id, points_amount, COALESCE(current_balance, 0) + points_amount,
    CASE WHEN NEW.instagram_post_url IS NOT NULL THEN 'review_instagram' ELSE 'review_text' END,
    NEW.id,
    CASE WHEN NEW.instagram_post_url IS NOT NULL THEN '인스타그램 리뷰 적립금' ELSE '텍스트 리뷰 적립금' END
  );

  NEW.points_awarded := points_amount;
  NEW.points_awarded_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 크리에이터 레벨 업데이트
CREATE OR REPLACE FUNCTION update_creator_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level TEXT;
BEGIN
  SELECT level_name INTO new_level FROM creator_levels
  WHERE min_points <= NEW.level_points
  ORDER BY min_points DESC LIMIT 1;

  IF new_level IS NOT NULL AND new_level != COALESCE(OLD.level, 'bronze') THEN
    INSERT INTO creator_level_history (creator_id, from_level, to_level, points_at_change, reason)
    VALUES (NEW.id, OLD.level, new_level, NEW.level_points, 'points_threshold');
    NEW.level := new_level;
    NEW.level_updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Short URL 클릭 카운트 증가
CREATE OR REPLACE FUNCTION increment_short_url_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE short_urls SET total_clicks = total_clicks + 1, last_clicked_at = NOW()
  WHERE id = NEW.short_url_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- STEP 9: 트리거 재생성 (IF NOT EXISTS 없으므로 안전하게 DROP + CREATE)
-- ============================================================

-- updated_at 트리거들
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buyers_updated_at ON buyers;
CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON buyers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_short_urls_updated_at ON short_urls;
CREATE TRIGGER update_short_urls_updated_at BEFORE UPDATE ON short_urls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_comments_updated_at ON community_comments;
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_questions_updated_at ON product_questions;
CREATE TRIGGER update_product_questions_updated_at BEFORE UPDATE ON product_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
CREATE TRIGGER update_live_sessions_updated_at BEFORE UPDATE ON live_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_bot_settings_updated_at ON live_bot_settings;
CREATE TRIGGER update_live_bot_settings_updated_at BEFORE UPDATE ON live_bot_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creator_applications_updated_at ON creator_applications;
CREATE TRIGGER update_creator_applications_updated_at BEFORE UPDATE ON creator_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sample_requests_updated_at ON sample_requests;
CREATE TRIGGER update_sample_requests_updated_at BEFORE UPDATE ON sample_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buyer_cart_updated_at ON buyer_cart;
CREATE TRIGGER update_buyer_cart_updated_at BEFORE UPDATE ON buyer_cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_legal_content_updated_at ON legal_content;
CREATE TRIGGER update_legal_content_updated_at BEFORE UPDATE ON legal_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 주문번호 자동 생성
DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- MoCRA 상태 업데이트
DROP TRIGGER IF EXISTS update_mocra_on_order ON orders;
CREATE TRIGGER update_mocra_on_order
  AFTER INSERT OR UPDATE ON orders FOR EACH ROW
  WHEN (NEW.country = 'US' AND NEW.status IN ('paid', 'shipped', 'completed'))
  EXECUTE FUNCTION update_mocra_status();

-- Short URL 클릭 카운트
DROP TRIGGER IF EXISTS increment_clicks_on_analytics ON short_url_analytics;
CREATE TRIGGER increment_clicks_on_analytics
  AFTER INSERT ON short_url_analytics FOR EACH ROW
  EXECUTE FUNCTION increment_short_url_clicks();

-- 리뷰 포인트 지급
DROP TRIGGER IF EXISTS award_points_on_review ON product_reviews;
CREATE TRIGGER award_points_on_review
  BEFORE INSERT ON product_reviews FOR EACH ROW
  WHEN (NEW.is_approved = true)
  EXECUTE FUNCTION award_review_points();

-- 크리에이터 레벨 업데이트
DROP TRIGGER IF EXISTS update_level_on_points_change ON creators;
CREATE TRIGGER update_level_on_points_change
  BEFORE UPDATE OF level_points ON creators FOR EACH ROW
  EXECUTE FUNCTION update_creator_level();

-- 구매자 크리에이터 전환 자격
DROP TRIGGER IF EXISTS check_eligibility_after_order ON orders;
CREATE TRIGGER check_eligibility_after_order
  AFTER UPDATE ON orders FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION check_buyer_creator_eligibility();


-- ============================================================
-- STEP 10: 주요 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_creator_products_creator_id ON creator_products(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_products_product_id ON creator_products(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_settlements_user_id ON settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON buyers(user_id);
CREATE INDEX IF NOT EXISTS idx_short_urls_creator ON short_urls(creator_id);
CREATE INDEX IF NOT EXISTS idx_short_url_analytics_url ON short_url_analytics(short_url_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_creator ON community_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_points_history_buyer ON points_history(buyer_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_creator ON live_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_creator_id ON sample_requests(creator_id);


-- ============================================================
-- 완료! 실행 후 diagnostic.sql로 검증하세요
-- ============================================================
SELECT '모든 설정이 완료되었습니다. diagnostic.sql을 실행하여 검증하세요.' AS result;
