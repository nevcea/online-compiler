Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-DockerCompose {
    if (docker compose version 2>$null) {
        return @{ Exe = 'docker'; Args = @('compose') }
    } elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        return @{ Exe = 'docker-compose'; Args = @() }
    } else {
        return $null
    }
}

Write-Host "Cleaning up..." -ForegroundColor Cyan

Write-Host "Stopping Docker containers..." -ForegroundColor Blue
$compose = Resolve-DockerCompose
if ($compose -ne $null) {
    try {
        $downArgs = $compose.Args + @('down','-v')
        & $compose.Exe @downArgs
    } catch {
    }
}

Write-Host "Removing node_modules..." -ForegroundColor Blue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force backend/node_modules -ErrorAction SilentlyContinue

Write-Host "Removing log files..." -ForegroundColor Blue
Get-ChildItem -Path . -Filter "*.log" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Removing temporary files..." -ForegroundColor Blue
Remove-Item -Path "backend/code/*" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "backend/output/*" -Force -ErrorAction SilentlyContinue

Write-Host "[OK] Cleanup complete!" -ForegroundColor Green

