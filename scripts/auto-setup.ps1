# Auto-Setup Script for JobAI Search
# Finds Caddy, configures it, and sets up Next.js

$ErrorActionPreference = "Stop"
$AppDir = "C:\AI-Working-Seacrh"
$Domain = "jobaisearch.ru"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Auto-Setup for JobAI Search" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Find Caddy
Write-Host ""
Write-Host "[1/5] Finding Caddy..." -ForegroundColor Cyan

$caddyExe = $null
$possiblePaths = @(
    "C:\caddy\caddy.exe",
    "C:\caddy\caddy.exe",
    "C:\Windows\System32\caddy.exe",
    "$env:ProgramFiles\Caddy\caddy.exe",
    "${env:ProgramFiles(x86)}\Caddy\caddy.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $caddyExe = $path
        Write-Host "  Found Caddy at: $path" -ForegroundColor Green
        break
    }
}

if (-not $caddyExe) {
    # Try in PATH
    try {
        $caddyPath = where.exe caddy.exe 2>$null
        if ($caddyPath) {
            $caddyExe = $caddyPath.Trim()
            Write-Host "  Found Caddy in PATH: $caddyExe" -ForegroundColor Green
        }
    } catch {}
}

if (-not $caddyExe) {
    Write-Host "  ERROR: Caddy not found!" -ForegroundColor Red
    Write-Host "  Installing from GitHub..." -ForegroundColor Yellow

    $caddyDir = "C:\caddy"
    New-Item -ItemType Directory -Path $caddyDir -Force | Out-Null
    $caddyZip = "$env:TEMP\caddy.zip"

    # Try downloading
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri "https://github.com/caddyserver/caddy/releases/download/v2.9.6/caddy_2.9.6_windows_amd64.zip" -OutFile $caddyZip -UseBasicParsing -TimeoutSec 120
        Expand-Archive -Path $caddyZip -DestinationPath $caddyDir -Force
        Remove-Item $caddyZip -ErrorAction SilentlyContinue
        $caddyExe = "$caddyDir\caddy.exe"
        Write-Host "  Caddy installed!" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: Could not download Caddy: $_" -ForegroundColor Red
        Write-Host "  Please download manually from: https://github.com/caddyserver/caddy/releases" -ForegroundColor Yellow
        exit 1
    }
}

# Show Caddy version
try {
    $version = & $caddyExe version 2>&1
    Write-Host "  Version: $version"
} catch {
    Write-Host "  Could not determine version"
}

# Step 2: Create Caddyfile
Write-Host ""
Write-Host "[2/5] Creating Caddyfile..." -ForegroundColor Cyan

$caddyDir = Split-Path $caddyExe -Parent
$caddyfile = "$caddyDir\Caddyfile"

$caddyConfig = @"
# Caddyfile for JobAI Search
$Domain {
    reverse_proxy localhost:3000
    encode gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }
    log {
        output file $caddyDir\access.log
    }
}

www.$Domain {
    redir https://$Domain{uri} permanent
}
"@

Set-Content -Path $caddyfile -Value $caddyConfig -Encoding UTF8
Write-Host "  Caddyfile created at: $caddyfile"

# Validate Caddyfile
& $caddyExe validate --config $caddyfile --adapter caddyfile 2>&1 | Out-Host

# Step 3: Open firewall ports
Write-Host ""
Write-Host "[3/5] Configuring firewall..." -ForegroundColor Cyan

foreach ($port in @(80, 443)) {
    $ruleName = if ($port -eq 80) { "Caddy HTTP" } else { "Caddy HTTPS" }
    $exists = & netsh advfirewall firewall show rule name="$ruleName" 2>&1
    if (-not $exists) {
        & netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=$port 2>&1 | Out-Null
        Write-Host "  Opened port $port"
    } else {
        Write-Host "  Port $port already open"
    }
}

# Step 4: Setup Next.js service
Write-Host ""
Write-Host "[4/5] Setting up Next.js service..." -ForegroundColor Cyan

$nssmPath = "C:\nssm-2.24\win64\nssm.exe"
$nssmInstalled = Test-Path $nssmPath

