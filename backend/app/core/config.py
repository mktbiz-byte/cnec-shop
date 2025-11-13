"""
애플리케이션 설정
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 앱 기본 설정
    APP_NAME: str = "CnecPlus AI"
    DEBUG: bool = False
    
    # 데이터베이스
    DATABASE_URL: str = "sqlite:///./cnecplus.db"  # 기본값, Render에서 PostgreSQL로 오버라이드
    
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
