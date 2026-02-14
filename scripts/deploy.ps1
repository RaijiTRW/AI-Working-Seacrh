# Deploy Script for JobAI Search - Uses bat file wrapper
# This works around NSSM issues with Next.js start command

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

Write-Host "Fetching and resetting..."
& git fetch origin main 2>&1 | Out-Host
& git reset --hard origin/main 2>&1 | Out-Host

$newVersion = & git rev-parse --short HEAD
Write-Host "Deploying version: $newVersion"

# Step 2: Create proper bat file wrapper
Write-Host ""
Write-Host "[2/6] Creating startup script..." -ForegroundColor Cyan

$batContent = @"
@echo off
cd /d $AppDir
set NODE_ENV=production
set PORT=3000
node "node_modules\next\dist\bin\next" start
"@

$batPath = "$AppDir\start-nextjs.bat"
Set-Content -Path $batPath -Value $batContent -Encoding ASCII
Write-Host "  Created: $batPath"

# Step 3: Stop service and kill processes
Write-Host ""
Write-Host "[3/6] Stopping services..." -ForegroundColor Cyan

$NssmPath = "C:\nssm-2.24\win64\nssm.exe"
$ServiceName = "jobai-frontend-1"

# Try to stop service
& $NssmPath stop $ServiceName 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Kill node processes
for ($attempt = 1; $attempt -le 10; $attempt++) {
    $found = $false
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        $found = $true
        Write-Host "  Killing node process $($_.Id)..."
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }

    # Check port 3000
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            $found = $true
            Write-Host "  Killing process $($proc.Id) on port 3000"
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }

    if (-not $found) {
        Write-Host "  All processes stopped" -ForegroundColor Green
        break
    }

    Start-Sleep -Seconds 2
}

Start-Sleep -Seconds 3

# Step 4: Install dependencies and build
Write-Host ""
Write-Host "[4/6] Installing dependencies..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

& npm ci 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm ci failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed"

Write-Host ""
Write-Host "Building..." -ForegroundColor Cyan

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

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

# Step 5: Update service to use bat file
Write-Host ""
Write-Host "[5/6] Updating service..." -ForegroundColor Cyan

$cmdExe = "$env:SystemRoot\System32\cmd.exe"
& $NssmPath set $ServiceName Application $cmdExe 2>&1 | Out-Null
& $NssmPath set $ServiceName AppParameters "/c `"$batPath`"" 2>&1 | Out-Null
& $NssmPath set $ServiceName AppDirectory $AppDir 2>&1 | Out-Null

Write-Host "  Service updated to use bat file"

# Step 6: Start service
Write-Host ""
Write-Host "[6/6] Starting service..." -ForegroundColor Cyan

# Create logs directory
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

& $NssmPath start $ServiceName 2>&1 | Out-Host
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
    Write-Host "Check logs: $AppDir\logs\service-err.log" -ForegroundColor Yellow
    exit 1
}

# Create .version file
Set-Content -Path "$AppDir\.version" -Value $newVersion -Encoding UTF8

Write-Host ""
Write-Host "========================================"
Write-Host "  Deploy Complete!"
Write-Host "========================================"
Write-Host "Version: $newVersion"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# Cleanup
& git config --local --unset credential.helper 2>&1 | Out-Null

exit 0