if ($nssmInstalled) {
    Write-Host "  NSSM found at: $nssmPath"

    # Remove old services
    & $nssmPath stop jobai-frontend 2>&1 | Out-Null
    & $nssmPath stop jobai-frontend-1 2>&1 | Out-Null
    & $nssmPath stop jobai-frontend-2 2>&1 | Out-Null
    Start-Sleep -Seconds 2

    & $nssmPath remove jobai-frontend confirm 2>&1 | Out-Null
    & $nssmPath remove jobai-frontend-1 confirm 2>&1 | Out-Null
    & $nssmPath remove jobai-frontend-2 confirm 2>&1 | Out-Null
    Start-Sleep -Seconds 2

    # Install service
    & $nssmPath install jobai-frontend "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Null
    & $nssmPath set jobai-frontend AppDirectory $AppDir 2>&1 | Out-Null
    & $nssmPath set jobai-frontend AppParameters "node_modules\next\bin\next start" 2>&1 | Out-Null
    & $nssmPath set jobai-frontend AppEnvironmentExtra "NODE_ENV=production;PORT=3000" 2>&1 | Out-Null
    & $nssmPath set jobai-frontend DisplayName "JobAI Search Frontend" 2>&1 | Out-Null
    & $nssmPath set jobai-frontend Description "Next.js frontend for JobAI Search" 2>&1 | Out-Null
    & $nssmPath set jobai-frontend Start SERVICE_AUTO_START 2>&1 | Out-Null
    & $nssmPath set jobai-frontend AppStdout "$AppDir\logs\service-out.log" 2>&1 | Out-Null
    & $nssmPath set jobai-frontend AppStderr "$AppDir\logs\service-err.log" 2>&1 | Out-Null
    & $nssmPath set jobai-frontend AppRestartDelay 10000 2>&1 | Out-Null

    Write-Host "  Service installed"
} else {
    Write-Host "  WARNING: NSSM not found - Next.js will run manually" -ForegroundColor Yellow
}

# Step 5: Start services
Write-Host ""
Write-Host "[5/5] Starting services..." -ForegroundColor Cyan

# Create logs dir
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

# Kill any node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Caddy first
Write-Host "  Starting Caddy..." -ForegroundColor Yellow

# Check if Caddy service exists
$caddyService = Get-Service -Name "Caddy" -ErrorAction SilentlyContinue
if ($caddyService) {
    & $nssmPath start Caddy 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    Write-Host "  Caddy service started"
} else {
    # Start Caddy manually in background
    Write-Host "  Starting Caddy manually (no service)..." -ForegroundColor Yellow
    $caddyProcess = Start-Process -FilePath $caddyExe -ArgumentList "run --config `"$caddyfile`"" -WindowStyle Hidden -PassThru
    Write-Host "  Caddy PID: $($caddyProcess.Id)"
    Start-Sleep -Seconds 3
}

# Start Next.js
if ($nssmInstalled) {
    Write-Host "  Starting Next.js service..." -ForegroundColor Yellow
    & $nssmPath start jobai-frontend 2>&1 | Out-Null
    Start-Sleep -Seconds 10
} else {
    Write-Host "  Starting Next.js manually..." -ForegroundColor Yellow
    $env:NODE_ENV = "production"
    $env:PORT = "3000"
    $nodeProcess = Start-Process -FilePath "node" -ArgumentList "node_modules\next\bin\next start" -WorkingDirectory $AppDir -WindowStyle Hidden -PassThru
    Write-Host "  Node PID: $($nodeProcess.Id)"
    Start-Sleep -Seconds 10
}

# Health check
Write-Host ""
Write-Host "Running health checks..." -ForegroundColor Cyan

# Check Caddy
$caddyHealthy = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/api/version" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  Caddy: OK" -ForegroundColor Green
        $caddyHealthy = $true
    }
} catch {
    Write-Host "  Caddy: Failed - $_" -ForegroundColor Red
}

# Check Next.js directly
$nextHealthy = $false
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  Next.js: OK" -ForegroundColor Green
        $nextHealthy = $true
    }
} catch {
    Write-Host "  Next.js: Failed - $_" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Site URL: https://$Domain" -ForegroundColor Cyan
Write-Host "Caddy:    $caddyExe" -ForegroundColor White
Write-Host "Config:    $caddyfile" -ForegroundColor White
Write-Host "Logs:     $AppDir\logs\" -ForegroundColor White
Write-Host ""

if ($nssmInstalled) {
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  Restart Next.js: & '$nssmPath' restart jobai-frontend" -ForegroundColor White
    Write-Host "  Restart Caddy:   & '$nssmPath' restart Caddy" -ForegroundColor White
}

Write-Host ""
Write-Host "Press Ctrl+C to exit (Caddy will continue running)" -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 60
    }
} catch {
    Write-Host "Exiting..."
}
