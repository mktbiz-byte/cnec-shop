#!/bin/bash
set -e

echo "=== Building CnecPlus AI (Backend + Frontend) ==="

# 백엔드 의존성 설치
echo "Installing backend dependencies..."
cd /opt/render/project/src/backend
pip install -r requirements.txt

# 프론트엔드 빌드
echo "Building frontend..."
cd /opt/render/project/src/frontend
npm install
npm run build

echo "=== Build completed successfully ==="
