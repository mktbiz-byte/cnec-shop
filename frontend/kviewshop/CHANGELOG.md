# 변경 이력 (Changelog)

모든 주요 변경 사항이 이 파일에 기록됩니다.

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)

---

## [1.0.0] - 2026-02-03

### 추가 (Added)
- 브랜드 수수료 설정 페이지 (`/brand/settings`)
  - 기본 수수료율 슬라이더 (5-50%)
  - 등급별 차등 수수료 (일반/실버/골드/VIP)
  - 정산 주기 설정 (주간/격주/월간)
  - 최소 정산 금액 설정
  - 정산 계좌 정보 입력

- 크리에이터 설정 페이지 (`/creator/settings`)
  - 프로필 정보 (이름, 이메일, 전화번호, 거주국가)
  - 정산 방법 선택 (PayPal / 해외송금)
  - PayPal 이메일 입력
  - 해외송금 정보 (은행명, SWIFT, 계좌번호)
  - 알림 설정 (이메일/주문/정산)

- 상품 이미지 업로드 기능
  - `ImageUpload` 컴포넌트
  - Supabase Storage 연동
  - 드래그 앤 드롭 지원
  - 썸네일 (1장) + 상세이미지 (최대 10장)

- 정산 내보내기 기능 (`/admin/settlements`)
  - Excel (CSV) 다운로드
  - PDF 인보이스 생성
  - 전체/대기중/완료 필터별 내보내기

- UI 컴포넌트
  - `Slider` (슬라이더)

### 변경 (Changed)
- 상품 등록 폼 개선
  - 탭 형식으로 재구성 (기본정보/상세설명/이미지/설정)
  - 다국어 입력 지원 (한국어/영어/일본어)
  - 가격 다중 통화 입력 (KRW/USD/JPY)

- 관리자 정산 페이지 개선
  - 테이블 형식 정산 목록
  - 상태별 뱃지 (대기중/처리중/완료/실패)
  - 개별 PDF 인보이스 출력

### 수정 (Fixed)
- 크리에이터/브랜드 페이지 무한 로딩 버그 수정
  - try/catch/finally 에러 핸들링 추가

- 모든 페이지 한국어 번역 누락 수정
  - 관리자 정산 페이지
  - 브랜드 주문/정산 페이지
  - 크리에이터 대시보드/주문/정산/상품/샵 페이지

### 제거 (Removed)
- 모든 페이지에서 가상(Mock) 데이터 제거
- 크리에이터 샵 페이지 기본값 제거 (빈 폼으로 시작)

### 보안 (Security)
- 해외 크리에이터 3.3% 원천징수세 미적용 명시
- Supabase RLS 정책 안내 추가

---

## [0.9.0] - 2026-02-03

### 추가 (Added)
- 초기 플랫폼 구축
- 관리자/브랜드/크리에이터 3-tier 시스템
- MoCRA 모니터링 페이지
- 다국어 지원 (ko, en, ja)
- 다크 테마 + 골드 강조색

---

## 파일 변경 내역

### 2026-02-03

#### 생성된 파일
| 파일 | 설명 |
|------|------|
| `src/app/[locale]/(brand)/brand/settings/page.tsx` | 브랜드 설정 페이지 |
| `src/app/[locale]/(creator)/creator/settings/page.tsx` | 크리에이터 설정 페이지 |
| `src/components/ui/image-upload.tsx` | 이미지 업로드 컴포넌트 |
| `src/components/ui/slider.tsx` | 슬라이더 컴포넌트 |
| `src/lib/export/settlements.ts` | 정산 내보내기 유틸리티 |
| `src/lib/supabase/storage.ts` | Supabase Storage 유틸리티 |
| `PLATFORM_DOCS.md` | 플랫폼 문서 |
| `CHANGELOG.md` | 변경 이력 |

#### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/app/[locale]/(admin)/admin/settlements/page.tsx` | 테이블 UI + 내보내기 기능 |
| `src/app/[locale]/(admin)/admin/creators/page.tsx` | 에러 핸들링 + 한국어 |
| `src/app/[locale]/(admin)/admin/brands/page.tsx` | 에러 핸들링 + 한국어 |
| `src/app/[locale]/(brand)/brand/products/page.tsx` | 이미지 업로드 + 탭 UI |
| `src/app/[locale]/(brand)/brand/orders/page.tsx` | 한국어 번역 |
| `src/app/[locale]/(brand)/brand/settlements/page.tsx` | 한국어 번역 |
| `src/app/[locale]/(creator)/creator/dashboard/page.tsx` | 한국어 번역 |
| `src/app/[locale]/(creator)/creator/orders/page.tsx` | 한국어 번역 |
| `src/app/[locale]/(creator)/creator/products/page.tsx` | 한국어 번역 |
| `src/app/[locale]/(creator)/creator/settlements/page.tsx` | 한국어 번역 |
| `src/app/[locale]/(creator)/creator/shop/page.tsx` | 목업 데이터 제거 + 한국어 |

---

## 알려진 이슈

### 해결 필요
- [ ] Supabase Storage 버킷 수동 생성 필요
- [ ] 이미지 업로드 시 brand_id 동적 할당 필요
- [ ] 정산 PDF에 실제 브랜드 로고 추가 필요

### 개선 예정
- [ ] 이미지 리사이징/최적화
- [ ] 정산 자동 계산 로직
- [ ] 실시간 알림 시스템
