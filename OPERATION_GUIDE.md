# CnecPlus AI - 운영 가이드

## 📖 개요

이 문서는 CnecPlus AI 시스템을 성공적으로 운영하기 위한 실무 가이드입니다.

---

## 🎯 시스템 구성

### 1. 백엔드 API (cnecplus-backend)
- **역할**: AI 예측, 뉴스레터 관리, 트렌드 분석
- **기술**: Python FastAPI
- **URL**: `https://cnecplus-backend.onrender.com`
- **API 문서**: `https://cnecplus-backend.onrender.com/docs`

### 2. 프론트엔드 (cnecplus-frontend)
- **역할**: 사용자 인터페이스
- **기술**: React + Vite
- **URL**: `https://cnecplus-frontend.onrender.com`

### 3. 데이터 수집기 (cnecplus-collector)
- **역할**: 유튜브 데이터 자동 수집
- **실행 주기**: 매일 새벽 3시 (UTC) = 한국 시간 정오 12시
- **수집량**: 최대 50개 영상/일

---

## 📊 일일 운영 체크리스트

### 매일 확인사항
- [ ] Render 대시보드에서 3개 서비스 상태 확인 (모두 "Active" 상태여야 함)
- [ ] 백엔드 API 헬스체크: `https://cnecplus-backend.onrender.com/health`
- [ ] 데이터 수집기 로그 확인 (Logs 탭)
- [ ] YouTube API 할당량 사용량 확인

### 주간 확인사항
- [ ] 뉴스레터 구독자 수 확인: `GET /api/newsletter/stats`
- [ ] 예측 요청 통계 확인: `GET /api/prediction/stats`
- [ ] 데이터베이스 용량 확인

---

## 🔧 주요 운영 작업

### 1. YouTube API 할당량 모니터링

#### 할당량 확인 방법
1. Google Cloud Console 접속
2. "API 및 서비스" > "대시보드"
3. "YouTube Data API v3" 클릭
4. "할당량" 탭에서 사용량 확인

#### 할당량 관리 전략
- **일일 한도**: 10,000 포인트
- **데이터 수집기 사용량**: 약 100-150 포인트/일
  - search.list: 100 포인트
  - videos.list: 1 포인트 (50개 조회 시 1포인트)
- **여유 할당량**: 약 9,850 포인트 (수동 API 호출 가능)

#### 할당량 초과 시 대응
1. 데이터 수집기 일시 중지:
   - Render 대시보드 > cnecplus-collector > "Suspend"
2. 다음 날 자정(UTC)에 할당량 자동 리셋
3. 서비스 재개: "Resume" 클릭

### 2. 뉴스레터 발송

현재 시스템은 구독자 수집만 구현되어 있습니다. 실제 이메일 발송을 위해서는 추가 설정이 필요합니다.

#### 이메일 발송 서비스 연동 (권장)
**옵션 1: SendGrid (무료 플랜: 100통/일)**
1. SendGrid 계정 생성: https://sendgrid.com
2. API 키 발급
3. Render 환경 변수에 `SENDGRID_API_KEY` 추가
4. 백엔드 코드에 이메일 발송 로직 추가

**옵션 2: Resend (무료 플랜: 100통/일)**
1. Resend 계정 생성: https://resend.com
2. API 키 발급
3. 환경 변수 설정 및 코드 추가

#### 주간 리포트 생성 및 발송 프로세스
1. 매주 월요일 오전 실행 (Cron Job 추가 필요)
2. 지난 주 데이터 분석
3. AI 리포트 생성 (Gemini API 활용)
4. 구독자 전체에게 이메일 발송

### 3. 데이터베이스 관리

#### 현재 설정 (SQLite)
- **장점**: 설정 불필요, 간단함
- **단점**: 서비스 재시작 시 데이터 손실 가능

#### PostgreSQL 마이그레이션 (프로덕션 권장)
1. Render에서 PostgreSQL 데이터베이스 생성
2. 환경 변수 업데이트:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```
3. 백엔드 재배포 (자동으로 테이블 생성됨)

#### 데이터 백업
PostgreSQL 사용 시 Render가 자동 백업을 제공합니다.

### 4. AI 모델 업데이트

현재는 규칙 기반 예측을 사용하고 있습니다. 실제 머신러닝 모델로 업그레이드하는 방법:

#### Step 1: 데이터 수집
- 최소 1,000개 이상의 영상 데이터 수집
- 각 영상의 "떡상 여부" 라벨링 (3일 내 10만 조회수 기준)

#### Step 2: 모델 학습
```python
# 로컬 환경에서 실행
import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
import joblib

