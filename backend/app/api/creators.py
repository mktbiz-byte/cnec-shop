"""
크리에이터 프로필 API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from app.db.supabase_client import get_supabase_client
import uuid

router = APIRouter()

# Pydantic 스키마
class FeaturedVideo(BaseModel):
    video_id: str
    title: str
    thumbnail: str
    views: int

class CreatorProfileCreate(BaseModel):
    username: str
    display_name: str
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    youtube_channel_id: Optional[str] = None
    youtube_channel_url: Optional[str] = None
    subscriber_count: int = 0
    average_views: int = 0
    sponsorship_rate: int
    preferred_categories: List[str] = []
    email: Optional[EmailStr] = None
    contact_method: Optional[str] = None
    contact_value: Optional[str] = None
    featured_videos: List[FeaturedVideo] = []

class CreatorProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    youtube_channel_id: Optional[str] = None
    youtube_channel_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    average_views: Optional[int] = None
    sponsorship_rate: Optional[int] = None
    sponsorship_available: Optional[bool] = None
    preferred_categories: Optional[List[str]] = None
    email: Optional[EmailStr] = None
    contact_method: Optional[str] = None
    contact_value: Optional[str] = None
    featured_videos: Optional[List[FeaturedVideo]] = None

class CreatorProfileResponse(BaseModel):
    id: str
    username: str
    display_name: str
    bio: Optional[str]
    profile_image_url: Optional[str]
    youtube_channel_id: Optional[str]
    youtube_channel_url: Optional[str]
    subscriber_count: int
    average_views: int
    sponsorship_rate: int
    sponsorship_available: bool
    preferred_categories: List[str]
    email: Optional[str]
    contact_method: Optional[str]
    contact_value: Optional[str]
    featured_videos: List[dict]
    created_at: str
    is_verified: bool
    is_active: bool

@router.post("/", response_model=CreatorProfileResponse)
async def create_profile(profile: CreatorProfileCreate):
    """크리에이터 프로필 생성"""
    supabase = get_supabase_client()
    
    # username 중복 체크
    existing = supabase.table("creator_profiles").select("id").eq("username", profile.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # featured_videos를 dict 리스트로 변환
    featured_videos_data = [video.dict() for video in profile.featured_videos]
    
    # 프로필 생성
    data = profile.dict()
    data["featured_videos"] = featured_videos_data
    
    result = supabase.table("creator_profiles").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create profile")
    
    return result.data[0]

@router.get("/@{username}", response_model=CreatorProfileResponse)
async def get_profile(username: str):
    """크리에이터 프로필 조회"""
    supabase = get_supabase_client()
    
    result = supabase.table("creator_profiles").select("*").eq("username", username).eq("is_active", True).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return result.data[0]

@router.put("/@{username}", response_model=CreatorProfileResponse)
async def update_profile(username: str, profile: CreatorProfileUpdate):
    """크리에이터 프로필 수정"""
    supabase = get_supabase_client()
    
    # 기존 프로필 확인
    existing = supabase.table("creator_profiles").select("id").eq("username", username).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # 업데이트할 데이터만 추출
    update_data = {k: v for k, v in profile.dict().items() if v is not None}
    
    # featured_videos가 있으면 dict 리스트로 변환
    if "featured_videos" in update_data:
        update_data["featured_videos"] = [video.dict() if hasattr(video, 'dict') else video for video in update_data["featured_videos"]]
    
    # updated_at 자동 업데이트
    update_data["updated_at"] = "now()"
    
    result = supabase.table("creator_profiles").update(update_data).eq("username", username).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    
    return result.data[0]

@router.get("/", response_model=List[CreatorProfileResponse])
async def list_profiles(limit: int = 20, offset: int = 0):
    """크리에이터 프로필 목록 조회"""
    supabase = get_supabase_client()
    
    result = supabase.table("creator_profiles")\
        .select("*")\
        .eq("is_active", True)\
        .order("created_at", desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    
    return result.data
