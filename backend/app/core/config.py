"""
애플리케이션 설정
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 앱 기본 설정
    APP_NAME: str = "CnecPlus AI"
    DEBUG: bool = False
    
    # Supabase 설정
    SUPABASE_URL: str = "https://miwcvuwvuhnsieytvife.supabase.co"
    SUPABASE_ANON_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pd2N2dXd2dWhuc2lleXR2aWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMTExNTEsImV4cCI6MjA3ODU4NzE1MX0.1R2AzSNeZvpnDZFxYT8Y6iqGkhykHD86Ulj2V-UHqUQ"
    
    # API 키
    YOUTUBE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # 보안
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # 유튜브 API 설정
    YOUTUBE_QUOTA_LIMIT: int = 10000
    DATA_RETENTION_DAYS: int = 30  # API 정책 준수: 30일 데이터 보관
    
    # 뉴스레터 설정
    NEWSLETTER_FROM_EMAIL: str = "newsletter@cnecplus.com"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
