"""
협찬 중개 요청 API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.db.supabase_client import get_supabase_client
from datetime import datetime

router = APIRouter()

# Pydantic 스키마
class SponsorshipRequestCreate(BaseModel):
    creator_id: str
    requested_rate: int
    preferred_brands: List[str] = []
    message: Optional[str] = None

class SponsorshipRequestUpdate(BaseModel):
    status: Optional[str] = None  # 'pending', 'in_progress', 'completed', 'cancelled'
    admin_notes: Optional[str] = None
    final_rate: Optional[int] = None

class SponsorshipRequestResponse(BaseModel):
    id: str
    creator_id: str
    requested_rate: int
    preferred_brands: List[str]
    message: Optional[str]
    status: str
    admin_notes: Optional[str]
    final_rate: Optional[int]
    commission_rate: float
    commission_amount: Optional[int]
    completed_at: Optional[str]
    created_at: str
    updated_at: str

@router.post("/", response_model=SponsorshipRequestResponse)
async def create_sponsorship_request(request: SponsorshipRequestCreate):
    """협찬 중개 요청 생성"""
    supabase = get_supabase_client()
    
    # 크리에이터 존재 확인
    creator = supabase.table("creator_profiles").select("id, sponsorship_available").eq("id", request.creator_id).execute()
    if not creator.data:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    if not creator.data[0].get("sponsorship_available", True):
        raise HTTPException(status_code=400, detail="Creator is not available for sponsorship")
    
    # 요청 생성
    data = request.dict()
    result = supabase.table("sponsorship_requests").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create sponsorship request")
    
    return result.data[0]

@router.get("/{request_id}", response_model=SponsorshipRequestResponse)
async def get_sponsorship_request(request_id: str):
    """협찬 중개 요청 조회"""
    supabase = get_supabase_client()
    
    result = supabase.table("sponsorship_requests").select("*").eq("id", request_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Sponsorship request not found")
    
    return result.data[0]

@router.put("/{request_id}", response_model=SponsorshipRequestResponse)
async def update_sponsorship_request(request_id: str, update: SponsorshipRequestUpdate):
    """협찬 중개 요청 업데이트 (관리자용)"""
    supabase = get_supabase_client()
    
    # 기존 요청 확인
    existing = supabase.table("sponsorship_requests").select("*").eq("id", request_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Sponsorship request not found")
    
    # 업데이트할 데이터만 추출
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    # 상태가 'completed'로 변경되면 수수료 계산
    if update_data.get("status") == "completed" and update_data.get("final_rate"):
        final_rate = update_data["final_rate"]
        commission_rate = existing.data[0].get("commission_rate", 30.00)
        commission_amount = int(final_rate * commission_rate / 100)
        update_data["commission_amount"] = commission_amount
        update_data["completed_at"] = datetime.utcnow().isoformat()
    
    # updated_at 자동 업데이트
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("sponsorship_requests").update(update_data).eq("id", request_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update sponsorship request")
    
    return result.data[0]

@router.get("/", response_model=List[SponsorshipRequestResponse])
async def list_sponsorship_requests(
    status: Optional[str] = None,
    creator_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """협찬 중개 요청 목록 조회 (관리자용)"""
    supabase = get_supabase_client()
    
    query = supabase.table("sponsorship_requests").select("*")
    
    if status:
        query = query.eq("status", status)
    
    if creator_id:
        query = query.eq("creator_id", creator_id)
    
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    return result.data

@router.get("/creator/{creator_id}", response_model=List[SponsorshipRequestResponse])
async def list_creator_sponsorship_requests(creator_id: str):
    """특정 크리에이터의 협찬 중개 요청 목록"""
    supabase = get_supabase_client()
    
    result = supabase.table("sponsorship_requests")\
        .select("*")\
        .eq("creator_id", creator_id)\
        .order("created_at", desc=True)\
        .execute()
    
    return result.data
