"""
영상 분석 리포트 API 라우터
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.services.video_analyzer import analyze_video
from app.db.supabase_client import supabase

router = APIRouter()

class VideoReportRequest(BaseModel):
    video_url: str

class VideoReport(BaseModel):
    id: str
    video_id: str
    video_url: str
    title: str
    channel_name: Optional[str]
    view_count: Optional[int]
    like_count: Optional[int]
    comment_count: Optional[int]
    published_at: Optional[str]
    thumbnail_url: Optional[str]
    analysis_report: str
    success_score: Optional[int]
    trending_keywords: Optional[List[str]]
    created_at: str

@router.post("/generate", response_model=VideoReport)
async def generate_report(request: VideoReportRequest):
    """
    유튜브 영상 URL을 받아 분석 리포트 생성 및 저장
    """
    try:
        # 1. 영상 분석
        analysis_data = await analyze_video(request.video_url)
        if not analysis_data:
            raise HTTPException(status_code=400, detail="유효하지 않은 유튜브 URL이거나 영상을 찾을 수 없습니다.")
        
        # 2. 기존 리포트 확인 (중복 방지)
        existing = supabase.table('video_reports').select('*').eq('video_id', analysis_data['video_id']).execute()
        
        if existing.data:
            # 기존 리포트 반환
            return existing.data[0]
        
        # 3. Supabase에 저장
        insert_data = {
            'video_id': analysis_data['video_id'],
            'video_url': analysis_data['video_url'],
            'title': analysis_data['title'],
            'channel_name': analysis_data.get('channel_name'),
            'view_count': analysis_data.get('view_count'),
            'like_count': analysis_data.get('like_count'),
            'comment_count': analysis_data.get('comment_count'),
            'published_at': analysis_data.get('published_at'),
            'thumbnail_url': analysis_data.get('thumbnail_url'),
            'analysis_report': analysis_data['analysis_report'],
            'success_score': analysis_data.get('success_score'),
            'trending_keywords': analysis_data.get('trending_keywords', [])
        }
        
        result = supabase.table('video_reports').insert(insert_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="리포트 저장에 실패했습니다.")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리포트 생성 중 오류 발생: {str(e)}")

@router.get("", response_model=List[VideoReport])
@router.get("/", response_model=List[VideoReport])
async def get_reports(limit: int = 10, offset: int = 0):
    """
    저장된 리포트 목록 조회 (최신순)
    슬래시 있는 경로와 없는 경로 모두 지원
    """
    try:
        result = supabase.table('video_reports')\
            .select('*')\
            .order('created_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리포트 조회 중 오류 발생: {str(e)}")

@router.get("/{report_id}", response_model=VideoReport)
async def get_report(report_id: str):
    """
    특정 리포트 상세 조회
    """
    try:
        result = supabase.table('video_reports')\
            .select('*')\
            .eq('id', report_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="리포트를 찾을 수 없습니다.")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리포트 조회 중 오류 발생: {str(e)}")

@router.get("/top/success", response_model=List[VideoReport])
async def get_top_reports(limit: int = 5):
    """
    성공 점수 높은 순으로 리포트 조회
    """
    try:
        result = supabase.table('video_reports')\
            .select('*')\
            .order('success_score', desc=True)\
            .limit(limit)\
            .execute()
        
        return result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리포트 조회 중 오류 발생: {str(e)}")
