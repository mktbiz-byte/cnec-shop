"""
CnecPlus AI - 뷰티 크리에이터 떡상 예측 시스템
Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.api import reports, creators, sponsorships
from app.core.config import settings

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
app.include_router(reports.router, prefix="/api/reports", tags=["리포트"])
app.include_router(creators.router, prefix="/api/creators", tags=["크리에이터"])
app.include_router(sponsorships.router, prefix="/api/sponsorships", tags=["협찬 중개"])

# 정적 파일 서빙 (프론트엔드 빌드 파일)
# Render 환경에서는 /opt/render/project/src/가 루트 경로
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
static_path = os.path.join(base_dir, "frontend", "dist", "public")
print(f"[DEBUG] Base dir: {base_dir}")
print(f"[DEBUG] Static path: {static_path}")
print(f"[DEBUG] Static path exists: {os.path.exists(static_path)}")
if os.path.exists(static_path):
    assets_path = os.path.join(static_path, "assets")
    print(f"[DEBUG] Mounting /assets from {assets_path}")
    print(f"[DEBUG] Assets path exists: {os.path.exists(assets_path)}")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

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

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """모든 경로를 index.html로 리다이렉트 (SPA 지원)"""
    # API 경로는 제외
    if full_path.startswith("api/") or full_path == "health":
        return {"error": "Not found"}
    
    if os.path.exists(static_path):
        index_path = os.path.join(static_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    return {"error": "Frontend not found"}

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
