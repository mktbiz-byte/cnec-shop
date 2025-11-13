"""
뉴스레터 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import NewsletterSubscribe, NewsletterResponse, NewsletterUnsubscribe
from app.models.models import NewsletterSubscriber
from datetime import datetime

router = APIRouter()

@router.post("/subscribe", response_model=NewsletterResponse)
async def subscribe_newsletter(
    subscription: NewsletterSubscribe,
    db: Session = Depends(get_db)
):
    """
    뉴스레터 구독 신청
    
    - **email**: 이메일 주소 (필수)
    - **name**: 이름 (선택)
    - **creator_type**: 크리에이터 유형 (선택)
    - **subscriber_count_range**: 구독자 규모 (선택)
    """
    try:
        # 이미 구독 중인지 확인
        existing = db.query(NewsletterSubscriber).filter(
            NewsletterSubscriber.email == subscription.email
        ).first()
        
        if existing:
            if existing.is_active:
                return NewsletterResponse(
                    success=False,
                    message="이미 구독 중인 이메일입니다.",
                    subscriber_id=existing.id
                )
            else:
                # 재구독
                existing.is_active = True
                existing.subscribed_at = datetime.now()
                existing.unsubscribed_at = None
                db.commit()
                
                return NewsletterResponse(
                    success=True,
                    message="뉴스레터 구독이 재개되었습니다!",
                    subscriber_id=existing.id
                )
        
        # 새 구독자 생성
        new_subscriber = NewsletterSubscriber(
            email=subscription.email,
            name=subscription.name,
            creator_type=subscription.creator_type,
            subscriber_count_range=subscription.subscriber_count_range,
            is_active=True,
            is_verified=False,
            subscribed_at=datetime.now()
        )
        
        db.add(new_subscriber)
        db.commit()
        db.refresh(new_subscriber)
        
        return NewsletterResponse(
            success=True,
            message="뉴스레터 구독이 완료되었습니다! 매주 월요일 오전에 AI 인사이트를 받아보세요.",
            subscriber_id=new_subscriber.id
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"구독 처리 중 오류가 발생했습니다: {str(e)}")


@router.post("/unsubscribe", response_model=NewsletterResponse)
async def unsubscribe_newsletter(
    unsubscription: NewsletterUnsubscribe,
    db: Session = Depends(get_db)
):
    """
    뉴스레터 구독 취소
    """
    try:
        subscriber = db.query(NewsletterSubscriber).filter(
            NewsletterSubscriber.email == unsubscription.email
        ).first()
        
        if not subscriber:
            raise HTTPException(status_code=404, detail="구독 정보를 찾을 수 없습니다.")
        
        if not subscriber.is_active:
            return NewsletterResponse(
                success=False,
                message="이미 구독 취소된 이메일입니다."
            )
        
        # 구독 취소 처리
        subscriber.is_active = False
        subscriber.unsubscribed_at = datetime.now()
        db.commit()
        
        return NewsletterResponse(
            success=True,
            message="뉴스레터 구독이 취소되었습니다."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"구독 취소 중 오류가 발생했습니다: {str(e)}")


@router.get("/stats")
async def get_newsletter_stats(db: Session = Depends(get_db)):
    """
    뉴스레터 구독 통계
    """
    total_subscribers = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.is_active == True
    ).count()
    
    total_all_time = db.query(NewsletterSubscriber).count()
    
    return {
        "active_subscribers": total_subscribers,
        "total_all_time": total_all_time,
        "growth_rate": "계산 중..."
    }
