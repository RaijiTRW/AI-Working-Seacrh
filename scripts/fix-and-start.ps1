# Fix and Start All Services
# Caddy is at C:\ProgramData\chocolatey\bin\caddy.exe
# NSSM is at C:\nssm-2.24\win64\nssm.exe

param(
    [string]$CaddyExe = "C:\ProgramData\chocolatey\bin\caddy.exe",
    [string]$CaddyDir = "C:\caddy",
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe",
    [string]$AppDir = "C:\AI-Working-Seacrh"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix and Start Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Kill any existing Caddy or Node processes
Write-Host "[1/6] Cleaning up processes..." -ForegroundColor Cyan
Get-Process -Name "caddy" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Step 2: Remove any existing Caddy service
Write-Host "[2/6] Setting up Caddy service..." -ForegroundColor Cyan
& $NssmPath stop Caddy 2>&1 | Out-Null
& $NssmPath remove Caddy confirm 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Create Caddyfile
$caddyConfig = @"
jobaisearch.ru {
    reverse_proxy localhost:3000
    encode gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
    log {
        output file $CaddyDir\access.log
    }
}

www.jobaisearch.ru {
    redir https://jobaisearch.ru{uri} permanent
}
"@

Set-Content -Path "$CaddyDir\Caddyfile" -Value $caddyConfig -Encoding UTF8

# Install Caddy as service
& $NssmPath install Caddy $CaddyExe "run --config $CaddyDir\Caddyfile" 2>&1 | Out-Null
& $NssmPath set Caddy Start SERVICE_AUTO_START 2>&1 | Out-Null
& $NssmPath set Caddy AppStdout "$CaddyDir\caddy-out.log" 2>&1 | Out-Null
& $NssmPath set Caddy AppStderr "$CaddyDir\caddy-err.log" 2>&1 | Out-Null
& $NssmPath set Caddy AppRestartDelay 10000 2>&1 | Out-Null

Write-Host "  Caddy service installed" -ForegroundColor Green

# Step 3: Setup Next.js service
Write-Host "[3/6] Setting up Next.js service..." -ForegroundColor Cyan

# Remove old services
& $NssmPath stop jobai-frontend 2>&1 | Out-Null
& $NssmPath remove jobai-frontend confirm 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Install Next.js service
& $NssmPath install jobai-frontend "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Null
& $NssmPath set jobai-frontend AppDirectory $AppDir 2>&1 | Out-Null
& $NssmPath set jobai-frontend AppParameters "node_modules\next\bin\next start" 2>&1 | Out-Null
& $NssmPath set jobai-frontend AppEnvironmentExtra "NODE_ENV=production;PORT=3000" 2>&1 | Out-Null
& $NssmPath set jobai-frontend DisplayName "JobAI Search Frontend" 2>&1 | Out-Null
& $NssmPath set jobai-frontend Description "Next.js frontend for JobAI Search" 2>&1 | Out-Null
& $NssmPath set jobai-frontend Start SERVICE_AUTO_START 2>&1 | Out-Null
& $NssmPath set jobai-frontend AppStdout "$AppDir\logs\service-out.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend AppStderr "$AppDir\logs\service-err.log" 2>&1 | Out-Null
& $NssmPath set jobai-frontend AppRestartDelay 10000 2>&1 | Out-Null

Write-Host "  Next.js service installed" -ForegroundColor Green

# Step 4: Start Caddy
Write-Host "[4/6] Starting Caddy..." -ForegroundColor Cyan
& $NssmPath start Caddy 2>&1 | Out-Null
Start-Sleep -Seconds 5

$caddyStatus = Get-Service -Name "Caddy" -ErrorAction SilentlyContinue
if ($caddyStatus -and $caddyStatus.Status -eq "Running") {
    Write-Host "  Caddy is running!" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Caddy may not be running" -ForegroundColor Yellow
}

# Step 5: Start Next.js
Write-Host "[5/6] Starting Next.js..." -ForegroundColor Cyan
& $NssmPath start jobai-frontend 2>&1 | Out-Null
Start-Sleep -Seconds 10

$nextStatus = Get-Service -Name "jobai-frontend" -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($nextStatus -and $nextStatus.Status -eq "Running") {
    Write-Host "  Next.js service is running!" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Next.js service may not be running" -ForegroundColor Yellow
}

if ($port3000) {
    Write-Host "  Port 3000 is listening!" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Port 3000 not listening" -ForegroundColor Yellow
}

# Step 6: Health checks
Write-Host "[6/6] Health checks..." -ForegroundColor Cyan

# Check Next.js directly
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  Next.js: OK (version: $($response.Content))" -ForegroundColor Green
    } else {
        Write-Host "  Next.js: Unexpected status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Next.js: Failed - $_" -ForegroundColor Red
}

# Check Caddy (through HTTP first)
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/version" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  Caddy HTTP proxy: OK" -ForegroundColor Green
    } else {
        Write-Host "  Caddy HTTP proxy: Failed with status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Caddy HTTP proxy: Failed - $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Site: https://jobaisearch.ru"
Write-Host "Logs: $AppDir\logs\"
Write-Host ""
Write-Host "Services:"
Write-Host "  Caddy:    & '$NssmPath' status Caddy"
Write-Host "  Next.js:  & '$NssmPath' status jobai-frontend"
Write-Host ""
Write-Host "To restart:"
Write-Host "  & '$NssmPath' restart Caddy"
Write-Host "  & '$NssmPath' restart jobai-frontend"
Write-Host ""
