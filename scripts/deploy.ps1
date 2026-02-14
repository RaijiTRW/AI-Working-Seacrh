# Simple Deploy Script - Start Node.js directly
# Runs node.exe directly without NSSM or scheduled tasks

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

# Function to keep Node.js running
function Start-NodeJs {
    param(
        [string]$WorkingDir,
        [int]$Port = 3000
    )

    $env:NODE_ENV = "production"
    $env:PORT = $Port

    $nodeExe = "C:\Program Files\nodejs\node.exe"
    $nextBin = "$WorkingDir\node_modules\next\dist\bin\next"
    $nextStart = "$nextBin start"

    # Start node in background
    $process = Start-Process -FilePath $nodeExe -ArgumentList $nextStart -WorkingDirectory $WorkingDir -WindowStyle Hidden -PassThru

    # Write PID to file for later killing
    $process.Id | Out-File -FilePath "$WorkingDir\node.pid" -Encoding UTF8

    return $process
}

# Function to kill Node.js
function Stop-NodeJs {
    param([string]$PidFile)

    # Try to read PID file
    if (Test-Path $PidFile) {
        try {
            $pid = Get-Content $PidFile
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  Killing process $pid (from PID file)..."
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        } catch {}
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }

    # Also kill all node processes on our port
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq "node") {
            Write-Host "  Killing process $($proc.Id) on port 3000..."
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }

    # Fallback: kill all node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  Killing node process $($_.Id)..."
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }

    Start-Sleep -Seconds 3

    # Verify port is free
    $portCheck = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Host "  WARNING: Port 3000 still in use!" -ForegroundColor Yellow
        return $false
    }

    return $true
}

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

# Step 2: Stop Node.js
Write-Host ""
Write-Host "[2/5] Stopping Node.js..." -ForegroundColor Cyan

$stopped = Stop-NodeJs -PidFile "$AppDir\node.pid"
if (-not $stopped) {
    Write-Host "ERROR: Could not stop Node.js" -ForegroundColor Red
    exit 1
}

# Step 3: Install dependencies
Write-Host ""
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Cyan

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

# Step 4: Build
Write-Host ""
Write-Host "[4/5] Building..." -ForegroundColor Cyan

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

# Step 5: Start Node.js
Write-Host ""
Write-Host "[5/5] Starting Node.js..." -ForegroundColor Cyan

$process = Start-NodeJs -WorkingDir $AppDir -Port 3000
Write-Host "  Started with PID: $($process.Id)"

Start-Sleep -Seconds 10

# Step 6: Health check
Write-Host ""
Write-Host "[5/5] Health check..." -ForegroundColor Cyan

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
    # Kill the process we just started
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
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
Write-Host "PID File: $AppDir\node.pid"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# Cleanup
& git config --local --unset credential.helper 2>&1 | Out-Null

exit 0
