# One-Click Setup Script for JobAI Search on VDS
# This script is called by GitHub Actions on first run
# It installs everything: Node.js, NSSM, Caddy, Next.js

param(
    [string]$AppDir = "C:\apps\AI-Working-Seacrh",
    [string]$Domain = "jobaisearch.ru",
    [string]$BackendPort = "3000",
    [string]$GitRepo = "https://github.com/RaijiTRW/AI-Working-Seacrh.git"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Status {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

Write-Status "========================================"
Write-Status "  JobAI Search - Full Setup" -Color "Green"
Write-Status "========================================"
Write-Status "Domain: $Domain"
Write-Status "AppDir: $AppDir"
Write-Status "BackendPort: $BackendPort"

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Status "ERROR: This script must be run as Administrator!" -Color "Red"
    exit 1
}

# ==============================================================================
# STEP 1: Create directories
# ==============================================================================
Write-Status ""
Write-Status "[1/10] Creating directories..." -Color "Cyan"

if (-not (Test-Path "C:\apps")) {
    New-Item -ItemType Directory -Path "C:\apps" -Force | Out-Null
    Write-Status "  Created: C:\apps"
}

if (-not (Test-Path $AppDir)) {
    Write-Status "  Cloning repository..."
    cd C:\apps
    git clone $GitRepo AI-Working-Seacrh
    Write-Status "  Repository cloned"
} else {
    Write-Status "  App directory already exists"
}

# ==============================================================================
# STEP 2: Install Node.js (if not installed)
# ==============================================================================
Write-Status ""
Write-Status "[2/10] Checking Node.js..." -Color "Cyan"

if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Status "  Node.js already installed: $nodeVersion"
} else {
    Write-Status "  Installing Node.js LTS..."
    $nodeUrl = "https://nodejs.org/dist/v20.18.2/node-v20.18.2-x64.msi"
    $nodeMsi = "$env:TEMP\nodejs.msi"

    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
        Start-Process msiexec.exe -ArgumentList "/i $nodeMsi /quiet /norestart" -Wait
        Remove-Item $nodeMsi
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Status "  Node.js installed!" -Color "Green"
    } catch {
        Write-Status "  ERROR: Failed to install Node.js: $_" -Color "Red"
        exit 1
    }
}

# ==============================================================================
# STEP 3: Install/Update NSSM
# ==============================================================================
Write-Status ""
Write-Status "[3/10] Installing NSSM..." -Color "Cyan"

$nssmDir = "C:\nssm-2.24"
$nssmPath = "$nssmDir\win64\nssm.exe"

if (Test-Path $nssmPath) {
    Write-Status "  NSSM already installed"
} else {
    Write-Status "  Downloading NSSM..."
    $nssmZip = "$env:TEMP\nssm.zip"
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"

    try {
        Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip -UseBasicParsing
        Expand-Archive -Path $nssmZip -DestinationPath $nssmDir -Force
        Remove-Item $nssmZip
        Write-Status "  NSSM installed!" -Color "Green"
    } catch {
        Write-Status "  ERROR: Failed to install NSSM: $_" -Color "Red"
        exit 1
    }
}

# ==============================================================================
# STEP 4: Install dependencies and build
# ==============================================================================
Write-Status ""
Write-Status "[4/10] Installing dependencies..." -Color "Cyan"

cd $AppDir

