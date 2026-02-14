# Caddy Setup Script for JobAI Search
# Downloads and installs Caddy with multiple fallback URLs

param(
    [string]$Domain = "jobaisearch.ru",
    [string]$BackendPort = "3000",
    [string]$CaddyDir = "C:\caddy"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Caddy Setup for JobAI Search" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Domain: $Domain"
Write-Host "Backend: localhost:$BackendPort"

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Run as Administrator!" -ForegroundColor Red
    exit 1
}

# Create directory
if (-not (Test-Path $CaddyDir)) {
    New-Item -ItemType Directory -Path $CaddyDir -Force | Out-Null
}

# Download Caddy with multiple fallback URLs
$caddyExe = "$CaddyDir\caddy.exe"
if (-not (Test-Path $caddyExe)) {
    Write-Host "Downloading Caddy..."
    $caddyZip = "$env:TEMP\caddy.zip"

    # Try multiple URLs
    $urls = @(
        "https://github.com/caddyserver/caddy/releases/download/v2.9.6/caddy_2.9.6_windows_amd64.zip",
        "https://github.com/mholt/caddy/releases/download/v2.9.6/caddy_v2.9.6_windows_amd64.zip",
        "https://github.com/caddyserver/caddy/releases/download/v2.8.4/caddy_2.8.4_windows_amd64.zip"
    )

    $downloaded = $false
    foreach ($url in $urls) {
        try {
            Write-Host "Trying: $url"
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $url -OutFile $caddyZip -UseBasicParsing -TimeoutSec 60
            Write-Host "Downloaded successfully!" -ForegroundColor Green
            $downloaded = $true
            break
        } catch {
            Write-Host "Failed: $_" -ForegroundColor Yellow
        }
    }

    if (-not $downloaded) {
        Write-Host "ERROR: Could not download Caddy from any source" -ForegroundColor Red
        Write-Host "Please download manually from: https://github.com/caddyserver/caddy/releases" -ForegroundColor Yellow
        exit 1
    }

    Expand-Archive -Path $caddyZip -DestinationPath $CaddyDir -Force
    Remove-Item $caddyZip -ErrorAction SilentlyContinue
    Write-Host "Caddy extracted!" -ForegroundColor Green
}

# Verify Caddy exists
if (-not (Test-Path $caddyExe)) {
    Write-Host "ERROR: caddy.exe not found at $caddyExe" -ForegroundColor Red
    exit 1
}

# Show version
try {
    $version = & $caddyExe version 2>&1
    Write-Host "Caddy version: $version" -ForegroundColor Cyan
} catch {
    Write-Host "Could not determine Caddy version"
}

# Create Caddyfile
$caddyfile = "$CaddyDir\Caddyfile"
$caddyConfig = @"
$Domain {
    reverse_proxy localhost:$BackendPort
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

www.$Domain {
    redir https://$Domain{uri} permanent
}
"@

Set-Content -Path $caddyfile -Value $caddyConfig -Encoding UTF8
Write-Host "Caddyfile created"

# Validate
& $caddyExe validate --config $caddyfile --adapter caddyfile

# Firewall
foreach ($port in @(80, 443)) {
    $ruleName = if ($port -eq 80) { "Caddy HTTP" } else { "Caddy HTTPS" }
    try {
        & netsh advfirewall firewall show rule name="$ruleName" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            & netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=$port 2>&1 | Out-Null
            Write-Host "Opened port $port"
        }
    } catch {}
}

# Setup NSSM service
$nssmPath = "C:\nssm-2.24\win64\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-Host "ERROR: NSSM not found at $nssmPath" -ForegroundColor Red
    Write-Host "Install NSSM from https://nssm.cc/download/" -ForegroundColor Yellow
    exit 1
}

& $nssmPath stop Caddy 2>&1 | Out-Null
& $nssmPath remove Caddy confirm 2>&1 | Out-Null
Start-Sleep -Seconds 2

& $nssmPath install Caddy $caddyExe "run --config $caddyfile" 2>&1 | Out-Null
& $nssmPath set Caddy Start SERVICE_AUTO_START 2>&1 | Out-Null
& $nssmPath set Caddy AppStdout "$CaddyDir\caddy-out.log" 2>&1 | Out-Null
& $nssmPath set Caddy AppStderr "$CaddyDir\caddy-err.log" 2>&1 | Out-Null

& $nssmPath start Caddy 2>&1 | Out-Null
Start-Sleep -Seconds 3

$service = Get-Service -Name "Caddy" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Caddy is running!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Site: https://$Domain"
    Write-Host "Logs: $CaddyDir"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  Restart: & '$nssmPath' restart Caddy"
    Write-Host "  Reload:  & '$caddyExe' reload --config $caddyfile"
} else {
    Write-Host "ERROR: Caddy service not running!" -ForegroundColor Red
    Write-Host "Check logs: $CaddyDir\caddy-err.log"
    exit 1
}
