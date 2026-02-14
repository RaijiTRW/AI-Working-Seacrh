# Simple Deploy Script for JobAI Search
# Kills Node.js, rebuilds, and restarts - no NSSM dependency

param(
    [string]$AppDir = "C:\AI-Working-Seacrh"
)

$ErrorActionPreference = "Stop"

Set-Location $AppDir

Write-Host "========================================"
Write-Host "  JobAI Deploy"
Write-Host "========================================"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Step 1: Pull latest code
Write-Host "[1/5] Pulling latest code..." -ForegroundColor Cyan

$gitToken = $env:GH_DEPLOY_TOKEN
if (-not $gitToken) {
    Write-Host "ERROR: GH_DEPLOY_TOKEN not set!" -ForegroundColor Red
    exit 1
}

& git config --local --unset credential.helper 2>&1 | Out-Null
& git config --local credential.helper "" 2>&1 | Out-Null

$repoUrl = "https://${gitToken}@github.com/RaijiTRW/AI-Working-Seacrh.git"
& git remote set-url origin $repoUrl 2>&1 | Out-Null

Write-Host "Fetching and resetting..."
& git fetch origin main 2>&1 | Out-Host
& git reset --hard origin/main 2>&1 | Out-Host

$newVersion = & git rev-parse --short HEAD
Write-Host "Deploying version: $newVersion"

# Step 2: Kill Node.js process
Write-Host ""
Write-Host "[2/5] Stopping Node.js..." -ForegroundColor Cyan

$count = 0
do {
    $found = $false
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        $found = $true
        Write-Host "  Killing node process $($_.Id)..."
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    if ($found) {
        Start-Sleep -Seconds 2
        $count++
        if ($count -gt 5) {
            Write-Host "  WARNING: Could not kill all node processes" -ForegroundColor Yellow
            break
        }
    }
} while ($found)

# Also kill via port
Start-Sleep -Seconds 2
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "  Killing process $($proc.Id) on port 3000"
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 3

# Step 3: Install dependencies
Write-Host ""
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Cyan

Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
& npm ci 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm ci failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed"

# Step 4: Build
Write-Host ""
Write-Host "[4/5] Building..." -ForegroundColor Cyan

Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue

$env:PORT = "3000"
& npm run build 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed"

$buildIdPath = "$AppDir\.next\BUILD_ID"
if (Test-Path $buildIdPath) {
    $newBuildId = Get-Content $buildIdPath
    Write-Host "New BUILD_ID: $newBuildId"
}

# Step 5: Start Node.js
Write-Host ""
Write-Host "[5/5] Starting Node.js..." -ForegroundColor Cyan

# Create logs directory
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

# Create startup script
$startupBat = @"
@echo off
cd /d $AppDir
set NODE_ENV=production
set PORT=3000
node node_modules\next\bin\next start
"@

$batPath = "$AppDir\start-node.bat"
Set-Content -Path $batPath -Value $startupBat -Encoding ASCII

# Start in background using scheduled task approach or start-process
$nodeExe = "C:\Program Files\nodejs\node.exe"
$nextStart = "node_modules\next\bin\next start"

# Set environment
$env:NODE_ENV = "production"
$env:PORT = "3000"

# Start the process
$process = Start-Process -FilePath $nodeExe -ArgumentList $nextStart -WorkingDirectory $AppDir -WindowStyle Hidden -PassThru

Write-Host "  Started with PID: $($process.Id)"
Start-Sleep -Seconds 10

# Health check
Write-Host ""
Write-Host "Running health check..." -ForegroundColor Cyan

$healthy = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $version = $response.Content | ConvertFrom-Json
            Write-Host "  OK! Version: $($version.version)" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {
        Write-Host "  Attempt $i/30..."
        Start-Sleep -Seconds 2
    }
}

if (-not $healthy) {
    Write-Host "ERROR: Health check failed!" -ForegroundColor Red
    exit 1
}

# Create .version file
Set-Content -Path "$AppDir\.version" -Value $newVersion -Encoding UTF8

Write-Host ""
Write-Host "========================================"
Write-Host "  Deploy Complete!"
Write-Host "========================================"
Write-Host "Version: $newVersion"
Write-Host "PID: $($process.Id)"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# Cleanup
& git config --local --unset credential.helper 2>&1 | Out-Null

exit 0
