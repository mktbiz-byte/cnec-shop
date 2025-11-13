# CnecPlus AI - Render 배포 가이드

## 📋 사전 준비

### 1. 필요한 계정
- GitHub 계정 (이미 있음: mktbiz-byte/cnecplus)
- Render 계정 (https://render.com)
- YouTube Data API v3 키
- Gemini API 키 (선택사항)

### 2. API 키 발급

#### YouTube Data API v3
1. Google Cloud Console 접속: https://console.cloud.google.com
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리" 이동
4. "YouTube Data API v3" 검색 및 활성화
5. "사용자 인증 정보" > "사용자 인증 정보 만들기" > "API 키" 선택
6. API 키 복사 (나중에 Render에 입력)

#### Gemini API (선택)
1. Google AI Studio 접속: https://makersuite.google.com/app/apikey
2. "Get API Key" 클릭
3. API 키 복사

---

## 🚀 Render 배포 단계

### Step 1: Render 계정 생성 및 로그인
1. https://render.com 접속
2. GitHub 계정으로 로그인 (권장)

### Step 2: GitHub 리포지토리 연결
1. Render 대시보드에서 **"New +"** 버튼 클릭
2. **"Blueprint"** 선택
3. GitHub 리포지토리 연결:
   - "Connect a repository" 클릭
   - `mktbiz-byte/cnecplus` 검색 및 선택
   - "Connect" 클릭

### Step 3: Blueprint 배포
1. `render.yaml` 파일이 자동으로 감지됨
2. Blueprint 이름 확인: "cnecplus"
3. **"Apply"** 버튼 클릭

다음 3개의 서비스가 자동으로 생성됩니다:
- ✅ **cnecplus-backend**: FastAPI 백엔드 서버
- ✅ **cnecplus-frontend**: React 프론트엔드
- ✅ **cnecplus-collector**: 데이터 수집 Cron Job

### Step 4: 환경 변수 설정

#### 백엔드 서비스 (cnecplus-backend)
1. Render 대시보드에서 "cnecplus-backend" 서비스 클릭
2. 왼쪽 메뉴에서 **"Environment"** 클릭
3. 다음 환경 변수 추가:

| Key | Value | 설명 |
|-----|-------|------|
| `YOUTUBE_API_KEY` | (발급받은 API 키) | YouTube Data API v3 키 |
| `GEMINI_API_KEY` | (발급받은 API 키) | Gemini API 키 (선택) |

4. **"Save Changes"** 클릭

#### Cron Job (cnecplus-collector)
1. "cnecplus-collector" 서비스 클릭
2. **"Environment"** 클릭
3. 동일하게 `YOUTUBE_API_KEY` 추가
4. **"Save Changes"** 클릭

#### 프론트엔드 서비스 (cnecplus-frontend)
환경 변수가 이미 `render.yaml`에 설정되어 있으므로 추가 설정 불필요.

### Step 5: 배포 확인
1. 각 서비스의 "Logs" 탭에서 배포 진행 상황 확인
2. 백엔드: 약 3-5분 소요
3. 프론트엔드: 약 5-7분 소요 (pnpm install 시간 포함)

### Step 6: 서비스 URL 확인
배포가 완료되면 각 서비스의 URL이 생성됩니다:

- **백엔드 API**: `https://cnecplus-backend.onrender.com`
  - API 문서: `https://cnecplus-backend.onrender.com/docs`
  
- **프론트엔드**: `https://cnecplus-frontend.onrender.com`

---

## 🔧 배포 후 설정

### 1. 프론트엔드 API URL 업데이트 (필요시)
만약 백엔드 URL이 다르다면:
1. `cnecplus-frontend` 서비스의 Environment 탭 이동
2. `VITE_API_URL` 값을 실제 백엔드 URL로 수정
3. "Save Changes" 후 자동 재배포

### 2. 데이터 수집 테스트
1. `cnecplus-collector` 서비스 클릭
2. "Manual Jobs" 탭에서 **"Trigger Deploy"** 클릭
3. "Logs"에서 데이터 수집 과정 확인

---

## 📊 모니터링

### 서비스 상태 확인
- Render 대시보드에서 각 서비스의 상태 실시간 확인
- "Logs" 탭에서 에러 로그 모니터링

### 데이터베이스 확인
현재는 SQLite를 사용하므로 서비스 재시작 시 데이터가 초기화됩니다.
**프로덕션 환경에서는 PostgreSQL 사용을 강력히 권장합니다.**

#### PostgreSQL 추가 방법
1. Render 대시보드에서 "New +" > "PostgreSQL" 선택
2. 데이터베이스 이름: `cnecplus-db`
3. 생성 후 "Internal Database URL" 복사
4. `cnecplus-backend`와 `cnecplus-collector`의 `DATABASE_URL` 환경 변수를 PostgreSQL URL로 변경

---

## 🔄 업데이트 배포

### 자동 배포
GitHub의 `ai-prediction-system` 브랜치에 push하면 자동으로 재배포됩니다:

```bash
git add .
git commit -m "Update: 기능 추가"
git push origin ai-prediction-system
```

### 수동 배포
Render 대시보드에서 각 서비스의 "Manual Deploy" > "Deploy latest commit" 클릭

---

## ⚠️ 주의사항

### 무료 플랜 제한
- **백엔드/프론트엔드**: 15분 동안 요청이 없으면 sleep 모드 진입
- 첫 요청 시 30초~1분 정도 wake-up 시간 소요
- **Cron Job**: 매일 1회 실행 (무료)

### 유료 플랜 업그레이드 시 장점
- **Starter 플랜 ($7/월)**:
  - 24시간 항상 실행 (sleep 없음)
  - 더 빠른 응답 속도
  - 더 많은 메모리 및 CPU

### API 할당량 관리
- YouTube API: 하루 10,000 포인트 제한
- 데이터 수집기가 매일 새벽 3시에 자동 실행
- 할당량 초과 시 다음 날까지 대기

---

## 🐛 문제 해결

### 백엔드가 시작되지 않는 경우
1. "Logs" 탭에서 에러 메시지 확인
2. `YOUTUBE_API_KEY`가 올바르게 설정되었는지 확인
3. Python 버전 확인 (3.11.0)

### 프론트엔드가 백엔드에 연결되지 않는 경우
1. `VITE_API_URL`이 올바른 백엔드 URL인지 확인
2. 백엔드 서비스가 정상 실행 중인지 확인
3. CORS 설정 확인 (이미 설정되어 있음)

### Cron Job이 실행되지 않는 경우
1. "Logs" 탭에서 실행 기록 확인
2. Schedule 확인: `0 3 * * *` (매일 UTC 3시 = 한국 시간 12시)
3. `YOUTUBE_API_KEY` 환경 변수 확인

---

## 📞 지원

문제가 발생하면:
1. Render 공식 문서: https://render.com/docs
2. GitHub Issues: https://github.com/mktbiz-byte/cnecplus/issues
3. Render 커뮤니티: https://community.render.com

---

**배포 완료 후 서비스 URL을 확인하고 정상 작동 여부를 테스트하세요!** 🎉
