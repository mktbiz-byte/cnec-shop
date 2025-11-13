"""
Supabase 클라이언트 설정
"""
from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """Supabase 클라이언트 인스턴스 반환"""
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_ANON_KEY
    )

# 전역 클라이언트 인스턴스
supabase: Client = get_supabase_client()
