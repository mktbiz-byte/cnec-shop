"""
예측 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import PredictionInput, PredictionOutput
from app.services.predictor import PredictorService
from app.models.models import PredictionLog
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=PredictionOutput)
async def predict_virality(
    input_data: PredictionInput,
    db: Session = Depends(get_db)
):
    """
    영상 정보를 받아 '떡상' 확률과 성장 가이드라인을 예측합니다.
    
    - **title**: 영상 제목 (필수)
    - **description**: 영상 설명 (선택)
    - **tags**: 태그 리스트 (선택)
    
    Returns:
        - **probability**: 떡상 확률 (0-100%)
        - **is_viral_predicted**: 떡상 예상 여부
        - **guideline**: AI가 제안하는 구체적인 개선 가이드라인
        - **top_features**: 예측에 영향을 준 주요 요인들
    """
    try:
        # 예측 서비스 초기화
        predictor = PredictorService()
        
        # 예측 수행
        result = predictor.predict(
            title=input_data.title,
            description=input_data.description,
            tags=input_data.tags
        )
        
        # 예측 로그 저장
        log = PredictionLog(
            input_title=input_data.title,
            input_description=input_data.description,
            input_features=result.get("features"),
            prediction_probability=result["probability"],
            prediction_guideline=result["guideline"],
            created_at=datetime.now()
        )
        db.add(log)
        db.commit()
        
        return PredictionOutput(
            probability=result["probability"],
            is_viral_predicted=result["is_viral"],
            guideline=result["guideline"],
            top_features=result["top_features"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"예측 중 오류가 발생했습니다: {str(e)}")


@router.get("/stats")
async def get_prediction_stats(db: Session = Depends(get_db)):
    """
    예측 통계 정보를 반환합니다.
    """
    total_predictions = db.query(PredictionLog).count()
    
    return {
        "total_predictions": total_predictions,
        "service_status": "active"
    }
