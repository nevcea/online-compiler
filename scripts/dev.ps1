Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-LastExitCode {
    param([string]$Step)
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Step (exit code $LASTEXITCODE)"
    }
}

function Resolve-DockerCompose {
    if (docker compose version 2>$null) {
        return @{ Exe = 'docker'; Args = @('compose') }
    } elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        return @{ Exe = 'docker-compose'; Args = @() }
    } else {
        throw 'Docker Compose is not installed. Please install Docker Desktop or docker-compose.'
    }
}

Write-Host "Starting development environment..." -ForegroundColor Cyan
Write-Host "Checking dependencies..." -ForegroundColor Blue

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Blue
npm install
Assert-LastExitCode "npm install (root)"
Push-Location backend
try {
    npm install
    Assert-LastExitCode "npm install (backend)"
} finally {
    Pop-Location
}

Write-Host "Building Docker images..." -ForegroundColor Blue
$compose = Resolve-DockerCompose
$buildArgs = $compose.Args + @('build')
& $compose.Exe @buildArgs
Assert-LastExitCode "docker compose build"

Write-Host "[OK] Starting services..." -ForegroundColor Green
$upArgs = $compose.Args + @('up','-d')
& $compose.Exe @upArgs
Assert-LastExitCode "docker compose up -d"

Push-Location frontend
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
        npm install
        Assert-LastExitCode "npm install (frontend)"
    }
} finally {
    Pop-Location
}

Write-Host "[OK] Development environment is ready!" -ForegroundColor Green
Write-Host "Starting frontend dev server..." -ForegroundColor Blue
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services: docker compose down" -ForegroundColor Yellow
Write-Host "To start frontend manually: cd frontend && npm run dev" -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\frontend'; npm run dev"
Write-Host "To view logs: docker compose logs -f" -ForegroundColor Yellow

