# JobAI Deploy Script
# Called by GitHub Actions via SSH

param(
    [string]$AppDir = "C:\apps\AI-Working-Seacrh"
)

$ErrorActionPreference = "Stop"
Set-Location $AppDir

Write-Host "========================================"
Write-Host "  DEPLOY STARTED"
Write-Host "========================================"

# Step 1: Save old version
Write-Host ""
Write-Host "[1/7] Saving old version..."
$oldVersion = git rev-parse --short HEAD
Write-Host "Old version: $oldVersion"
Set-Content -Path ".version-old" -Value $oldVersion

# Step 2: Pull latest code
Write-Host ""
Write-Host "[2/7] Pulling latest code..."
git fetch --all --prune
if ($LASTEXITCODE -ne 0) { throw "git fetch failed" }
git reset --hard origin/main
if ($LASTEXITCODE -ne 0) { throw "git reset failed" }
git clean -fd
$newVersion = git rev-parse --short HEAD
Write-Host "New version: $newVersion"
Set-Content -Path ".version" -Value $newVersion

if ($oldVersion -eq $newVersion) {
    Write-Host "WARNING: Version unchanged, but continuing with rebuild..."
}

# Step 3: Clear ALL caches
Write-Host ""
Write-Host "[3/7] Clearing ALL caches..."
$cacheDirs = @(".next", "node_modules\.cache", ".turbo", ".swc")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing $dir..."
        Remove-Item -Recurse -Force $dir
    }
}
npm cache clean --force 2>&1 | Out-Null
Write-Host "Caches cleared!"

# Step 4: Install dependencies
Write-Host ""
Write-Host "[4/7] Installing dependencies..."
npm ci --force
if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
Write-Host "Dependencies installed!"

# Step 5: Build
Write-Host ""
Write-Host "[5/7] Building frontend..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
if (-not (Test-Path ".next")) { throw ".next folder not created - build failed" }
Write-Host "Build OK!"

# Step 6: Restart service
Write-Host ""
Write-Host "[6/7] Restarting frontend service..."

# Stop service
Write-Host "  Stopping service..."
& "C:\nssm-2.24\win64\nssm.exe" stop jobai-frontend 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Kill any process on port 3000
Write-Host "  Killing processes on port 3000..."
try {
    $connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            Write-Host "    Killing PID $pid"
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
} catch {
    Write-Host "  No processes on port 3000"
}
Start-Sleep -Seconds 2

# Start service
Write-Host "  Starting service..."
& "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend
Write-Host "  Waiting for service to start..."
Start-Sleep -Seconds 10

# Step 7: Health check
Write-Host ""
Write-Host "[7/7] Health check..."
$healthOk = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "Health check passed on attempt $i"
            Write-Host "Response: $($response.Content)"
            $healthOk = $true
            break
        }
    } catch {
        Write-Host "Attempt $i/10 - waiting..."
        Start-Sleep -Seconds 3
    }
}

if (-not $healthOk) {
    Write-Host "HEALTH CHECK FAILED!"
    & "C:\nssm-2.24\win64\nssm.exe" status jobai-frontend
    throw "Frontend not responding after 10 attempts"
}

Write-Host ""
Write-Host "========================================"
Write-Host "  DEPLOY SUCCESSFUL!"
Write-Host "========================================"
Write-Host "Old: $oldVersion"
Write-Host "New: $newVersion"
Write-Host "========================================"

exit 0
