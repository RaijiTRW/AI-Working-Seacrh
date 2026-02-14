# Fix JobAI Frontend Service
# Recreates the NSSM service with correct parameters

param(
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe",
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$ServiceName = "jobai-frontend-1"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fixing JobAI Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Stop and remove service
Write-Host "[1/4] Removing old service..." -ForegroundColor Cyan
& $NssmPath stop $ServiceName 2>&1 | Out-Null
Start-Sleep -Seconds 3
& $NssmPath remove $ServiceName confirm 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Kill node processes
Write-Host "[2/4] Killing node processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Install service with correct parameters
Write-Host "[3/4] Installing service..." -ForegroundColor Cyan
& $NssmPath install $ServiceName "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Null
& $NssmPath set $ServiceName AppDirectory $AppDir 2>&1 | Out-Null
& $NssmPath set $ServiceName AppParameters "node_modules\next\bin\next start" 2>&1 | Out-Null
& $NssmPath set $ServiceName AppEnvironmentExtra "NODE_ENV=production;PORT=3000" 2>&1 | Out-Null
& $NssmPath set $ServiceName DisplayName "JobAI Search Frontend" 2>&1 | Out-Null
& $NssmPath set $ServiceName Description "Next.js frontend for JobAI Search" 2>&1 | Out-Null
& $NssmPath set $ServiceName Start SERVICE_AUTO_START 2>&1 | Out-Null
& $NssmPath set $ServiceName AppStdout "$AppDir\logs\service-out.log" 2>&1 | Out-Null
& $NssmPath set $ServiceName AppStderr "$AppDir\logs\service-err.log" 2>&1 | Out-Null
& $NssmPath set $ServiceName AppRestartDelay 10000 2>&1 | Out-Null

# Create logs directory
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

Write-Host "  Service installed"

# Start service
Write-Host "[4/4] Starting service..." -ForegroundColor Cyan
& $NssmPath start $ServiceName 2>&1 | Out-Null
Start-Sleep -Seconds 10

# Health check
Write-Host ""
Write-Host "Running health check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $version = $response.Content | ConvertFrom-Json
        Write-Host "  Service is running! Version: $($version.version)" -ForegroundColor Green
    }
} catch {
    Write-Host "  Health check failed: $_" -ForegroundColor Red
    Write-Host "  Check logs: $AppDir\logs\service-err.log" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Service Fixed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service: $ServiceName"
Write-Host "Logs: $AppDir\logs\"
Write-Host ""
