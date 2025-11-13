# 크리에이터 프로필 및 협찬 중개 시스템 스키마

## 1. creator_profiles (크리에이터 프로필)

```sql
CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,  -- URL용 (@username)
  
  -- 기본 정보
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  
  -- 채널 정보
  youtube_channel_id VARCHAR(100),
  youtube_channel_url TEXT,
  subscriber_count INTEGER DEFAULT 0,
  average_views INTEGER DEFAULT 0,
  
  -- 협찬 정보
  sponsorship_rate INTEGER NOT NULL,  -- 협찬 단가 (원)
  sponsorship_available BOOLEAN DEFAULT true,
  preferred_categories TEXT[],  -- 선호 브랜드/카테고리
  
  -- 연락처
  email VARCHAR(255),
  contact_method VARCHAR(50),  -- 'email', 'instagram', 'kakao' 등
  contact_value VARCHAR(255),
  
  -- 대표 영상 (최대 5개)
  featured_videos JSONB DEFAULT '[]'::jsonb,
  -- [{"video_id": "xxx", "title": "...", "thumbnail": "...", "views": 123}]
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false,  -- 인증 여부
  is_active BOOLEAN DEFAULT true
);

-- 인덱스
CREATE INDEX idx_creator_username ON creator_profiles(username);
CREATE INDEX idx_creator_active ON creator_profiles(is_active);
CREATE INDEX idx_creator_sponsorship ON creator_profiles(sponsorship_available);
```

## 2. sponsorship_requests (협찬 중개 요청)

```sql
CREATE TABLE sponsorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  
  -- 요청 정보
  requested_rate INTEGER NOT NULL,  -- 희망 협찬 단가
  preferred_brands TEXT[],  -- 선호 브랜드
  message TEXT,  -- 추가 메시지
  
  -- 상태 관리
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'cancelled'
  admin_notes TEXT,  -- 관리자 메모
  
  -- 성사 정보 (완료 시)
  final_rate INTEGER,  -- 최종 협찬비
  commission_rate DECIMAL(5,2) DEFAULT 30.00,  -- 수수료율 (%)
  commission_amount INTEGER,  -- 수수료 금액
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_sponsorship_creator ON sponsorship_requests(creator_id);
CREATE INDEX idx_sponsorship_status ON sponsorship_requests(status);
CREATE INDEX idx_sponsorship_created ON sponsorship_requests(created_at DESC);
```

## 3. 주요 기능

### 크리에이터 프로필 페이지 (`/@username`)
- 프로필 정보 표시
- 대표 영상 갤러리
- 채널 통계
- **협찬 단가 명시**
- **"협찬 중개 요청" 버튼**

### 협찬 중개 요청 플로우
1. 크리에이터가 "협찬 중개 요청" 버튼 클릭
2. 수수료 안내 모달 표시:
   - "CnecPlus가 기업과 연결해드립니다"
   - "성사 시 협찬비의 30% 수수료"
3. 요청 폼 작성:
   - 희망 협찬 단가 (기본값: 프로필에 설정된 단가)
   - 선호 브랜드/카테고리
   - 추가 메시지
4. 요청 제출 → 관리자 대시보드에 표시

### 관리자 대시보드
- 중개 요청 목록 (상태별 필터)
- 크리에이터 정보 + 단가 확인
- 상태 업데이트 (대기 → 진행중 → 완료)
- 최종 협찬비 입력 → 수수료 자동 계산

## 4. API 엔드포인트

### 크리에이터 프로필
- `GET /api/creators/@{username}` - 프로필 조회
- `POST /api/creators` - 프로필 생성
- `PUT /api/creators/@{username}` - 프로필 수정

### 협찬 중개
- `POST /api/sponsorship-requests` - 중개 요청 생성
- `GET /api/sponsorship-requests` - 요청 목록 조회 (관리자)
- `PUT /api/sponsorship-requests/{id}` - 요청 상태 업데이트 (관리자)

## 5. 프론트엔드 페이지

### 공개 페이지
- `/@{username}` - 크리에이터 프로필 페이지

### 크리에이터 페이지
- `/profile/edit` - 프로필 편집
- `/profile/sponsorship` - 내 중개 요청 내역

### 관리자 페이지
- `/admin/sponsorships` - 중개 요청 관리
- `/admin/creators` - 크리에이터 목록