# 데이터 로드 및 전처리
df = pd.read_csv('video_data.csv')
X = df[['title_length', 'keyword_count', ...]]
y = df['is_viral']

# 학습
model = XGBClassifier()
model.fit(X_train, y_train)

# 모델 저장
joblib.dump(model, 'model.pkl')
```

#### Step 3: 모델 배포
1. `model.pkl` 파일을 `backend/app/services/` 디렉토리에 추가
2. `predictor.py`에서 모델 로드:
   ```python
   self.model = joblib.load('app/services/model.pkl')
   ```
3. GitHub에 푸시 → 자동 재배포

---

## 🚨 문제 해결

### 백엔드가 응답하지 않는 경우
**증상**: API 호출 시 504 Gateway Timeout

**원인**: 무료 플랜의 경우 15분 비활성 시 sleep 모드

**해결**:
1. 첫 요청 시 30초~1분 대기 (자동 wake-up)
2. 또는 Starter 플랜으로 업그레이드 ($7/월)

### 데이터 수집기가 실행되지 않는 경우
**증상**: Logs에 실행 기록 없음

**확인사항**:
1. Cron 스케줄 확인: `0 3 * * *`
2. `YOUTUBE_API_KEY` 환경 변수 설정 확인
3. "Manual Jobs" 탭에서 수동 실행 테스트

**해결**:
```bash
# 로컬에서 테스트
cd backend
python -m app.tasks.youtube_collector
```

### 프론트엔드가 백엔드에 연결되지 않는 경우
**증상**: 예측 버튼 클릭 시 "Network Error"

**확인사항**:
1. 백엔드 URL 확인: `VITE_API_URL` 환경 변수
2. 백엔드 서비스 상태 확인
3. 브라우저 콘솔에서 CORS 에러 확인

**해결**:
- 백엔드 `main.py`의 CORS 설정 확인
- 프론트엔드 환경 변수 재설정 후 재배포

---

## 📈 성능 최적화

### 1. 응답 속도 개선
- **캐싱 추가**: Redis 연동 (트렌드 데이터 캐싱)
- **CDN 사용**: 정적 파일 배포 속도 향상
- **데이터베이스 인덱싱**: 자주 조회하는 필드에 인덱스 추가

### 2. 비용 최적화
- **무료 플랜 최대 활용**:
  - 백엔드/프론트엔드: Render Free
  - 데이터베이스: Render PostgreSQL Free (90일 후 삭제)
  - Cron Job: Render Free (매일 1회)
  
- **유료 플랜 고려 시점**:
  - 월 방문자 1,000명 이상
  - Sleep 모드로 인한 사용자 불편 발생
  - 데이터베이스 용량 1GB 초과

### 3. 확장성 고려사항
- **수평 확장**: 백엔드 인스턴스 추가 (Render Starter 이상)
- **로드 밸런싱**: Render가 자동 제공
- **마이크로서비스 분리**: 예측/뉴스레터/트렌드 각각 독립 서비스

---

## 📊 분석 및 모니터링

### 주요 지표 (KPI)
1. **사용자 지표**
   - 일일 활성 사용자 (DAU)
   - 예측 요청 수
   - 뉴스레터 구독자 수

2. **시스템 지표**
   - API 응답 시간
   - 에러율
   - YouTube API 할당량 사용률

3. **비즈니스 지표**
   - 예측 정확도
   - 사용자 재방문율
   - 뉴스레터 오픈율

### 모니터링 도구 추가 (선택)
- **Sentry**: 에러 추적
- **Google Analytics**: 사용자 행동 분석
- **Uptime Robot**: 서비스 가동 시간 모니터링

---

## 🔐 보안 관리

### API 키 관리
- ✅ 환경 변수로 관리 (GitHub에 절대 커밋 금지)
- ✅ Render 대시보드에서만 설정
- ⚠️ 정기적으로 API 키 재발급 (3개월마다)

### 데이터 보호
- YouTube API 정책 준수: 30일 데이터 보관
- 개인정보 보호: 이메일 주소 암호화 저장 (향후 개선)
- HTTPS 사용: Render가 자동 제공

---

## 📞 지원 및 문의

### 기술 지원
- GitHub Issues: https://github.com/mktbiz-byte/cnecplus/issues
- Render 문서: https://render.com/docs

### 긴급 상황 대응
1. Render 대시보드에서 서비스 재시작
2. Logs 확인 및 에러 메시지 수집
3. GitHub에 Issue 등록

---

**정기적인 모니터링과 유지보수로 안정적인 서비스를 제공하세요!** 🚀
