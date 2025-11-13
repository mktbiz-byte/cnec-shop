"""
API 요청/응답 스키마 (Pydantic)
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ===== 예측 관련 스키마 =====
class PredictionInput(BaseModel):
    """예측 요청 입력"""
    title: str = Field(..., min_length=1, max_length=200, description="영상 제목")
    description: Optional[str] = Field(None, max_length=5000, description="영상 설명")
    tags: Optional[List[str]] = Field(None, description="태그 리스트")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "올리브영 신상 틴트 내돈내산 리뷰",
                "description": "요즘 핫한 올리브영 신상 틴트를 직접 구매해서 발라봤어요!",
                "tags": ["뷰티", "메이크업", "틴트"]
            }
        }


class PredictionOutput(BaseModel):
    """예측 결과 출력"""
    probability: float = Field(..., ge=0, le=100, description="떡상 확률 (%)")
    is_viral_predicted: bool = Field(..., description="떡상 예상 여부")
    guideline: str = Field(..., description="AI 성장 가이드라인")
    top_features: List[Dict[str, Any]] = Field(..., description="주요 영향 요인")
    
    class Config:
        json_schema_extra = {
            "example": {
                "probability": 82.5,
                "is_viral_predicted": True,
                "guideline": "제목에 '신상'과 '내돈내산' 키워드가 포함되어 있어 성공 확률이 높습니다. 썸네일에 Before/After 이미지를 추가하면 클릭률이 더 높아질 것으로 예상됩니다.",
                "top_features": [
                    {"feature": "keyword_올리브영", "impact": 0.35},
                    {"feature": "keyword_내돈내산", "impact": 0.23}
                ]
            }
        }


# ===== 뉴스레터 관련 스키마 =====
class NewsletterSubscribe(BaseModel):
    """뉴스레터 구독 신청"""
    email: EmailStr = Field(..., description="이메일 주소")
    name: Optional[str] = Field(None, max_length=50, description="이름")
    creator_type: Optional[str] = Field(None, description="크리에이터 유형 (뷰티, 패션 등)")
    subscriber_count_range: Optional[str] = Field(None, description="구독자 규모")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "creator@example.com",
                "name": "김뷰티",
                "creator_type": "뷰티",
                "subscriber_count_range": "1만-5만"
            }
        }


class NewsletterResponse(BaseModel):
    """뉴스레터 구독 응답"""
    success: bool
    message: str
    subscriber_id: Optional[int] = None


class NewsletterUnsubscribe(BaseModel):
    """뉴스레터 구독 취소"""
    email: EmailStr


# ===== 트렌드 관련 스키마 =====
class TrendKeyword(BaseModel):
    """트렌드 키워드"""
    keyword: str
    impact_score: float
    video_count: int
    avg_views: float


class WeeklyTrends(BaseModel):
    """주간 트렌드 리포트"""
    week_number: int
    year: int
    top_keywords: List[TrendKeyword]
    success_patterns: Dict[str, Any]
    rising_trends: List[str]
    generated_at: datetime


# ===== 공통 응답 스키마 =====
class HealthCheck(BaseModel):
    """헬스 체크 응답"""
    status: str
    service: str
    timestamp: datetime = Field(default_factory=datetime.now)
