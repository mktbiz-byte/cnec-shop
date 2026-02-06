-- ============================================================
-- KviewShop Supabase 전체 진단 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- ============================================================
-- 1. 필수 테이블 존재 여부 확인
-- ============================================================
SELECT '=== 1. 테이블 존재 여부 ===' AS section;

SELECT
  t.required_table,
  CASE WHEN c.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM (VALUES
  ('users'),
  ('brands'),
  ('creators'),
  ('buyers'),
  ('products'),
  ('creator_products'),
  ('orders'),
  ('order_items'),
  ('settlements'),
  ('points_history'),
  ('short_urls'),
  ('short_url_analytics'),
  ('mall_subscriptions'),
  ('live_sessions'),
  ('live_products'),
  ('live_bot_settings'),
  ('live_chat_messages'),
  ('community_posts'),
  ('community_comments'),
  ('community_likes'),
  ('product_questions'),
  ('product_reviews'),
  ('review_helpful_votes'),
  ('creator_applications'),
  ('creator_levels'),
  ('creator_level_history'),
  ('sample_requests'),
  ('support_tickets'),
  ('legal_content'),
  ('conversion_criteria'),
  ('buyer_wishlist'),
  ('buyer_cart')
) AS t(required_table)
LEFT JOIN information_schema.tables c
  ON c.table_schema = 'public'
  AND c.table_name = t.required_table
ORDER BY status DESC, t.required_table;


-- ============================================================
-- 2. RLS(Row Level Security) 활성화 여부 확인
-- ============================================================
SELECT '=== 2. RLS 활성화 여부 ===' AS section;

SELECT
  t.required_table,
  CASE WHEN c.relrowsecurity THEN 'RLS ON' ELSE 'RLS OFF' END AS rls_status
FROM (VALUES
  ('users'), ('brands'), ('creators'), ('buyers'),
  ('products'), ('creator_products'), ('orders'), ('order_items'),
  ('settlements'), ('points_history'), ('short_urls'), ('short_url_analytics'),
  ('mall_subscriptions'), ('live_sessions'), ('live_products'),
  ('live_bot_settings'), ('live_chat_messages'),
  ('community_posts'), ('community_comments'), ('community_likes'),
  ('product_questions'), ('product_reviews'), ('review_helpful_votes'),
  ('creator_applications'), ('creator_levels'), ('creator_level_history'),
  ('sample_requests'), ('support_tickets'), ('legal_content'),
  ('conversion_criteria'), ('buyer_wishlist'), ('buyer_cart')
) AS t(required_table)
LEFT JOIN pg_class c ON c.relname = t.required_table
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY rls_status, t.required_table;


-- ============================================================
-- 3. 스토리지 버킷 존재 여부 확인
-- ============================================================
SELECT '=== 3. 스토리지 버킷 ===' AS section;

SELECT
  t.required_bucket,
  CASE WHEN b.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status,
  COALESCE(b.public::text, 'N/A') AS is_public
FROM (VALUES ('products'), ('profiles')) AS t(required_bucket)
LEFT JOIN storage.buckets b ON b.id = t.required_bucket;


-- ============================================================
-- 4. 스토리지 정책 확인
-- ============================================================
SELECT '=== 4. 스토리지 RLS 정책 ===' AS section;

SELECT
  policyname AS policy_name,
  tablename AS table_name,
  cmd AS operation,
  qual IS NOT NULL AS has_select_check,
  with_check IS NOT NULL AS has_write_check
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;


-- ============================================================
-- 5. 필수 함수/트리거 존재 여부
-- ============================================================
SELECT '=== 5. 데이터베이스 함수 ===' AS section;

SELECT
  t.required_function,
  CASE WHEN p.proname IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM (VALUES
  ('update_updated_at_column'),
  ('generate_order_number'),
  ('update_mocra_status'),
  ('check_buyer_creator_eligibility'),
  ('award_review_points'),
  ('update_creator_level'),
  ('increment_short_url_clicks')
) AS t(required_function)
LEFT JOIN pg_proc p
  ON p.proname = t.required_function
  AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');


SELECT '=== 5b. 트리거 ===' AS section;

SELECT
  trigger_name,
  event_object_table AS table_name,
  event_manipulation AS event,
  action_timing AS timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- ============================================================
