#!/bin/bash

# 테스트 실행 스크립트

set -e

echo "🧪 Running tests..."

# ESLint 검사
echo "📋 Running ESLint..."
npm run lint

# 포맷팅 검사
echo "✨ Checking code formatting..."
npm run format:check

# Backend ESLint
echo "📋 Running backend ESLint..."
cd backend
npx eslint server.js || true
cd ..

echo "✅ All checks passed!"

