# CnecPlus AI - 뷰티 크리에이터 성장 플랫폼

**AI 기반 떡상 예측 및 주간 뉴스레터 시스템**

뷰티 크리에이터를 위한 데이터 기반 성장 컨설팅 플랫폼입니다. YouTube Data API를 활용하여 트렌드를 분석하고, AI가 영상의 성공 확률을 예측하며, 매주 성장 인사이트를 이메일로 제공합니다.

## 주요 기능

### 🎯 AI 떡상 예측
영상 제목과 설명을 입력하면 AI가 성공 확률을 분석하고 구체적인 개선 가이드라인을 제공합니다.

### 📊 실시간 트렌드 분석
뷰티 카테고리의 최신 트렌드 키워드, 성공 패턴, 떠오르는 키워드를 실시간으로 확인할 수 있습니다.

### 📧 주간 뉴스레터
매주 월요일 오전, AI가 분석한 성장 전략과 트렌드 리포트를 이메일로 받아볼 수 있습니다.

### 🔍 YouTube API 정책 준수
- 데이터 보관 기간: 최대 30일 (자동 삭제/갱신)
- 할당량 관리: 하루 10,000 포인트 제한
- 일괄 처리: 최대 50개씩 묶어서 호출
- 에러 처리: 지수 백오프 적용

## 기술 스택

### Backend
- **Python 3.11** - FastAPI 프레임워크
- **SQLAlchemy** - ORM 및 데이터베이스 관리
- **Google YouTube Data API v3** - 데이터 수집
- **Gemini API** - AI 분석 (선택)
- **scikit-learn / XGBoost** - 머신러닝 모델

### Frontend
- **React 19** - Vite 빌드 도구
- **Tailwind CSS 4** - 스타일링
- **shadcn/ui** - UI 컴포넌트 라이브러리
- **Wouter** - 클라이언트 라우팅

### Deployment
- **Render** - 백엔드 API, 프론트엔드, Cron Job 호스팅
- **GitHub** - 버전 관리 및 자동 배포

## 프로젝트 구조

\`\`\`
cnecplus/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── api/               # API 라우터
│   │   │   ├── prediction.py # AI 예측 API
│   │   │   ├── newsletter.py # 뉴스레터 API
│   │   │   └── trends.py     # 트렌드 분석 API
│   │   ├── core/              # 설정 및 유틸리티
│   │   ├── db/                # 데이터베이스 연결
│   │   ├── models/            # 데이터베이스 모델
│   │   ├── schemas/           # Pydantic 스키마
│   │   ├── services/          # 비즈니스 로직
│   │   │   └── predictor.py  # AI 예측 서비스
│   │   ├── tasks/             # 백그라운드 작업
│   │   │   └── youtube_collector.py  # 데이터 수집기
│   │   └── main.py            # FastAPI 앱
│   └── requirements.txt
│
├── frontend/                   # React 프론트엔드
│   └── client/
│       ├── src/
│       │   ├── pages/         # 페이지 컴포넌트
│       │   │   ├── Home.tsx
│       │   │   ├── Prediction.tsx
│       │   │   ├── Newsletter.tsx
│       │   │   └── Trends.tsx
│       │   ├── components/    # UI 컴포넌트
│       │   └── App.tsx
│       └── package.json
│
└── render.yaml                 # Render 배포 설정
\`\`\`

## 로컬 개발 환경 설정

### 1. 저장소 클론
\`\`\`bash
git clone https://github.com/mktbiz-byte/cnecplus.git
cd cnecplus
\`\`\`

### 2. 백엔드 설정
\`\`\`bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
nano .env  # YouTube API 키 등 입력
\`\`\`

### 3. 백엔드 실행
\`\`\`bash
uvicorn app.main:app --reload --port 8000
\`\`\`

백엔드 API가 http://localhost:8000 에서 실행됩니다.
- API 문서: http://localhost:8000/docs

### 4. 프론트엔드 설정
\`\`\`bash
cd ../frontend/client
pnpm install
\`\`\`

### 5. 프론트엔드 실행
\`\`\`bash
pnpm dev
\`\`\`

프론트엔드가 http://localhost:5173 에서 실행됩니다.

## Render 배포

### 1. GitHub 리포지토리 연결
Render 대시보드에서 \`mktbiz-byte/cnecplus\` 리포지토리를 연결합니다.

### 2. Blueprint 배포
\`render.yaml\` 파일이 자동으로 감지되며, 다음 서비스가 생성됩니다:
- **cnecplus-backend**: FastAPI 백엔드 서버
- **cnecplus-frontend**: React 프론트엔드
- **cnecplus-collector**: 데이터 수집 Cron Job (매일 새벽 3시)

### 3. 환경 변수 설정
Render 대시보드에서 각 서비스의 환경 변수를 설정합니다:
- \`YOUTUBE_API_KEY\`: YouTube Data API v3 키
- \`GEMINI_API_KEY\`: Google Gemini API 키 (선택)
- \`DATABASE_URL\`: PostgreSQL 연결 문자열 (프로덕션)

### 4. 배포 완료
Git push 시 자동으로 재배포됩니다.

## API 엔드포인트

### 예측 API
- \`POST /api/prediction/\` - 영상 떡상 확률 예측
- \`GET /api/prediction/stats\` - 예측 통계

### 뉴스레터 API
- \`POST /api/newsletter/subscribe\` - 뉴스레터 구독
- \`POST /api/newsletter/unsubscribe\` - 구독 취소
- \`GET /api/newsletter/stats\` - 구독자 통계

### 트렌드 API
- \`GET /api/trends/weekly\` - 주간 트렌드 리포트
- \`GET /api/trends/keywords\` - 실시간 트렌딩 키워드

## 데이터 수집 스케줄

매일 새벽 3시(UTC)에 자동으로 실행됩니다:
1. 30일 이상 지난 데이터 삭제 (API 정책 준수)
2. 최근 7일 뷰티 영상 검색 (최대 50개)
3. 영상 상세 정보 조회 및 저장
4. 할당량 사용량 모니터링

## 보안 주의사항

⚠️ **중요:**
- API 키를 절대 GitHub에 커밋하지 마세요
- \`.env\` 파일은 \`.gitignore\`에 포함되어 있습니다
- Render 환경 변수로 민감한 정보를 관리하세요
- 프로덕션에서는 HTTPS 사용 필수

## 라이선스

MIT License

## 지원

문제가 발생하거나 질문이 있으시면 GitHub Issues를 등록해주세요.

## 개발자

CnecPlus AI - 뷰티 크리에이터 성장 플랫폼 © 2025

---

**Powered by AI, YouTube Data API & Render**
