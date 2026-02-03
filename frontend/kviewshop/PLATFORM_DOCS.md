# KviewShop 플랫폼 문서

> **마지막 업데이트**: 2026-02-03
> **버전**: 1.0.0

---

## 목차

1. [플랫폼 개요](#플랫폼-개요)
2. [기술 스택](#기술-스택)
3. [사용자 역할](#사용자-역할)
4. [페이지 구조](#페이지-구조)
5. [데이터베이스 스키마](#데이터베이스-스키마)
6. [Supabase 설정](#supabase-설정)
7. [주요 기능](#주요-기능)
8. [테스트 계정](#테스트-계정)
9. [변경 이력](#변경-이력)

---

## 플랫폼 개요

**KviewShop (케이뷰샵)**은 K-Beauty 제품을 해외 인플루언서를 통해 글로벌 시장에 판매하는 Data-Driven Global Beauty Incubator 플랫폼입니다.

### 핵심 컨셉
- 인플루언서 기반 프라이빗 커머스 플랫폼
- 타겟 시장: 일본, 미국
- MoCRA 규정 준수 (미국 화장품 판매 모니터링)

### URL
- **배포 URL**: https://cnecshop.netlify.app
- **로컬 개발**: http://localhost:3000

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | Next.js 16.1.6 (App Router) |
| **스타일링** | Tailwind CSS 4 |
| **UI 컴포넌트** | shadcn/ui + Radix UI |
| **데이터베이스** | Supabase (PostgreSQL) |
| **인증** | Supabase Auth |
| **스토리지** | Supabase Storage |
| **다국어** | next-intl (ko, en, ja) |
| **아이콘** | Lucide React |
| **알림** | Sonner |

### 디자인 시스템
- **테마**: 다크 모드 기본
- **강조색**: 골드 (#d4af37)
- **폰트**: Pretendard (본문), Outfit (헤드라인)

---

## 사용자 역할

### 1. Super Admin (통합 관리자)
- 전체 플랫폼 관리
- 브랜드/크리에이터 승인 및 관리
- 전체 정산 관리
- 시스템 설정

### 2. Brand Admin (브랜드 관리자)
- 상품 등록 및 관리
- 주문 확인
- MoCRA 모니터링
- 크리에이터 수수료 설정
- 정산 내역 확인

### 3. Creator (크리에이터)
- 개인 샵 운영
- 상품 선택 (Pick)
- 주문 확인
- 수익 관리

---

## 페이지 구조

### 공통 페이지
| 경로 | 설명 |
|------|------|
| `/[locale]/login` | 로그인 페이지 |
| `/[locale]/signup` | 회원가입 페이지 |

### 관리자 페이지 (`/[locale]/admin/*`)
| 경로 | 설명 | 파일 |
|------|------|------|
| `/admin/dashboard` | 대시보드 | `(admin)/admin/dashboard/page.tsx` |
| `/admin/brands` | 브랜드 관리 | `(admin)/admin/brands/page.tsx` |
| `/admin/creators` | 크리에이터 관리 | `(admin)/admin/creators/page.tsx` |
| `/admin/settlements` | 정산 관리 | `(admin)/admin/settlements/page.tsx` |
| `/admin/settings` | 시스템 설정 | `(admin)/admin/settings/page.tsx` |

### 브랜드 페이지 (`/[locale]/brand/*`)
| 경로 | 설명 | 파일 |
|------|------|------|
| `/brand/dashboard` | 대시보드 | `(brand)/brand/dashboard/page.tsx` |
| `/brand/products` | 상품 관리 | `(brand)/brand/products/page.tsx` |
| `/brand/orders` | 주문 관리 | `(brand)/brand/orders/page.tsx` |
| `/brand/mocra` | MoCRA 모니터링 | `(brand)/brand/mocra/page.tsx` |
| `/brand/settlements` | 정산 내역 | `(brand)/brand/settlements/page.tsx` |
| `/brand/settings` | 브랜드 설정 | `(brand)/brand/settings/page.tsx` |

### 크리에이터 페이지 (`/[locale]/creator/*`)
| 경로 | 설명 | 파일 |
|------|------|------|
| `/creator/dashboard` | 대시보드 | `(creator)/creator/dashboard/page.tsx` |
| `/creator/shop` | 샵 꾸미기 | `(creator)/creator/shop/page.tsx` |
| `/creator/products` | 상품 선택 | `(creator)/creator/products/page.tsx` |
| `/creator/orders` | 주문 내역 | `(creator)/creator/orders/page.tsx` |
| `/creator/settlements` | 수익 관리 | `(creator)/creator/settlements/page.tsx` |
| `/creator/settings` | 계정 설정 | `(creator)/creator/settings/page.tsx` |

---

## 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'brand_admin', 'creator')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### brands 테이블
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  business_number TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  -- 수수료 설정
  creator_commission_rate INTEGER DEFAULT 20,
  enable_tiered_commission BOOLEAN DEFAULT FALSE,
  tier1_rate INTEGER DEFAULT 15,
  tier2_rate INTEGER DEFAULT 20,
  tier3_rate INTEGER DEFAULT 25,
  tier4_rate INTEGER DEFAULT 30,
  -- 정산 설정
  settlement_cycle TEXT DEFAULT 'monthly',
  minimum_payout INTEGER DEFAULT 50,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### creators 테이블
```sql
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  country TEXT NOT NULL,
  bio TEXT,
  theme_color TEXT DEFAULT '#d4af37',
  instagram TEXT,
  youtube TEXT,
  tiktok TEXT,
  -- 정산 정보
  payment_method TEXT DEFAULT 'paypal',
  paypal_email TEXT,
  bank_name TEXT,
  account_number TEXT,
  swift_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### products 테이블
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  name_ko TEXT NOT NULL,
  name_en TEXT,
  name_ja TEXT,
  description_ko TEXT,
  description_en TEXT,
  description_ja TEXT,
  price_krw INTEGER NOT NULL,
  price_usd INTEGER,
  price_jpy INTEGER,
  stock INTEGER DEFAULT 0,
  is_cosmetic BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  thumbnail_url TEXT,
  detail_images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### orders 테이블
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES creators(id),
  product_id UUID REFERENCES products(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_country TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### settlements 테이블
```sql
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_name TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('creator', 'brand')),
  recipient_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
```

---

## Supabase 설정

### 환경 변수 (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Storage 버킷 설정
```sql
-- products 버킷 생성 (이미지 저장용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true);

-- 정책 설정 (인증된 사용자 업로드 허용)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'products');
```

### RLS 정책 (Row Level Security)
```sql
-- 모든 테이블에 RLS 비활성화 (개발용)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE creators DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE settlements DISABLE ROW LEVEL SECURITY;
```

---

## 주요 기능

### 1. 수수료 설정 (브랜드)
- **위치**: `/brand/settings` > 수수료 설정 탭
- **기본 수수료**: 5-50% 슬라이더 조절
- **등급별 차등 수수료**:
  - 일반 크리에이터: 15%
  - 실버 크리에이터: 20%
  - 골드 크리에이터: 25%
  - VIP 크리에이터: 30%

### 2. 상품 이미지 업로드
- **위치**: `/brand/products` > 상품 등록 > 이미지 탭
- **썸네일**: 1장 (대표 이미지)
- **상세 이미지**: 최대 10장
- **지원 형식**: PNG, JPG, WEBP
- **저장소**: Supabase Storage (`products` 버킷)

### 3. 정산 내보내기
- **위치**: `/admin/settlements`
- **Excel 내보내기**: CSV 형식, 한글 헤더 포함
- **PDF 인보이스**: 브라우저 인쇄 기능 활용
- **필터**: 전체 / 대기중 / 완료

### 4. 해외 크리에이터 정산
- **원천징수세 미적용**: 해외 크리에이터는 3.3% 원천징수 없음
- **정산 방법**: PayPal 또는 해외 송금 (SWIFT/IBAN)
- **정산 통화**: USD
- **최소 정산 금액**: $50
- **정산 주기**: 월 1회 (매월 15일)

### 5. MoCRA 모니터링
- **위치**: `/brand/mocra`
- **경고 기준**: 미국 매출 $800,000 초과 시 노란색
- **위험 기준**: 미국 매출 $1,000,000 초과 시 빨간색
- **FDA 등록 필요**: 연간 $1,000,000 초과 시

---

## 테스트 계정

### API 엔드포인트
`/api/seed` - 테스트 계정 생성

### 계정 정보
| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@kviewshop.com | admin123!@# |
| 브랜드 | brand@kviewshop.com | brand123!@# |
| 크리에이터 | creator@kviewshop.com | creator123!@# |

> **참고**: Supabase Authentication에서 직접 생성 권장

---

## 변경 이력

### 2026-02-03 (v1.0.0)

#### 추가된 기능
- [x] 브랜드 수수료 설정 페이지 (`/brand/settings`)
  - 기본 수수료율 슬라이더
  - 등급별 차등 수수료
  - 정산 주기 설정
  - 계좌 정보 입력

- [x] 크리에이터 설정 페이지 (`/creator/settings`)
  - 프로필 설정
  - 정산 정보 (PayPal/해외송금)
  - 알림 설정

- [x] 상품 이미지 업로드
  - `ImageUpload` 컴포넌트 생성
  - Supabase Storage 연동 (`storage.ts`)
  - 드래그 & 드롭 지원

- [x] 정산 내보내기 (`/lib/export/settlements.ts`)
  - Excel (CSV) 내보내기
  - PDF 인보이스 생성

- [x] UI 컴포넌트
  - `Slider` 컴포넌트 추가

#### 수정된 사항
- [x] 모든 페이지 한국어 번역 완료
- [x] 가상 데이터 제거 (Supabase 실제 데이터 연동)
- [x] 무한 로딩 버그 수정 (에러 핸들링 추가)
- [x] 해외 크리에이터 3.3% 원천징수세 미적용 명시

#### 생성된 파일
```
src/
├── app/[locale]/
│   ├── (brand)/brand/settings/page.tsx    # 브랜드 설정
│   └── (creator)/creator/settings/page.tsx # 크리에이터 설정
├── components/ui/
│   ├── image-upload.tsx                    # 이미지 업로드 컴포넌트
│   └── slider.tsx                          # 슬라이더 컴포넌트
└── lib/
    ├── export/settlements.ts               # 정산 내보내기
    └── supabase/storage.ts                 # 스토리지 유틸리티
```

---

## 향후 계획

- [ ] 실제 결제 연동 (Stripe/PayPal)
- [ ] 배송 추적 시스템
- [ ] 크리에이터 샵 공개 페이지
- [ ] 고객용 구매 페이지
- [ ] 알림 시스템 (이메일/푸시)
- [ ] 분석 대시보드 강화

---

## 문의

- **GitHub Issues**: https://github.com/mktbiz-byte/cnecplus/issues
- **개발자**: Claude Code Assistant
