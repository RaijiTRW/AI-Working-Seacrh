# Caddy Web Server Setup Script for JobAI Search
# This script installs and configures Caddy as a reverse proxy for Next.js
# Run this script on your Windows VDS as Administrator

param(
    [string]$Domain = "jobaisearch.ru",
    [string]$BackendPort = "3000",
    [string]$InstallDir = "C:\caddy",
    [string]$Caddyfile = "$InstallDir\Caddyfile"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Caddy Setup for JobAI Search" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Domain: $Domain"
Write-Host "Backend: http://localhost:$BackendPort"
Write-Host "Install Dir: $InstallDir"
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Step 1: Download Caddy
Write-Host "[1/6] Downloading Caddy..." -ForegroundColor Cyan
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "  Created directory: $InstallDir"
}

$caddyExe = "$InstallDir\caddy.exe"
if (-not (Test-Path $caddyExe)) {
    Write-Host "  Downloading Caddy for Windows (amd64)..."
    $caddyUrl = "https://github.com/caddyserver/caddy/releases/latest/download/caddy_2.9.6_windows_amd64.zip"
    $zipPath = "$env:TEMP\caddy.zip"

    try {
        Invoke-WebRequest -Uri $caddyUrl -OutFile $zipPath -UseBasicParsing
        Expand-Archive -Path $zipPath -DestinationPath $InstallDir -Force
        Remove-Item $zipPath
        Write-Host "  Caddy downloaded successfully!" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: Failed to download Caddy: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  Caddy already installed at $caddyExe"
}

# Step 2: Create Caddyfile
Write-Host ""
Write-Host "[2/6] Creating Caddyfile..." -ForegroundColor Cyan

$caddyConfig = @"
# Caddyfile for JobAI Search
# This configuration proxies HTTPS traffic to the Next.js app

$Domain {
    # Reverse proxy to Next.js
    reverse_proxy localhost:$BackendPort

    # Enable gzip compression
    encode gzip

    # Security headers
    header {
        # Enable HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

        # Prevent clickjacking
        X-Frame-Options "SAMEORIGIN"

        # Prevent MIME type sniffing
        X-Content-Type-Options "nosniff"

        # XSS protection
        X-XSS-Protection "1; mode=block"

        # Referrer policy
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Logging
    log {
        output file $InstallDir\access.log
        format console
    }
}

# Redirect www to non-www
www.$Domain {
    redir https://$Domain{uri} permanent
}
"@

Set-Content -Path $Caddyfile -Value $caddyConfig -Encoding UTF8
Write-Host "  Caddyfile created at $Caddyfile"

# Step 3: Validate Caddyfile
Write-Host ""
Write-Host "[3/6] Validating Caddyfile..." -ForegroundColor Cyan
& $caddyExe validate --config "$Caddyfile" --adapter caddyfile
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Caddyfile is valid!" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Caddyfile validation failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Configure Windows Firewall
Write-Host ""
Write-Host "[4/6] Configuring Windows Firewall..." -ForegroundColor Cyan

# Allow HTTP (port 80)
try {
    & netsh advfirewall firewall show rule name="Caddy HTTP" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        & netsh advfirewall firewall add rule name="Caddy HTTP" dir=in action=allow protocol=TCP localport=80 | Out-Null
        Write-Host "  Allowed HTTP (port 80)"
    } else {
        Write-Host "  HTTP (port 80) already allowed"
    }
} catch {
    Write-Host "  Warning: Could not configure firewall for HTTP - $_" -ForegroundColor Yellow
}

# Allow HTTPS (port 443)
try {
    & netsh advfirewall firewall show rule name="Caddy HTTPS" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        & netsh advfirewall firewall add rule name="Caddy HTTPS" dir=in action=allow protocol=TCP localport=443 | Out-Null
        Write-Host "  Allowed HTTPS (port 443)"
    } else {
        Write-Host "  HTTPS (port 443) already allowed"
    }
} catch {
    Write-Host "  Warning: Could not configure firewall for HTTPS - $_" -ForegroundColor Yellow
}