# Stop service if running
& $nssmPath stop jobai-frontend 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Kill any node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clean and install
if (Test-Path "node_modules") {
    Write-Status "  Removing old node_modules..."
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

Write-Status "  Running npm ci..."
& npm ci 2>&1 | Out-Host

if ($LASTEXITCODE -ne 0) {
    Write-Status "  ERROR: npm ci failed" -Color "Red"
    exit 1
}

# ==============================================================================
# STEP 5: Build Next.js
# ==============================================================================
Write-Status ""
Write-Status "[5/10] Building Next.js..." -Color "Cyan"

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

& npm run build 2>&1 | Out-Host

if ($LASTEXITCODE -ne 0) {
    Write-Status "  ERROR: Build failed" -Color "Red"
    exit 1
}

Write-Status "  Build complete!" -Color "Green"

# ==============================================================================
# STEP 6: Create .env.production
# ==============================================================================
Write-Status ""
Write-Status "[6/10] Setting up .env.production..." -Color "Cyan"

$envContent = @"
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pakzojxyudiiztniqayd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_-EARVfGbhAatjR_33KRadA_sWuPh5lK
SUPABASE_SERVICE_ROLE_KEY=[REDACTED_SUPABASE_SERVICE_ROLE_KEY]

# YooKassa
YOOKASSA_SHOP_ID=1251085
YOOKASSA_SECRET_KEY=live__qIC1asB7r2wQTa16gL9b8D3twgsUzSyYRK5djNN9pI
YOOKASSA_RETURN_URL=https://jobaisearch.ru/api/subscription/webhook

# Site URLs
NEXT_PUBLIC_SITE_URL=https://jobaisearch.ru
NEXT_PUBLIC_API_URL=http://81.94.151.47:8000

# Cron secret
CRON_SECRET=jobseacrhsecretkey123

# AI API
OPENAI_API_KEY=[REDACTED_OPENROUTER_KEY]
AI_API_URL=https://openrouter.ai/api/v1/chat/completions
AI_MODEL=google/gemini-3-flash-preview
"@

Set-Content -Path "$AppDir\.env.production" -Value $envContent -Encoding UTF8
Write-Status "  .env.production created"

# ==============================================================================
# STEP 7: Setup Next.js as Windows Service
# ==============================================================================
Write-Status ""
Write-Status "[7/10] Setting up Next.js service..." -Color "Cyan"

$serviceName = "jobai-frontend"

# Remove existing service
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    Write-Status "  Removing existing service..."
    & $nssmPath stop $serviceName 2>&1 | Out-Null
    & $nssmPath remove $serviceName confirm 2>&1 | Out-Null
    Start-Sleep -Seconds 2
}

# Install new service
Write-Status "  Installing NSSM service..."

& $nssmPath install $serviceName "C:\Program Files\nodejs\node.exe" 2>&1 | Out-Null
& $nssmPath set $serviceName AppDirectory $AppDir 2>&1 | Out-Null
& $nssmPath set $serviceName AppParameters "$AppDir\node_modules\next\bin\next start" 2>&1 | Out-Null
& $nssmPath set $serviceName AppEnvironmentExtra "NODE_ENV=production;PORT=$BackendPort" 2>&1 | Out-Null
& $nssmPath set $serviceName DisplayName "JobAI Search Frontend" 2>&1 | Out-Null
& $nssmPath set $serviceName Description "Next.js frontend for JobAI Search" 2>&1 | Out-Null
& $nssmPath set $serviceName Start SERVICE_AUTO_START 2>&1 | Out-Null
& $nssmPath set $serviceName AppStdout "$AppDir\logs\service-out.log" 2>&1 | Out-Null
& $nssmPath set $serviceName AppStderr "$AppDir\logs\service-err.log" 2>&1 | Out-Null
& $nssmPath set $serviceName AppRestartDelay 10000 2>&1 | Out-Null

Write-Status "  Service installed"

# ==============================================================================
# STEP 8: Install and Setup Caddy
# ==============================================================================
Write-Status ""
Write-Status "[8/10] Setting up Caddy..." -Color "Cyan"

$caddyDir = "C:\caddy"
$caddyExe = "$caddyDir\caddy.exe"
$caddyfile = "$caddyDir\Caddyfile"

if (-not (Test-Path $caddyDir)) {
    New-Item -ItemType Directory -Path $caddyDir -Force | Out-Null
}

# Download Caddy if not exists
if (-not (Test-Path $caddyExe)) {
    Write-Status "  Downloading Caddy..."
    $caddyUrl = "https://github.com/caddyserver/caddy/releases/latest/download/caddy_2.9.6_windows_amd64.zip"
    $caddyZip = "$env:TEMP\caddy.zip"

    try {
        Invoke-WebRequest -Uri $caddyUrl -OutFile $caddyZip -UseBasicParsing
        Expand-Archive -Path $caddyZip -DestinationPath $caddyDir -Force
        Remove-Item $caddyZip
        Write-Status "  Caddy downloaded!" -Color "Green"
    } catch {
        Write-Status "  ERROR: Failed to download Caddy: $_" -Color "Red"
    }
}

# Create Caddyfile
$caddyConfig = @"
# Caddyfile for JobAI Search
$Domain {
    reverse_proxy localhost:$BackendPort

    encode gzip

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    log {
        output file $caddyDir\access.log
        format console
    }
}

