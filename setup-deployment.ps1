# Zero-Downtime Deployment Setup Script for jobaisearch.ru
# Run on remote VDS: 81.94.151.47

$ErrorActionPreference = "Stop"

Write-Host "=== Starting Zero-Downtime Deployment Setup ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray

# Configuration
$NSSMPath = "C:\nssm-2.24\win64\nssm.exe"
$NodePath = "C:\Program Files\nodejs\node.exe"
$AppDirectory = "C:\AI-Working-Seacrh"
$LogDir = "C:\AI-Working-Seacrh\logs"
$CaddyDir = "C:\caddy"
$ActiveInstanceFile = "C:\AI-Working-Seacrh\active-instance.txt"

# Ensure logs directory exists
if (-not (Test-Path $LogDir)) {
    Write-Host "Creating logs directory: $LogDir" -ForegroundColor Yellow
    New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
}

# ============================================================================
# Step 1: Stop and Remove Existing Services
# ============================================================================
Write-Host "`n=== Step 1: Stopping and Removing Existing Services ===" -ForegroundColor Cyan

$services = @("jobai-frontend-1", "jobai-frontend-2")
foreach ($service in $services) {
    Write-Host "Checking for existing service: $service" -ForegroundColor Gray
    $existingService = Get-Service -Name $service -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "  Stopping $service..." -ForegroundColor Yellow
        try {
            Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        } catch {
            Write-Host "  Warning: Could not stop service: $_" -ForegroundColor DarkYellow
        }

        Write-Host "  Removing $service..." -ForegroundColor Yellow
        try {
            & $NSSMPath remove $service confirm
            Write-Host "  Successfully removed $service" -ForegroundColor Green
        } catch {
            Write-Host "  Error removing $service: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  Service $service does not exist" -ForegroundColor Gray
    }
}

# ============================================================================
# Step 2: Create Services with NSSM
# ============================================================================
Write-Host "`n=== Step 2: Creating NSSM Services ===" -ForegroundColor Cyan

# Service 1: jobai-frontend-1 (port 3000, auto start)
Write-Host "`nCreating jobai-frontend-1 (port 3000, automatic start)..." -ForegroundColor Yellow
try {
    & $NSSMPath install jobai-frontend-1 $NodePath "node_modules\next\bin\next start"
    & $NSSMPath set jobai-frontend-1 AppDirectory $AppDirectory
    & $NSSMPath set jobai-frontend-1 AppEnvironmentExtra "NODE_ENV=production`nPORT=3000"
    & $NSSMPath set jobai-frontend-1 AppStdout "$LogDir\service-1-out.log"
    & $NSSMPath set jobai-frontend-1 AppStderr "$LogDir\service-1-out.log"
    & $NSSMPath set jobai-frontend-1 Start SERVICE_AUTO_START
    & $NSSMPath set jobai-frontend-1 AppRestartDelay 5000
    Write-Host "Successfully created jobai-frontend-1" -ForegroundColor Green
} catch {
    Write-Host "Error creating jobai-frontend-1: $_" -ForegroundColor Red
}

# Service 2: jobai-frontend-2 (port 3001, manual start)
Write-Host "`nCreating jobai-frontend-2 (port 3001, manual start)..." -ForegroundColor Yellow
try {
    & $NSSMPath install jobai-frontend-2 $NodePath "node_modules\next\bin\next start"
    & $NSSMPath set jobai-frontend-2 AppDirectory $AppDirectory
    & $NSSMPath set jobai-frontend-2 AppEnvironmentExtra "NODE_ENV=production`nPORT=3001"
    & $NSSMPath set jobai-frontend-2 AppStdout "$LogDir\service-2-out.log"
    & $NSSMPath set jobai-frontend-2 AppStderr "$LogDir\service-2-out.log"
    & $NSSMPath set jobai-frontend-2 Start SERVICE_DEMAND_START
    & $NSSMPath set jobai-frontend-2 AppRestartDelay 5000
    Write-Host "Successfully created jobai-frontend-2" -ForegroundColor Green
} catch {
    Write-Host "Error creating jobai-frontend-2: $_" -ForegroundColor Red
}

# ============================================================================
# Step 3: Create Active Instance Tracker File
# ============================================================================
Write-Host "`n=== Step 3: Creating Active Instance Tracker ===" -ForegroundColor Cyan
try {
    Set-Content -Path $ActiveInstanceFile -Value "1" -Encoding UTF8
    Write-Host "Created $ActiveInstanceFile with content '1'" -ForegroundColor Green
} catch {
    Write-Host "Error creating active-instance.txt: $_" -ForegroundColor Red
}

# ============================================================================
# Step 4: Create Caddyfile with Load Balancing
# ============================================================================
Write-Host "`n=== Step 4: Creating Caddyfile ===" -ForegroundColor Cyan

