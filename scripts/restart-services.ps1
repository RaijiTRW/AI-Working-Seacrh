# Restart and fix JobAI services
# Properly configures NSSM services for Next.js

param(
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe",
    [string]$AppDir = "C:\AI-Working-Seacrh"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting JobAI Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop all services
Write-Host "[1/5] Stopping all services..." -ForegroundColor Cyan
& $NssmPath stop jobai-frontend-1 2>&1 | Out-Null
& $NssmPath stop jobai-frontend-2 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Kill any Node processes
Write-Host "[2/5] Killing node processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove services
Write-Host "[3/5] Removing old services..." -ForegroundColor Cyan
& $NssmPath remove jobai-frontend-1 confirm 2>&1 | Out-Null
& $NssmPath remove jobai-frontend-2 confirm 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Install Service 1 (port 3000)
Write-Host "[4/5] Installing jobai-frontend-1 (port 3000)..." -ForegroundColor Cyan
& $NssmPath install jobai-frontend-1 "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppDirectory $AppDir 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppParameters "node_modules\next\bin\next start" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppEnvironmentExtra "NODE_ENV=production;PORT=3000" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 DisplayName "JobAI Frontend 1" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 Description "Next.js frontend instance 1 on port 3000" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 Start SERVICE_AUTO_START 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppStdout "$AppDir\logs\service-1-out.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppStderr "$AppDir\logs\service-1-err.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppRestartDelay 10000 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppThrottle 1500 2>&1 | Out-Null

# Install Service 2 (port 3001)
Write-Host "Installing jobai-frontend-2 (port 3001)..." -ForegroundColor Cyan
& $NssmPath install jobai-frontend-2 "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppDirectory $AppDir 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppParameters "node_modules\next\bin\next start" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppEnvironmentExtra "NODE_ENV=production;PORT=3001" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 DisplayName "JobAI Frontend 2" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 Description "Next.js frontend instance 2 on port 3001" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 Start SERVICE_DEMAND_START 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppStdout "$AppDir\logs\service-2-out.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppStderr "$AppDir\logs\service-2-err.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppRestartDelay 10000 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppThrottle 1500 2>&1 | Out-Null

# Create logs directory
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

# Start Service 1
Write-Host "[5/5] Starting instance 1..." -ForegroundColor Cyan
& $NssmPath start jobai-frontend-1 2>&1 | Out-Null
Start-Sleep -Seconds 10

# Health check
Write-Host ""
Write-Host "Running health check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $version = $response.Content | ConvertFrom-Json
        Write-Host "  Instance 1: OK (version: $($version.version))" -ForegroundColor Green
    }
} catch {
    Write-Host "  Instance 1: FAILED - $_" -ForegroundColor Red
    Write-Host "  Check logs: $AppDir\logs\service-1-err.log" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services Restarted!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Instance 1: Port 3000 (Active)"
Write-Host "Instance 2: Port 3001 (Standby)"
Write-Host ""