www.$Domain {
    redir https://$Domain{uri} permanent
}
"@

Set-Content -Path $caddyfile -Value $caddyConfig -Encoding UTF8
Write-Status "  Caddyfile created"

# Validate Caddyfile
& $caddyExe validate --config $caddyfile --adapter caddyfile 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Status "  WARNING: Caddyfile validation failed" -Color "Yellow"
}

# ==============================================================================
# STEP 9: Configure Firewall
# ==============================================================================
Write-Status ""
Write-Status "[9/10] Configuring firewall..." -Color "Cyan"

$ports = @(80, 443)
foreach ($port in $ports) {
    $ruleName = if ($port -eq 80) { "Caddy HTTP" } else { "Caddy HTTPS" }

    try {
        & netsh advfirewall firewall show rule name="$ruleName" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            & netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=$port 2>&1 | Out-Null
            Write-Status "  Opened port $port"
        } else {
            Write-Status "  Port $port already open"
        }
    } catch {
        Write-Status "  Warning: Could not configure port $port" -Color "Yellow"
    }
}

# ==============================================================================
# STEP 10: Start Services
# ==============================================================================
Write-Status ""
Write-Status "[10/10] Starting services..." -Color "Cyan"

# Create logs directory
if (-not (Test-Path "$AppDir\logs")) {
    New-Item -ItemType Directory -Path "$AppDir\logs" -Force | Out-Null
}

# Start Next.js service
Write-Status "  Starting Next.js service..."
& $nssmPath start $serviceName 2>&1 | Out-Null
Start-Sleep -Seconds 5

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Status "  Next.js service running!" -Color "Green"
} else {
    Write-Status "  WARNING: Next.js service may not be running" -Color "Yellow"
}

# Setup Caddy service
Write-Status "  Setting up Caddy service..."
& $nssmPath stop Caddy 2>&1 | Out-Null
& $nssmPath remove Caddy confirm 2>&1 | Out-Null
Start-Sleep -Seconds 2

& $nssmPath install Caddy $caddyExe "run --config $caddyfile" 2>&1 | Out-Null
& $nssmPath set Caddy Start SERVICE_AUTO_START 2>&1 | Out-Null
& $nssmPath set Caddy AppStdout "$caddyDir\caddy-out.log" 2>&1 | Out-Null
& $nssmPath set Caddy AppStderr "$caddyDir\caddy-err.log" 2>&1 | Out-Null
& $nssmPath set Caddy AppRestartDelay 10000 2>&1 | Out-Null

# Start Caddy
& $nssmPath start Caddy 2>&1 | Out-Null
Start-Sleep -Seconds 3

$caddyService = Get-Service -Name "Caddy" -ErrorAction SilentlyContinue
if ($caddyService -and $caddyService.Status -eq "Running") {
    Write-Status "  Caddy service running!" -Color "Green"
} else {
    Write-Status "  WARNING: Caddy service may not be running" -Color "Yellow"
}

# ==============================================================================
# Health Checks
# ==============================================================================
Write-Status ""
Write-Status "Running health checks..." -Color "Cyan"

# Check Next.js
$nextHealthy = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/api/version" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Status "  Next.js: Healthy!" -Color "Green"
            $nextHealthy = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
}

if (-not $nextHealthy) {
    Write-Status "  WARNING: Next.js health check failed" -Color "Yellow"
}

# ==============================================================================
# Summary
# ==============================================================================
Write-Status ""
Write-Status "========================================" -Color "Green"
Write-Status "  Setup Complete!" -Color "Green"
Write-Status "========================================" -Color "Green"
Write-Status ""
Write-Status "Your site should be available at:" -Color "Cyan"
Write-Status "  https://$Domain" -Color "White"
Write-Status ""
Write-Status "Services:" -Color "Cyan"
Write-Status "  Next.js: jobai-frontend" -Color "White"
Write-Status "  Caddy:   Caddy" -Color "White"
Write-Status ""
Write-Status "Logs:" -Color "Cyan"
Write-Status "  Next.js: $AppDir\logs\" -Color "White"
Write-Status "  Caddy:   $caddyDir\" -Color "White"
Write-Status ""
Write-Status "========================================" -Color "Green"

exit 0
