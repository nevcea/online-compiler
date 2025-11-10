# 정리 스크립트 (PowerShell)

Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan

# Docker 컨테이너 중지 및 제거
Write-Host "🐳 Stopping Docker containers..." -ForegroundColor Blue
docker-compose down -v

# node_modules 제거
Write-Host "📦 Removing node_modules..." -ForegroundColor Blue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force backend/node_modules -ErrorAction SilentlyContinue

# 로그 파일 제거
Write-Host "📝 Removing log files..." -ForegroundColor Blue
Get-ChildItem -Path . -Filter "*.log" -Recurse | Remove-Item -Force

# 임시 파일 제거
Write-Host "🗑️  Removing temporary files..." -ForegroundColor Blue
Remove-Item -Path "backend/code/*" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "backend/output/*" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Cleanup complete!" -ForegroundColor Green

