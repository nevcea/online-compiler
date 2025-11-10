# 개발 환경 시작 스크립트 (PowerShell)

Write-Host "🚀 Starting development environment..." -ForegroundColor Cyan

# 의존성 확인
Write-Host "📦 Checking dependencies..." -ForegroundColor Blue

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# 의존성 설치
Write-Host "📥 Installing dependencies..." -ForegroundColor Blue
npm install
Set-Location backend
npm install
Set-Location ..

# Docker 이미지 빌드
Write-Host "🐳 Building Docker images..." -ForegroundColor Blue
docker-compose build

# 개발 서버 시작
Write-Host "✅ Starting services..." -ForegroundColor Green
docker-compose up -d

Write-Host "✅ Development environment is ready!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services: docker-compose down" -ForegroundColor Yellow
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Yellow