$CaddyfileContent = @"
jobaisearch.ru {
    reverse_proxy localhost:3000 localhost:3001 {
        health_uri /api/version
        health_interval 10s
        health_timeout 5s
    }
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

try {
    # Ensure Caddy directory exists
    if (-not (Test-Path $CaddyDir)) {
        Write-Host "Creating Caddy directory: $CaddyDir" -ForegroundColor Yellow
        New-Item -Path $CaddyDir -ItemType Directory -Force | Out-Null
    }

    $CaddyfilePath = "$CaddyDir\Caddyfile"
    Set-Content -Path $CaddyfilePath -Value $CaddyfileContent -Encoding UTF8
    Write-Host "Created Caddyfile at: $CaddyfilePath" -ForegroundColor Green

    # Display Caddyfile content
    Write-Host "`n--- Caddyfile Content ---" -ForegroundColor Gray
    Get-Content $CaddyfilePath | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host "--- End Caddyfile ---" -ForegroundColor Gray
} catch {
    Write-Host "Error creating Caddyfile: $_" -ForegroundColor Red
}

# ============================================================================
# Step 5: Validate Caddyfile
# ============================================================================
Write-Host "`n=== Step 5: Validating Caddyfile ===" -ForegroundColor Cyan
try {
    $CaddyExe = "$CaddyDir\caddy.exe"
    if (-not (Test-Path $CaddyExe)) {
        $CaddyExe = "caddy"  # Try from PATH
    }

    $validateResult = & $CaddyExe validate --config $CaddyfilePath --adapter caddyfile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Caddyfile validation: SUCCESSFUL" -ForegroundColor Green
        Write-Host "Output: $validateResult" -ForegroundColor Gray
    } else {
        Write-Host "Caddyfile validation: FAILED" -ForegroundColor Red
        Write-Host "Output: $validateResult" -ForegroundColor Red
    }
} catch {
    Write-Host "Error validating Caddyfile: $_" -ForegroundColor Red
}

# ============================================================================
# Step 6: Start jobai-frontend-1 Service
# ============================================================================
Write-Host "`n=== Step 6: Starting jobai-frontend-1 Service ===" -ForegroundColor Cyan
try {
    Start-Service -Name "jobai-frontend-1"
    Write-Host "Successfully started jobai-frontend-1" -ForegroundColor Green
} catch {
    Write-Host "Error starting jobai-frontend-1: $_" -ForegroundColor Red
}

# ============================================================================
# Step 7: Verification
# ============================================================================
Write-Host "`n=== Step 7: Verifying Deployment ===" -ForegroundColor Cyan

# Wait for service to initialize
Write-Host "Waiting 10 seconds for service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check Service Status
Write-Host "`n--- Service Status ---" -ForegroundColor Gray
$service1 = Get-Service -Name "jobai-frontend-1" -ErrorAction SilentlyContinue
if ($service1) {
    Write-Host "jobai-frontend-1 Status: $($service1.Status)" -ForegroundColor $(if ($service1.Status -eq "Running") { "Green" } else { "Red" })
} else {
    Write-Host "jobai-frontend-1: NOT FOUND" -ForegroundColor Red
}

$service2 = Get-Service -Name "jobai-frontend-2" -ErrorAction SilentlyContinue
if ($service2) {
    Write-Host "jobai-frontend-2 Status: $($service2.Status) (should be Stopped - manual start)" -ForegroundColor Gray
} else {
    Write-Host "jobai-frontend-2: NOT FOUND" -ForegroundColor Red
}

# Check Port 3000
Write-Host "`n--- Port 3000 Status ---" -ForegroundColor Gray
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($port3000) {
    Write-Host "Port 3000: LISTENING (State: $($port3000.State))" -ForegroundColor Green
} else {
    Write-Host "Port 3000: NOT LISTENING" -ForegroundColor Red
}

# Check Port 3001 (should not be listening)
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($port3001) {
    Write-Host "Port 3001: LISTENING (unexpected - service 2 should be stopped)" -ForegroundColor Yellow
} else {
    Write-Host "Port 3001: NOT LISTENING (expected - service 2 is manual start)" -ForegroundColor Gray
}

# Health Check
Write-Host "`n--- Health Check ---" -ForegroundColor Gray
try {
    $healthResponse = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -TimeoutSec 5 -UseBasicParsing
    Write-Host "Health Check: SUCCESS (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Health Check: FAILED - $_" -ForegroundColor Red
}

# ============================================================================
# Summary Report
# ============================================================================
Write-Host "`n=== Deployment Summary ===" -ForegroundColor Cyan

$summary = @{
    "Services Created" = $false
    "Caddyfile Created" = Test-Path "$CaddyDir\Caddyfile"
    "Caddyfile Validated" = $false
    "Instance 1 Running" = $false
    "Instance 1 Responding" = $false
}

if ($service1 -and $service1.Status -eq "Running") {
    $summary["Instance 1 Running"] = $true
}

try {
    $healthResponse = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    $summary["Instance 1 Responding"] = $true
} catch {}

$svc1Exists = Get-Service -Name "jobai-frontend-1" -ErrorAction SilentlyContinue
$svc2Exists = Get-Service -Name "jobai-frontend-2" -ErrorAction SilentlyContinue
if ($svc1Exists -and $svc2Exists) {
    $summary["Services Created"] = $true
}

Write-Host "`nResults:" -ForegroundColor White
foreach ($key in $summary.Keys) {
    $status = if ($summary[$key]) { "PASS" } else { "FAIL" }
    $color = if ($summary[$key]) { "Green" } else { "Red" }
    Write-Host "  [$status] $key" -ForegroundColor $color
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "To start/stop services manually:" -ForegroundColor Gray
Write-Host "  Start instance 1: Start-Service jobai-frontend-1" -ForegroundColor Gray
Write-Host "  Stop instance 1: Stop-Service jobai-frontend-1" -ForegroundColor Gray
Write-Host "  Start instance 2: Start-Service jobai-frontend-2" -ForegroundColor Gray
Write-Host "  Stop instance 2: Stop-Service jobai-frontend-2" -ForegroundColor Gray

Write-Host "`nTo restart Caddy with new config:" -ForegroundColor Gray
Write-Host "  Restart-Service caddy" -ForegroundColor Gray
