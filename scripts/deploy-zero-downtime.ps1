# Zero-Downtime Deploy Script for JobAI Search
# Simplified version that restarts Node.js process directly

param(
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$ActiveFile = "$AppDir\active-instance.txt"
)

$ErrorActionPreference = "Stop"

Set-Location $AppDir

Write-Host "========================================"
Write-Host "  Zero-Downtime Deploy"
Write-Host "========================================"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Step 1: Pull latest code
Write-Host "[1/6] Pulling latest code..." -ForegroundColor Cyan

$gitToken = $env:GH_DEPLOY_TOKEN
if (-not $gitToken) {
    Write-Host "ERROR: GH_DEPLOY_TOKEN not set!" -ForegroundColor Red
    exit 1
}

& git config --local --unset credential.helper 2>&1 | Out-Null
& git config --local credential.helper "" 2>&1 | Out-Null

$repoUrl = "https://${gitToken}@github.com/RaijiTRW/AI-Working-Seacrh.git"
& git remote set-url origin $repoUrl 2>&1 | Out-Null

# Always pull latest code
Write-Host "Pulling from origin..."
& git fetch origin main 2>&1 | Out-Host
& git reset --hard origin/main 2>&1 | Out-Host

$newVersion = & git rev-parse --short HEAD
Write-Host "Deploying version: $newVersion"

# Step 2: Kill running Node.js process
Write-Host ""
Write-Host "[2/6] Stopping current instance..." -ForegroundColor Cyan

Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Double check and kill any process on port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "  Killing process $($proc.Id) on port 3000"
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

# Step 3: Install dependencies
Write-Host ""
Write-Host "[3/6] Installing dependencies..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

& npm ci 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm ci failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed"

# Step 4: Build
Write-Host ""
Write-Host "[4/6] Building..." -ForegroundColor Cyan

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

$env:PORT = "3000"
& npm run build 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed"

# Get build ID
$buildIdPath = "$AppDir\.next\BUILD_ID"
if (Test-Path $buildIdPath) {
    $newBuildId = Get-Content $buildIdPath
    Write-Host "New BUILD_ID: $newBuildId"
} else {
    Write-Host "WARNING: BUILD_ID not found at $buildIdPath"
    $newBuildId = "unknown"
}

# Step 5: Start Next.js
Write-Host ""
Write-Host "[5/6] Starting Next.js..." -ForegroundColor Cyan

# Create logs directory
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "3000"

# Start Next.js in background
$nodeExe = "C:\Program Files\nodejs\node.exe"
$nextStart = "$AppDir\node_modules\next\bin\next start"

$process = Start-Process -FilePath $nodeExe -ArgumentList $nextStart -WorkingDirectory $AppDir -WindowStyle Hidden -PassThru

Write-Host "  Started with PID: $($process.Id)"
Start-Sleep -Seconds 10

# Step 6: Health check
Write-Host ""
Write-Host "[6/6] Health check..." -ForegroundColor Cyan

$healthy = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $version = $response.Content | ConvertFrom-Json
            Write-Host "  Instance is healthy! Version: $($version.version)" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {
        Write-Host "  Attempt $i/30..."
        Start-Sleep -Seconds 2
    }
}

if (-not $healthy) {
    Write-Host "ERROR: Instance failed health check!" -ForegroundColor Red
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Create .version file for API endpoint
Set-Content -Path "$AppDir\.version" -Value $newVersion -Encoding UTF8

# Final health check through Caddy
Write-Host ""
Write-Host "Checking external access..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "https://jobaisearch.ru/api/version" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $version = $response.Content | ConvertFrom-Json
        Write-Host "  Site is accessible! Version: $($version.version)" -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING: Could not verify through HTTPS" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Deploy Complete!"
Write-Host "========================================"
Write-Host "New BUILD_ID: $newBuildId"
Write-Host "Version: $newVersion"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# Cleanup git credentials
& git config --local --unset credential.helper 2>&1 | Out-Null

exit 0
