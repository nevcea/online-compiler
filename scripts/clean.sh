#!/bin/bash

# 정리 스크립트

set -e

echo "🧹 Cleaning up..."

# Docker 컨테이너 중지 및 제거
echo "🐳 Stopping Docker containers..."
docker-compose down -v

# node_modules 제거
echo "📦 Removing node_modules..."
rm -rf node_modules backend/node_modules

# 로그 파일 제거
echo "📝 Removing log files..."
find . -name "*.log" -type f -delete

# 임시 파일 제거
echo "🗑️  Removing temporary files..."
rm -rf backend/code/* backend/output/*

echo "✅ Cleanup complete!"