# Step 5: Setup Caddy as Windows Service using NSSM
Write-Host ""
Write-Host "[5/6] Setting up Caddy as Windows Service..." -ForegroundColor Cyan

$nssmPath = "C:\nssm-2.24\win64\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-Host "  ERROR: NSSM not found at $nssmPath" -ForegroundColor Red
    Write-Host "  Please install NSSM from https://nssm.cc/download/" -ForegroundColor Yellow
    Write-Host "  Or extract to C:\nssm-2.24\" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Alternative: Run Caddy manually:" -ForegroundColor Yellow
    Write-Host "  cd $InstallDir" -ForegroundColor Yellow
    Write-Host "  .\caddy.exe run --config Caddyfile" -ForegroundColor Yellow
    exit 1
}

# Stop existing service if present
Write-Host "  Checking for existing Caddy service..."
$service = Get-Service -Name "Caddy" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "  Stopping existing Caddy service..."
    & $nssmPath stop Caddy 2>&1 | Out-Null
    & $nssmPath remove Caddy confirm 2>&1 | Out-Null
    Start-Sleep -Seconds 2
}

# Install new service
Write-Host "  Installing Caddy as Windows Service..."
& $nssmPath install Caddy $caddyExe `run --config "$Caddyfile" 2>&1 | Out-Null

# Set service to auto-start
& $nssmPath set Caddy Start SERVICE_AUTO_START 2>&1 | Out-Null

# Configure service recovery
& $nssmPath set Caddy AppRestartDelay 10000 2>&1 | Out-Null
& $nssmPath set Caddy AppThrottle 1500 2>&1 | Out-Null
& $nssmPath set Caddy AppRestartModules 1 2>&1 | Out-Null
& $nssmPath set Caddy AppRestartDelay 10000 2>&1 | Out-Null

# Redirect output to log files
& $nssmPath set Caddy AppStdout "$InstallDir\caddy-out.log" 2>&1 | Out-Null
& $nssmPath set Caddy AppStderr "$InstallDir\caddy-err.log" 2>&1 | Out-Null

Write-Host "  Caddy service installed with NSSM"

# Step 6: Start Caddy Service
Write-Host ""
Write-Host "[6/6] Starting Caddy Service..." -ForegroundColor Cyan

& $nssmPath start Caddy 2>&1 | Out-Null
Start-Sleep -Seconds 3

$service = Get-Service -Name "Caddy" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "  Caddy service is running!" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Caddy service failed to start!" -ForegroundColor Red
    Write-Host "  Check logs at:" -ForegroundColor Yellow
    Write-Host "    $InstallDir\caddy-out.log" -ForegroundColor Yellow
    Write-Host "    $InstallDir\caddy-err.log" -ForegroundColor Yellow
    exit 1
}

# Final: Display info
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Caddy Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your site should be available at:" -ForegroundColor Cyan
Write-Host "  https://$Domain" -ForegroundColor White
Write-Host ""
Write-Host "Service Management:" -ForegroundColor Cyan
Write-Host "  Start:  & '$nssmPath' start Caddy" -ForegroundColor White
Write-Host "  Stop:   & '$nssmPath' stop Caddy" -ForegroundColor White
Write-Host "  Restart:& '$nssmPath' restart Caddy" -ForegroundColor White
Write-Host "  Status:  Get-Service Caddy" -ForegroundColor White
Write-Host ""
Write-Host "Logs:" -ForegroundColor Cyan
Write-Host "  Access: $InstallDir\access.log" -ForegroundColor White
Write-Host "  Error:  $InstallDir\caddy-err.log" -ForegroundColor White
Write-Host ""
Write-Host "To reload Caddy configuration:" -ForegroundColor Cyan
Write-Host "  & '$caddyExe' reload --config '$Caddyfile'" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
