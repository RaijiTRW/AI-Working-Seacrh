# JobAI Deploy Script
# Called by GitHub Actions via SSH

param(
    [string]$AppDir = "C:\apps\AI-Working-Seacrh"
)

Set-Location $AppDir
$ErrorActionPreference = "Continue"

Write-Host "========================================"
Write-Host "  DEPLOY STARTED"
Write-Host "========================================"

# Step 1: Save old version
Write-Host ""
Write-Host "[1/8] Saving old version..."
$oldVersion = git rev-parse --short HEAD
Write-Host "Old version: $oldVersion"
Set-Content -Path ".version-old" -Value $oldVersion

# Step 2: STOP SERVICE FIRST (to unlock node_modules files)
Write-Host ""
Write-Host "[2/8] Stopping frontend service..."
& "C:\nssm-2.24\win64\nssm.exe" stop jobai-frontend 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Kill any process on port 3000
Write-Host "  Killing processes on port 3000..."
try {
    $connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -ne 0) {
                Write-Host "    Killing PID $p"
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            }
        }
    }
} catch {
    Write-Host "  No processes on port 3000"
}
Start-Sleep -Seconds 2
Write-Host "Service stopped!"

# Step 3: Pull latest code
Write-Host ""
Write-Host "[3/8] Pulling latest code..."
& git fetch --all --prune 2>&1 | Out-Host
& git reset --hard origin/main 2>&1 | Out-Host
& git clean -fd 2>&1 | Out-Null
$newVersion = git rev-parse --short HEAD
Write-Host "New version: $newVersion"
Set-Content -Path ".version" -Value $newVersion

# Step 4: Clear ALL caches + delete node_modules
Write-Host ""
Write-Host "[4/8] Clearing ALL caches..."
$cacheDirs = @(".next", "node_modules", ".turbo", ".swc")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing $dir..."
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}
& npm cache clean --force 2>&1 | Out-Null
Write-Host "Caches cleared!"

# Step 5: Install dependencies (fresh)
Write-Host ""
Write-Host "[5/8] Installing dependencies..."
& npm ci 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm ci failed with exit code $LASTEXITCODE"
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    exit 1
}
Write-Host "Dependencies installed!"

# Step 6: Build
Write-Host ""
Write-Host "[6/8] Building frontend..."
& npm run build 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm run build failed with exit code $LASTEXITCODE"
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    exit 1
}
if (-not (Test-Path ".next")) {
    Write-Host "ERROR: .next folder not created - build failed"
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    exit 1
}
Write-Host "Build OK!"

# Step 7: Start service
Write-Host ""
Write-Host "[7/8] Starting frontend service..."
& "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend
Write-Host "Waiting for service to start..."
Start-Sleep -Seconds 10

# Step 8: Health check
Write-Host ""
Write-Host "[8/8] Health check..."
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
    Write-Host "ERROR: Frontend not responding after 10 attempts"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "  DEPLOY SUCCESSFUL!"
Write-Host "========================================"
Write-Host "Old: $oldVersion"
Write-Host "New: $newVersion"
Write-Host "========================================"

exit 0
