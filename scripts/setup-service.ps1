# Fix NSSM service to run Next.js correctly
# Run this script as Administrator ONCE on the VDS

param(
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe",
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$ServiceName = "jobai-frontend-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fixing NSSM Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script fixes the NSSM service to run Next.js correctly."
Write-Host "Please run as Administrator!" -ForegroundColor Yellow
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Not running as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Stop service
Write-Host "[1/5] Stopping service..." -ForegroundColor Cyan
& $NssmPath stop $ServiceName 2>&1 | Out-Host
Start-Sleep -Seconds 3

# Kill node processes
Write-Host "[2/5] Killing node processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Killing process $($_.Id)"
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# Remove service
Write-Host "[3/5] Removing old service..." -ForegroundColor Cyan
& $NssmPath remove $ServiceName confirm 2>&1 | Out-Host
Start-Sleep -Seconds 2

# Create logs directory
Write-Host "[4/5] Creating logs directory..." -ForegroundColor Cyan
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

# Install service with correct parameters
Write-Host "[5/5] Installing service..." -ForegroundColor Cyan
& $NssmPath install $ServiceName "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Host
& $NssmPath set $ServiceName AppDirectory $AppDir 2>&1 | Out-Host
& $NssmPath set $ServiceName AppParameters "node_modules\next\bin\next start" 2>&1 | Out-Host
& $NssmPath set $ServiceName AppEnvironmentExtra "NODE_ENV=production;PORT=3000" 2>&1 | Out-Host
& $NssmPath set $ServiceName DisplayName "JobAI Search Frontend" 2>&1 | Out-Host
& $NssmPath set $ServiceName Description "Next.js frontend for JobAI Search" 2>&1 | Out-Host
& $NssmPath set $ServiceName Start SERVICE_AUTO_START 2>&1 | Out-Host
& $NssmPath set $ServiceName AppStdout "$AppDir\logs\service-out.log" 2>&1 | Out-Host
& $NssmPath set $ServiceName AppStderr "$AppDir\logs\service-err.log" 2>&1 | Out-Host
& $NssmPath set $ServiceName AppRestartDelay 10000 2>&1 | Out-Host

Write-Host "  Service installed" -ForegroundColor Green

# Start service
Write-Host ""
Write-Host "Starting service..." -ForegroundColor Cyan
& $NssmPath start $ServiceName 2>&1 | Out-Host
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
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Service Fixed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The service will now automatically restart on boot."
Write-Host "Deploy script can now restart the service properly."
Write-Host ""
