# Zero-Downtime Deploy Script for JobAI Search
# Swaps between two instances without downtime

param(
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe",
    [string]$ActiveFile = "$AppDir\active-instance.txt",
    [string]$Domain = "jobaisearch.ru"
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
    $buildPort = "3000"
    $activePort = "3001"
    $activeService = "jobai-frontend-2"
}

Write-Host "Current active: Instance $currentActive (port $activePort)"
Write-Host "Deploying to:   Instance $newActive (port $buildPort)"
Write-Host ""

# Step 1: Pull latest code
Write-Host "[1/7] Pulling latest code..." -ForegroundColor Cyan
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

# Step 2: Install dependencies
Write-Host ""
Write-Host "[2/7] Installing dependencies..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

& npm ci 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm ci failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Build
Write-Host ""
Write-Host "[3/7] Building..." -ForegroundColor Cyan

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

$env:PORT = $buildPort
& npm run build 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Start standby instance
Write-Host ""
Write-Host "[4/7] Starting standby instance $newActive..." -ForegroundColor Cyan

# Kill any process on build port
Get-NetTCPConnection -LocalPort $buildPort -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "  Killing process $($_.OwningProcess) on port $buildPort"
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

# Start standby service
& $NssmPath start $startService 2>&1 | Out-Host
Start-Sleep -Seconds 10

# Check standby instance health
Write-Host ""
Write-Host "[5/7] Checking standby instance health..." -ForegroundColor Cyan
$standbyHealthy = $false
for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$buildPort/api/version" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "  Standby instance is healthy!" -ForegroundColor Green
            $standbyHealthy = $true
            break
        }
    } catch {
        Write-Host "  Attempt $i/15..."
        Start-Sleep -Seconds 2
    }
}

if (-not $standbyHealthy) {
    Write-Host "ERROR: Standby instance failed health check!" -ForegroundColor Red
    & $NssmPath stop $startService 2>&1 | Out-Null
    exit 1
}

# Step 6: Update Caddy to point to new instance
Write-Host ""
Write-Host "[6/7] Updating Caddy configuration..." -ForegroundColor Cyan

$caddyConfig = @"
# Caddyfile for JobAI Search - Instance $newActive active
$Domain {
    reverse_proxy localhost:$buildPort {
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
        output file C:\caddy\access.log
    }
}

www.$Domain {
    redir https://$Domain{uri} permanent
}
"@

Set-Content -Path "C:\caddy\Caddyfile" -Value $caddyConfig -Encoding UTF8

# Reload Caddy
Write-Host "  Reloading Caddy..."
caddy reload --config C:\caddy\Caddyfile 2>&1 | Out-Host
Start-Sleep -Seconds 5

# Step 7: Stop old instance
Write-Host ""
Write-Host "[7/7] Stopping old instance $currentActive..." -ForegroundColor Cyan

& $NssmPath stop $stopService 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Update active instance file
Set-Content -Path $ActiveFile -Value $newActive -Encoding UTF8

# Final health check through Caddy
Write-Host ""
Write-Host "Final health check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://$Domain/api/version" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  Site is accessible through Caddy!" -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING: Could not verify through HTTPS" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Deploy Complete!" -ForegroundColor Green
Write-Host "========================================"
Write-Host "Active instance: $newActive (port $buildPort)"
Write-Host "Version: $newVersion"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# Cleanup git credentials
& git config --local --unset credential.helper 2>&1 | Out-Null

exit 0
