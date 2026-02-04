"""
스티비(Stibee) API 엔드포인트
- 주소록 관리
- 구독자 추가/삭제
- 이메일 발송
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.stibee_service import stibee_service

router = APIRouter()


# ============================================================
# Request/Response 스키마
# ============================================================

class AddSubscribersRequest(BaseModel):
    """구독자 추가 요청"""
    list_id: int
    subscribers: list[dict]  # [{"email": "...", "name": "...", ...}]


class DeleteSubscribersRequest(BaseModel):
    """구독자 삭제 요청"""
    list_id: int
    emails: list[str]


class SendAutoEmailRequest(BaseModel):
    """자동 이메일 발송 요청"""
    auto_email_url: str
    subscriber_email: EmailStr
    custom_fields: Optional[dict] = None


class BulkSendAutoEmailRequest(BaseModel):
    """일괄 자동 이메일 발송 요청"""
    auto_email_url: str
    subscribers: list[dict]  # [{"email": "...", "name": "...", ...}]


class CreateEmailRequest(BaseModel):
    """이메일 생성 요청"""
    list_id: int
    subject: str
    html_content: str


# ============================================================
# 주소록 엔드포인트
# ============================================================

@router.get("/address-books")
async def get_address_books():
    """스티비 주소록 목록 조회"""
    try:
        return await stibee_service.get_address_books()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"주소록 조회 실패: {str(e)}")


@router.get("/address-books/{list_id}")
async def get_address_book(list_id: int):
    """특정 주소록 조회"""
    try:
        return await stibee_service.get_address_book(list_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"주소록 조회 실패: {str(e)}")


# ============================================================
# 구독자 엔드포인트
# ============================================================

@router.post("/subscribers")
async def add_subscribers(req: AddSubscribersRequest):
    """주소록에 구독자 일괄 추가"""
    try:
        result = await stibee_service.add_subscribers(
            list_id=req.list_id,
            subscribers=req.subscribers,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"구독자 추가 실패: {str(e)}")


@router.get("/subscribers/{list_id}/{email}")
async def get_subscriber(list_id: int, email: str):
    """특정 구독자 조회"""
    try:
        return await stibee_service.get_subscriber(list_id, email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"구독자 조회 실패: {str(e)}")


@router.delete("/subscribers")
async def delete_subscribers(req: DeleteSubscribersRequest):
    """구독자 삭제"""
    try:
        return await stibee_service.delete_subscribers(req.list_id, req.emails)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"구독자 삭제 실패: {str(e)}")


# ============================================================
# 이메일 엔드포인트
# ============================================================

@router.get("/emails")
async def get_emails():
    """이메일 목록 조회"""
    try:
        return await stibee_service.get_emails()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이메일 조회 실패: {str(e)}")


@router.post("/emails")
async def create_email(req: CreateEmailRequest):
    """이메일 생성"""
    try:
        return await stibee_service.create_email(
            list_id=req.list_id,
            subject=req.subject,
            html_content=req.html_content,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이메일 생성 실패: {str(e)}")


@router.post("/send-auto")
async def send_auto_email(req: SendAutoEmailRequest):
    """자동 이메일 발송 (단건)"""
    try:
        return await stibee_service.send_auto_email(
            auto_email_url=req.auto_email_url,
            subscriber_email=req.subscriber_email,
            custom_fields=req.custom_fields,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이메일 발송 실패: {str(e)}")


@router.post("/send-auto/bulk")
async def send_auto_email_bulk(req: BulkSendAutoEmailRequest):
    """자동 이메일 일괄 발송"""
    try:
        results = []
        errors = []
        for subscriber in req.subscribers:
            email = subscriber.get("email")
            if not email:
                continue
            try:
                custom_fields = {k: v for k, v in subscriber.items() if k != "email"}
                result = await stibee_service.send_auto_email(
                    auto_email_url=req.auto_email_url,
                    subscriber_email=email,
                    custom_fields=custom_fields if custom_fields else None,
                )
                results.append(result)
            except Exception as e:
                errors.append({"email": email, "error": str(e)})
        return {
            "total": len(req.subscribers),
            "success": len(results),
            "failed": len(errors),
            "errors": errors,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일괄 발송 실패: {str(e)}")
