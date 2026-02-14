# Zero-Downtime Deploy Script for JobAI Search
# Fixed to properly handle .next locations and verify service status

param(
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe",
    [string]$ActiveFile = "$AppDir\active-instance.txt"
)

Set-Location $AppDir
$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "  Zero-Downtime Deploy"
Write-Host "========================================"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Get current active instance
if (Test-Path $ActiveFile) {
    $currentActive = Get-Content $ActiveFile
} else {
    $currentActive = "1"
    Set-Content -Path $ActiveFile -Value "1" -Encoding UTF8
}

# Determine which instance to deploy
if ($currentActive -eq "1") {
    $newActive = "2"
    $stopService = "jobai-frontend-1"
    $startService = "jobai-frontend-2"
    $buildPort = "3001"
    $activePort = "3000"
    $activeService = "jobai-frontend-1"
} else {
    $newActive = "1"
    $stopService = "jobai-frontend-2"
    $startService = "jobai-frontend-1"
    $buildPort = "3001"
    $activePort = "3000"
    $activeService = "jobai-frontend-1"
}

Write-Host "Current active: Instance $currentActive | New: $newActive (port $buildPort)"

# Step 1: Pull latest code
Write-Host ""
Write-Host "[1/9] Pulling latest code..." -ForegroundColor Cyan

$gitToken = $env:GH_DEPLOY_TOKEN
if (-not $gitToken) {
    Write-Host "ERROR: GH_DEPLOY_TOKEN not set!" -ForegroundColor Red
    exit 1
}

& git config --local --unset credential.helper 2>&1 | Out-Null
& git config --local credential.helper "" 2>&1 | Out-Null

$repoUrl = "https://${gitToken}@github.com/RaijiTRW/AI-Working-Seacrh.git"
& git remote set-url origin $repoUrl 2>&1 | Out-Null

try {
    & git fetch origin main 2>&1 | Out-Host
    & git reset --hard origin/main 2>&1 | Out-Host
    & git clean -fd 2>&1 | Out-Null
} catch {
    Write-Host "ERROR: Git pull failed!" -ForegroundColor Red
    exit 1
}

$newVersion = git rev-parse --short HEAD
Write-Host "New version: $newVersion"

# Step 2: Stop old service if needed
Write-Host ""
Write-Host "[2/9] Stopping services..." -ForegroundColor Cyan

if ($currentActive -eq $newActive) {
    Write-Host "  Same instance - skipping stop"
} else {
    & $NssmPath stop $stopService 2>&1 | Out-Null
    Start-Sleep -Seconds 3

    # Kill any process on build port
    Get-NetTCPConnection -LocalPort $buildPort -ErrorAction SilentlyContinue | ForEach-Object {
        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  Killing process $($_.OwningProcess) on port $buildPort"
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

# Step 3: Install dependencies
Write-Host ""
Write-Host "[3/9] Installing dependencies..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

& npm ci 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm ci failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed"

# Step 4: Build on deploy port
Write-Host ""
Write-Host "[4/9] Building on port $buildPort..." -ForegroundColor Cyan

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

if (Test-Path ".next.$buildPort") {
    Remove-Item -Recurse -Force ".next.$buildPort" -ErrorAction SilentlyContinue
}

$env:PORT = $buildPort
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

# Step 5: Start standby instance
Write-Host ""
Write-Host "[5/9] Starting standby instance $newActive..." -ForegroundColor Cyan

# Kill any process on build port
Get-NetTCPConnection -LocalPort $buildPort -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

# Start standby service
& $NssmPath start $startService 2>&1 | Out-Null
Start-Sleep -Seconds 10

# Check standby instance health
Write-Host ""
Write-Host "[6/9] Checking standby instance health..." -ForegroundColor Cyan

$standbyHealthy = $false
for ($i = 1; $i -le 20; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$buildPort/api/version" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "  Standby instance is healthy!" -ForegroundColor Green
            $standbyHealthy = $true
            break
        }
    } catch {
        Write-Host "  Attempt $i/20..."
        Start-Sleep -Seconds 2
    }
}

if (-not $standbyHealthy) {
    Write-Host "ERROR: Standby instance failed health check!" -ForegroundColor Red
    & $NssmPath stop $startService 2>&1 | Out-Null
    exit 1
}

# Step 7: Update Caddy to point to new instance
Write-Host ""
Write-Host "[7/9] Updating Caddy to port $buildPort..." -ForegroundColor Cyan

$caddyConfig = @"
# Caddyfile for JobAI Search - Instance $newActive active
jobaisearch.ru {
    reverse_proxy localhost:$buildPort
    encode gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
    log {
        output file C:\caddy\access.log
    }
}

www.jobaisearch.ru {
    redir https://jobaisearch.ru{uri} permanent
}
"@

Set-Content -Path "C:\caddy\Caddyfile" -Value $caddyConfig -Encoding UTF8

# Restart Caddy service to pick up new config
Write-Host "  Restarting Caddy service..."
& $NssmPath restart Caddy 2>&1 | Out-Null
Start-Sleep -Seconds 5

# Step 8: Stop old instance if swapping
Write-Host ""
Write-Host "[8/9] Stopping old instance $currentActive..." -ForegroundColor Cyan

if ($currentActive -ne $newActive) {
    & $NssmPath stop $stopService 2>&1 | Out-Null
    Start-Sleep -Seconds 3
}

# Update active instance file
Set-Content -Path $ActiveFile -Value $newActive -Encoding UTF8

# Final health check through Caddy
Write-Host ""
Write-Host "[9/9] Final health check..." -ForegroundColor Cyan

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
Write-Host "New active instance: $newActive (port $buildPort)"
Write-Host "New BUILD_ID: $newBuildId"
Write-Host "Version: $newVersion"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# Cleanup git credentials
& git config --local --unset credential.helper 2>&1 | Out-Null

exit 0
