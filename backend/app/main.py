"""
CnecPlus AI - 뷰티 크리에이터 떡상 예측 시스템
Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.api import prediction, newsletter, trends
from app.core.config import settings
from app.db.database import engine, Base

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# FastAPI 앱 생성
app = FastAPI(
    title="CnecPlus AI",
    description="뷰티 크리에이터를 위한 AI 기반 떡상 예측 및 성장 컨설팅 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(prediction.router, prefix="/api/prediction", tags=["예측"])
app.include_router(newsletter.router, prefix="/api/newsletter", tags=["뉴스레터"])
app.include_router(trends.router, prefix="/api/trends", tags=["트렌드"])

# 정적 파일 서빙 (프론트엔드 빌드 파일)
static_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "client", "dist")
if os.path.exists(static_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_path, "assets")), name="assets")

@app.get("/")
async def root():
    """루트 엔드포인트 - 프론트엔드 서빙"""
    if os.path.exists(static_path):
        index_path = os.path.join(static_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    return {
        "message": "CnecPlus AI Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "service": "cnecplus-ai-backend"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
