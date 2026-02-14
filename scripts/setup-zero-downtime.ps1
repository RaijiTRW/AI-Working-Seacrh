# Zero-Downtime Setup for JobAI Search
# Creates two Next.js instances (port 3000 and 3001)
# Caddy switches between them without downtime

param(
    [string]$Domain = "jobaisearch.ru",
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$CaddyDir = "C:\caddy",
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Zero-Downtime Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check NSSM exists
if (-not (Test-Path $NssmPath)) {
    Write-Host "ERROR: NSSM not found at $NssmPath" -ForegroundColor Red
    Write-Host "Please install NSSM first" -ForegroundColor Yellow
    exit 1
}

# Stop existing services
Write-Host "[1/8] Stopping existing services..." -ForegroundColor Cyan
& $NssmPath stop jobai-frontend-1 2>&1 | Out-Null
& $NssmPath stop jobai-frontend-2 2>&1 | Out-Null
& $NssmPath stop jobai-frontend 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Kill node processes
Write-Host "[2/8] Cleaning up node processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove existing services
Write-Host "[3/8] Removing old services..." -ForegroundColor Cyan
& $NssmPath remove jobai-frontend-1 confirm 2>&1 | Out-Null
& $NssmPath remove jobai-frontend-2 confirm 2>&1 | Out-Null
& $NssmPath remove jobai-frontend confirm 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Create logs directory
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

# Install Service 1 (port 3000)
Write-Host "[4/8] Installing jobai-frontend-1 (port 3000)..." -ForegroundColor Cyan
& $NssmPath install jobai-frontend-1 "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppDirectory $AppDir 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppParameters "$AppDir\node_modules\next\bin\next start" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppEnvironmentExtra "NODE_ENV=production;PORT=3000" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 DisplayName "JobAI Frontend 1" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 Description "Next.js frontend instance 1 on port 3000" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 Start SERVICE_AUTO_START 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppStdout "$AppDir\logs\service-1-out.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppStderr "$AppDir\logs\service-1-err.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppRestartDelay 10000 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppThrottle 1500 2>&1 | Out-Null
& $NssmPath set jobai-frontend-1 AppRestartModules 1 2>&1 | Out-Null

# Install Service 2 (port 3001)
Write-Host "[5/8] Installing jobai-frontend-2 (port 3001)..." -ForegroundColor Cyan
& $NssmPath install jobai-frontend-2 "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppDirectory $AppDir 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppParameters "$AppDir\node_modules\next\bin\next start" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppEnvironmentExtra "NODE_ENV=production;PORT=3001" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 DisplayName "JobAI Frontend 2" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 Description "Next.js frontend instance 2 on port 3001" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 Start SERVICE_DEMAND_START 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppStdout "$AppDir\logs\service-2-out.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppStderr "$AppDir\logs\service-2-err.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppRestartDelay 10000 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppThrottle 1500 2>&1 | Out-Null
& $NssmPath set jobai-frontend-2 AppRestartModules 1 2>&1 | Out-Null

# Create active instance tracker
Write-Host "[6/8] Setting up active instance tracking..." -ForegroundColor Cyan
Set-Content -Path "$AppDir\active-instance.txt" -Value "1" -Encoding UTF8

# Create Caddyfile with health check
Write-Host "[7/8] Creating Caddyfile..." -ForegroundColor Cyan
if (-not (Test-Path $CaddyDir)) {
    New-Item -ItemType Directory -Path $CaddyDir -Force | Out-Null
}

$caddyConfig = @"
# Caddyfile for JobAI Search with zero-downtime deployment
$Domain {
    # Try instance 1 first, fallback to instance 2
    reverse_proxy localhost:3000 localhost:3001 {
        # Health check - use healthy instance
        health_uri /api/version
        health_interval 10s
        health_timeout 5s
    }

    encode gzip

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }

    log {
        output file $CaddyDir\access.log
    }
}

www.$Domain {
    redir https://$Domain{uri} permanent
}
"@

Set-Content -Path "$CaddyDir\Caddyfile" -Value $caddyConfig -Encoding UTF8

# Validate Caddyfile
Write-Host "[8/8] Validating Caddyfile..." -ForegroundColor Cyan
& caddy validate --config "$CaddyDir\Caddyfile" --adapter caddyfile

# Start Service 1
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
& $NssmPath start jobai-frontend-1 2>&1 | Out-Null
Start-Sleep -Seconds 10

# Check if service 1 is running
$service1 = Get-Service -Name "jobai-frontend-1" -ErrorAction SilentlyContinue
$node1 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($service1 -and $service1.Status -eq "Running" -and $node1) {
    Write-Host "Instance 1 is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "WARNING: Instance 1 may not be running properly" -ForegroundColor Yellow
}

# Health check
Write-Host ""
Write-Host "Running health check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "Instance 1 health check: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "Instance 1 health check: FAILED" -ForegroundColor Red
    Write-Host $_
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Zero-Downtime Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  jobai-frontend-1 : port 3000 (active)" -ForegroundColor White
Write-Host "  jobai-frontend-2 : port 3001 (standby)" -ForegroundColor White
Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  Start instance 1: & '$NssmPath' start jobai-frontend-1" -ForegroundColor White
Write-Host "  Start instance 2: & '$NssmPath' start jobai-frontend-2" -ForegroundColor White
Write-Host "  Stop instance 1:  & '$NssmPath' stop jobai-frontend-1" -ForegroundColor White
Write-Host "  Stop instance 2:  & '$NssmPath' stop jobai-frontend-2" -ForegroundColor White
Write-Host ""
Write-Host "Logs:" -ForegroundColor Cyan
Write-Host "  $AppDir\logs\" -ForegroundColor White
Write-Host ""
Write-Host "Active instance: $AppDir\active-instance.txt" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