-- 6. 주요 테이블 컬럼 검증 (creators 테이블)
-- ============================================================
SELECT '=== 6. creators 테이블 컬럼 ===' AS section;

SELECT
  t.required_column,
  CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status,
  COALESCE(c.data_type, 'N/A') AS data_type
FROM (VALUES
  ('id'), ('user_id'), ('username'), ('display_name'), ('bio'),
  ('theme_color'), ('background_color'), ('text_color'),
  ('profile_image'), ('instagram'), ('youtube'), ('tiktok'),
  ('community_enabled'), ('community_type'), ('shop_settings'),
  ('level'), ('total_points'), ('commission_rate'),
  ('shipping_countries'), ('certifications')
) AS t(required_column)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = 'creators'
  AND c.column_name = t.required_column
ORDER BY status DESC, t.required_column;


-- ============================================================
-- 7. 주요 테이블 컬럼 검증 (products 테이블)
-- ============================================================
SELECT '=== 7. products 테이블 컬럼 ===' AS section;

SELECT
  t.required_column,
  CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status,
  COALESCE(c.data_type, 'N/A') AS data_type
FROM (VALUES
  ('id'), ('brand_id'), ('name'), ('name_ko'), ('description'), ('description_ko'),
  ('price'), ('currency'), ('category'), ('subcategory'),
  ('thumbnail_url'), ('images'), ('status'), ('stock_quantity'),
  ('commission_rate'), ('is_featured'), ('mocra_status'),
  ('us_sales_count'), ('certifications'), ('ingredients'),
  ('tier_pricing')
) AS t(required_column)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = 'products'
  AND c.column_name = t.required_column
ORDER BY status DESC, t.required_column;


-- ============================================================
-- 8. 주요 테이블 컬럼 검증 (orders 테이블)
-- ============================================================
SELECT '=== 8. orders 테이블 컬럼 ===' AS section;

SELECT
  t.required_column,
  CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status,
  COALESCE(c.data_type, 'N/A') AS data_type
FROM (VALUES
  ('id'), ('order_number'), ('buyer_id'), ('creator_id'),
  ('status'), ('total_amount'), ('commission_amount'),
  ('shipping_address'), ('shipping_country'), ('tracking_number'),
  ('created_at'), ('updated_at')
) AS t(required_column)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = 'orders'
  AND c.column_name = t.required_column
ORDER BY status DESC, t.required_column;


-- ============================================================
-- 9. 주요 테이블 컬럼 검증 (buyers 테이블)
-- ============================================================
SELECT '=== 9. buyers 테이블 컬럼 ===' AS section;

SELECT
  t.required_column,
  CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status,
  COALESCE(c.data_type, 'N/A') AS data_type
FROM (VALUES
  ('id'), ('user_id'), ('display_name'), ('email'),
  ('phone'), ('total_points'), ('available_points'),
  ('shipping_address'), ('preferred_language'),
  ('created_at'), ('updated_at')
) AS t(required_column)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = 'buyers'
  AND c.column_name = t.required_column
ORDER BY status DESC, t.required_column;


-- ============================================================
-- 10. RLS 정책 테이블별 갯수 확인
-- ============================================================
SELECT '=== 10. 테이블별 RLS 정책 수 ===' AS section;

SELECT
  tablename AS table_name,
  COUNT(*) AS policy_count,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) AS select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) AS insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) AS update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) AS delete_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;


-- ============================================================
-- 11. 외래키 관계 확인
-- ============================================================
SELECT '=== 11. 외래키 관계 ===' AS section;

SELECT
  tc.table_name AS from_table,
  kcu.column_name AS from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;


-- ============================================================
-- 12. 인덱스 확인
-- ============================================================
SELECT '=== 12. 인덱스 ===' AS section;

SELECT
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ============================================================
-- 13. 데이터 현황 (각 테이블 행 수)
-- ============================================================
SELECT '=== 13. 테이블 데이터 현황 ===' AS section;

SELECT schemaname, relname AS table_name, n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;


-- ============================================================
-- 14. auth.users 연동 확인
-- ============================================================
SELECT '=== 14. Auth 사용자 현황 ===' AS section;

SELECT
  COUNT(*) AS total_auth_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) AS confirmed_users,
  COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) AS signed_in_users
FROM auth.users;
