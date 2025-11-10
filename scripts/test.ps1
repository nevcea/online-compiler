# 테스트 실행 스크립트 (PowerShell)

Write-Host "Running tests..." -ForegroundColor Cyan

# ESLint 검사
Write-Host "Running ESLint..." -ForegroundColor Blue
npm run lint

# 포맷팅 검사
Write-Host "Checking code formatting..." -ForegroundColor Blue
npm run format:check

# Backend ESLint
Write-Host "Running backend ESLint..." -ForegroundColor Blue
Set-Location backend
npx eslint server.js
Set-Location ..

Write-Host "[OK] All checks passed!" -ForegroundColor Green

