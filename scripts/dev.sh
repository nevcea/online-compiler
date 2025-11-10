#!/bin/bash

# 개발 환경 시작 스크립트

set -e

echo "🚀 Starting development environment..."

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 의존성 확인
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# 의존성 설치
echo -e "${BLUE}📥 Installing dependencies...${NC}"
npm install
cd backend && npm install && cd ..

# Docker 이미지 빌드
echo -e "${BLUE}🐳 Building Docker images...${NC}"
docker-compose build

# 개발 서버 시작
echo -e "${GREEN}✅ Starting services...${NC}"
docker-compose up -d

echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo -e "${BLUE}Frontend: http://localhost:8080${NC}"
echo -e "${BLUE}Backend API: http://localhost:3000${NC}"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"

