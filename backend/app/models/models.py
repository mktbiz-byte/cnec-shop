"""
데이터베이스 모델 정의
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class VideoData(Base):
    """유튜브 영상 데이터"""
    __tablename__ = "video_data"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String, unique=True, index=True, nullable=False)
    channel_id = Column(String, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    tags = Column(JSON)  # 태그 리스트를 JSON으로 저장
    
    # 통계 데이터
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # 메타데이터
    duration = Column(Integer)  # 초 단위
    published_at = Column(DateTime)
    thumbnail_url = Column(String)
    
    # 피처 데이터 (분석용)
    features = Column(JSON)  # 추출된 피처들을 JSON으로 저장
    
    # 예측 결과
    prediction_score = Column(Float)  # 떡상 확률
    is_viral = Column(Boolean)  # 실제 떡상 여부
    
    # 타임스탬프 (API 정책 준수용)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class NewsletterSubscriber(Base):
    """뉴스레터 구독자"""
    __tablename__ = "newsletter_subscribers"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    
    # 구독 상태
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # 구독자 정보
    creator_type = Column(String)  # 뷰티, 패션 등
    subscriber_count_range = Column(String)  # 구독자 규모
    
    # 타임스탬프
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    unsubscribed_at = Column(DateTime(timezone=True))
    last_email_sent = Column(DateTime(timezone=True))


class WeeklyReport(Base):
    """주간 AI 리포트"""
    __tablename__ = "weekly_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    week_number = Column(Integer, index=True)  # 연도의 몇 번째 주
    year = Column(Integer, index=True)
    
    # 리포트 내용
    top_keywords = Column(JSON)  # 상위 키워드 리스트
    success_patterns = Column(JSON)  # 성공 패턴 분석 결과
    rising_trends = Column(JSON)  # 떠오르는 트렌드
    
    # 리포트 텍스트
    report_markdown = Column(Text)  # 마크다운 형식의 리포트
    report_html = Column(Text)  # HTML 형식의 리포트
    
    # 메타데이터
    total_videos_analyzed = Column(Integer)
    avg_prediction_accuracy = Column(Float)
    
    # 타임스탬프
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True))


class PredictionLog(Base):
    """예측 요청 로그"""
    __tablename__ = "prediction_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 입력 데이터
    input_title = Column(String, nullable=False)
    input_description = Column(Text)
    input_features = Column(JSON)
    
    # 예측 결과
    prediction_probability = Column(Float)
    prediction_guideline = Column(Text)
    
    # 메타데이터
    ip_address = Column(String)
    user_agent = Column(String)
    
    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
