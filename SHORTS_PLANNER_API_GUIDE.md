# 숏폼 기획안 생성기 API 가이드

## 개요

이 문서는 숏폼 기획안 생성기의 백엔드 API 사용 방법을 설명합니다.

## API 엔드포인트

### 1. YouTube Shorts 기획안 생성

**POST** `/api/shorts-planner/generate`

#### 요청 본문 (Request Body)

```json
{
  "channel_url": "https://www.youtube.com/@채널명",
  "topic": "영상 주제",
  "keywords": "키워드1, 키워드2",
  "length": "30초",
  "brand_name": "브랜드/상품명",
  "product_features": "상품 특징",
  "main_content": "영상 주요내용",
  "required_content": "크리에이터가 꼭 넣어야 할 내용"
}
```

#### 응답 (Response)

```json
{
  "plan_id": 1,
  "channel_info": {
    "name": "채널명",
    "subscribers": 10000,
    "shorts_count": 5
  },
  "plan": "생성된 기획안 마크다운 텍스트..."
}
```

---

### 2. Instagram Reels 기획안 생성

**POST** `/api/instagram-planner/generate`

#### 요청 본문 (Request Body)

```json
{
  "account_name": "인스타그램 계정명",
  "topic": "영상 주제",
  "keywords": "키워드1, 키워드2",
  "length": "30초",
  "brand_name": "브랜드/상품명",
  "product_features": "상품 특징",
  "main_content": "영상 주요내용",
  "required_content": "크리에이터가 꼭 넣어야 할 내용"
}
```

#### 응답 (Response)

```json
{
  "plan_id": 2,
  "account_name": "인스타그램 계정명",
  "plan": "생성된 기획안 마크다운 텍스트..."
}
```

---

### 3. 기획안 목록 조회

**GET** `/api/shorts-planner/plans` - YouTube Shorts 기획안 목록
**GET** `/api/instagram-planner/plans` - Instagram Reels 기획안 목록

#### 응답 (Response)

```json
{
  "plans": [
    {
      "id": 1,
      "user_id": "user123",
      "plan_type": "youtube",
      "topic": "영상 주제",
      "brand_name": "브랜드명",
      "plan_content": "기획안 내용...",
      "created_at": "2025-10-23T00:00:00",
      "updated_at": "2025-10-23T00:00:00"
    }
  ]
}
```

---

### 4. 특정 기획안 조회

**GET** `/api/shorts-planner/plans/{plan_id}` - YouTube Shorts 기획안
**GET** `/api/instagram-planner/plans/{plan_id}` - Instagram Reels 기획안

#### 응답 (Response)

```json
{
  "id": 1,
  "user_id": "user123",
  "plan_type": "youtube",
  "channel_url": "https://www.youtube.com/@채널명",
  "topic": "영상 주제",
  "keywords": "키워드",
  "length": "30초",
  "brand_name": "브랜드/상품명",
  "product_features": "상품 특징",
  "main_content": "영상 주요내용",
  "required_content": "크리에이터가 꼭 넣어야 할 내용",
  "plan_content": "생성된 기획안...",
  "created_at": "2025-10-23T00:00:00",
  "updated_at": "2025-10-23T00:00:00"
}
```

---

### 5. 기획안 수정

**PUT** `/api/shorts-planner/plans/{plan_id}` - YouTube Shorts 기획안
**PUT** `/api/instagram-planner/plans/{plan_id}` - Instagram Reels 기획안

#### 요청 본문 (Request Body)

```json
{
  "topic": "수정된 주제",
  "brand_name": "수정된 브랜드명",
  "plan_content": "수정된 기획안 내용..."
}
```

#### 응답 (Response)

```json
{
  "message": "기획안이 수정되었습니다",
  "plan": {
    "id": 1,
    "topic": "수정된 주제",
    ...
  }
}
```

---

### 6. 기획안 삭제

**DELETE** `/api/shorts-planner/plans/{plan_id}` - YouTube Shorts 기획안
**DELETE** `/api/instagram-planner/plans/{plan_id}` - Instagram Reels 기획안

#### 응답 (Response)

```json
{
  "message": "기획안이 삭제되었습니다"
}
```

---

## 프론트엔드 구현 가이드

### 1. 기획안 생성 페이지

- `/video-planner` - YouTube Shorts 기획안 생성기 (기존)
- `/instagram-planner` - Instagram Reels 기획안 생성기 (신규)

**필요한 입력 필드:**
- 채널 URL / 계정명
- 영상 주제 (필수)
- 키워드 (선택)
- 숏폼 길이 (15초/30초/60초)
- **브랜드/상품명** (신규)
- **상품 특징** (신규)
- **영상 주요내용** (신규)
- **크리에이터가 꼭 넣어야 할 내용** (신규)

### 2. 기획안 보기 페이지 (브랜드 숏폼 가이드)

- `/shorts-plan/{plan_id}` - 생성된 기획안 보기
- `/instagram-plan/{plan_id}` - 생성된 인스타그램 기획안 보기

**기능:**
- 기획안 내용 표시 (마크다운 렌더링)
- **Edit 버튼** - 기획안 수정 모드 전환
- 수정 모드에서 `plan_content` 직접 편집 가능
- 저장 버튼 클릭 시 PUT 요청으로 업데이트
- 고객사용 보고서 형태의 깔끔한 UI

**디자인 제안:**
- 브랜드 컬러 사용
- 섹션별 구분선
- 인쇄 가능한 레이아웃
- PDF 다운로드 기능 (선택사항)

### 3. 기획안 목록 페이지

- `/my-plans` - 내가 생성한 모든 기획안 목록

**기능:**
- YouTube / Instagram 탭으로 구분
- 각 기획안 카드에 주제, 브랜드명, 생성일 표시
- 클릭 시 상세 페이지로 이동

---

## 데이터베이스 스키마

### shorts_plans 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | INTEGER | 기본키 |
| user_id | STRING | 사용자 ID |
| plan_type | STRING | 'youtube' 또는 'instagram' |
| channel_url | TEXT | YouTube 채널 URL |
| account_name | STRING | Instagram 계정명 |
| topic | TEXT | 영상 주제 |
| keywords | TEXT | 키워드 |
| length | STRING | 영상 길이 |
| brand_name | TEXT | 브랜드/상품명 |
| product_features | TEXT | 상품 특징 |
| main_content | TEXT | 영상 주요내용 |
| required_content | TEXT | 크리에이터 필수 내용 |
| plan_content | TEXT | 생성된 기획안 |
| created_at | DATETIME | 생성일시 |
| updated_at | DATETIME | 수정일시 |

---

## 인증

모든 API는 세션 기반 인증을 사용합니다.
- `special_user_id`가 세션에 있어야 접근 가능
- 로그인하지 않은 경우 401 Unauthorized 응답

---

## 에러 처리

### 일반적인 에러 응답

```json
{
  "error": "에러 메시지"
}
```

### HTTP 상태 코드

- `200` - 성공
- `400` - 잘못된 요청 (필수 필드 누락 등)
- `401` - 인증 필요
- `404` - 리소스를 찾을 수 없음
- `500` - 서버 내부 오류
- `503` - 서비스 이용 불가 (API 키 없음 등)

