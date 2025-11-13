"""
트렌드 분석 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import WeeklyTrends
from app.models.models import WeeklyReport
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.get("/weekly", response_model=Optional[WeeklyTrends])
async def get_weekly_trends(
    week: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    주간 트렌드 리포트 조회
    
    - **week**: 주차 (선택, 기본값: 현재 주)
    - **year**: 연도 (선택, 기본값: 현재 연도)
    """
    try:
        # 기본값: 현재 주차
        if not week or not year:
            now = datetime.now()
            week = now.isocalendar()[1]
            year = now.year
        
        # 리포트 조회
        report = db.query(WeeklyReport).filter(
            WeeklyReport.week_number == week,
            WeeklyReport.year == year
        ).first()
        
        if not report:
            # 리포트가 없으면 더미 데이터 반환 (실제로는 생성 트리거)
            return {
                "week_number": week,
                "year": year,
                "top_keywords": [
                    {"keyword": "블랙프라이데이", "impact_score": 0.85, "video_count": 127, "avg_views": 45000},
                    {"keyword": "겨울쿨톤", "impact_score": 0.78, "video_count": 89, "avg_views": 38000},
                    {"keyword": "내돈내산", "impact_score": 0.72, "video_count": 156, "avg_views": 32000}
                ],
                "success_patterns": {
                    "optimal_length": "12-15분",
                    "best_upload_time": "금요일 오후 8시",
                    "thumbnail_type": "얼굴 클로즈업 + 제품"
                },
                "rising_trends": ["비건 글리터", "퍼스널 컬러 진단", "올리브영 세일"],
                "generated_at": datetime.now()
            }
        
        return WeeklyTrends(
            week_number=report.week_number,
            year=report.year,
            top_keywords=report.top_keywords,
            success_patterns=report.success_patterns,
            rising_trends=report.rising_trends,
            generated_at=report.generated_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"트렌드 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/keywords")
async def get_trending_keywords(limit: int = 10):
    """
    현재 트렌딩 키워드 목록 (실시간)
    """
    # 실제로는 DB에서 조회, 지금은 더미 데이터
    return {
        "keywords": [
            {"keyword": "올리브영", "trend_score": 95},
            {"keyword": "신상", "trend_score": 88},
            {"keyword": "GRWM", "trend_score": 82},
            {"keyword": "내돈내산", "trend_score": 79},
            {"keyword": "퍼스널컬러", "trend_score": 75}
        ][:limit]
    }
