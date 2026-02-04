# JobAI Zero-Downtime Deploy Script for Windows
# This script performs a graceful deployment without stopping the service

param(
    [string]$AppDir = "C:\apps\AI-Working-Seacrh"
)

Set-Location $AppDir
$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "  ZERO-DOWNTIME DEPLOY"
Write-Host "========================================"
Write-Host "Directory: $AppDir"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# Step 1: Save old version
Write-Host ""
Write-Host "[1/7] Saving old version..."
try {
    $oldVersion = & git rev-parse --short HEAD 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Could not get old version (first deploy?)"
        $oldVersion = "unknown"
    }
    Write-Host "Old version: $oldVersion"
    Set-Content -Path ".version-old" -Value $oldVersion -ErrorAction SilentlyContinue
} catch {
    Write-Host "WARNING: $_"
    $oldVersion = "unknown"
}

# Step 2: Set up git remote with token for authenticated access
Write-Host ""
Write-Host "[2/7] Setting up git remote..."
$gitToken = $env:GH_DEPLOY_TOKEN
if (-not $gitToken) {
    Write-Host "ERROR: GH_DEPLOY_TOKEN environment variable not set!"
    Write-Host "This token is required to fetch from private repository."
    exit 1
}

$repoUrl = "https://${gitToken}@github.com/RaijiTRW/AI-Working-Seacrh.git"
Write-Host "  Setting remote URL with token..."
& git remote set-url origin $repoUrl 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to set git remote URL"
    exit 1
}
Write-Host "  Remote configured"

# Step 3: Pull latest code
Write-Host ""
Write-Host "[3/7] Pulling latest code..."

# Show git remote info
Write-Host "  Git remote: $(git remote get-url origin)"
Write-Host "  Current HEAD: $(git rev-parse --short HEAD 2>&1)"

# Fetch with error checking
Write-Host "  Running git fetch..."
$fetchOutput = & git fetch --all --prune 2>&1
Write-Host $fetchOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git fetch failed with exit code $LASTEXITCODE"
    exit 1
}

# Show what origin/main points to
$remoteHead = git rev-parse --short origin/main 2>&1
Write-Host "  Remote origin/main: $remoteHead"

# Reset with error checking
Write-Host "  Running git reset --hard origin/main..."
$resetOutput = & git reset --hard origin/main 2>&1
Write-Host $resetOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git reset failed with exit code $LASTEXITCODE"
    exit 1
}

& git clean -fd 2>&1 | Out-Null

$newVersion = git rev-parse --short HEAD
Write-Host "  New version: $newVersion"
Set-Content -Path ".version" -Value $newVersion

# CRITICAL: Verify version actually changed (unless first deploy)
if ($oldVersion -ne "unknown" -and $oldVersion -eq $newVersion) {
    Write-Host ""
    Write-Host "WARNING: Version did not change! ($oldVersion -> $newVersion)"
    Write-Host "This might indicate git fetch did not get new commits."
    Write-Host "Checking remote commits..."
    & git log --oneline origin/main -3 2>&1 | Out-Host
    Write-Host "Skipping build as no changes detected."
    Write-Host "========================================"
    exit 0
}

# Step 4: Install dependencies
Write-Host ""
Write-Host "[4/7] Installing dependencies..."
$ErrorActionPreference = "Continue"
& npm ci 2>&1 | Out-Host
$npmExitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($npmExitCode -ne 0) {
    Write-Host "ERROR: npm ci failed with exit code $npmExitCode"
    exit 1
}
Write-Host "Dependencies installed!"

# Step 5: Build
Write-Host ""
Write-Host "[5/7] Building frontend..."
$ErrorActionPreference = "Continue"
& npm run build 2>&1 | Out-Host
$buildExitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($buildExitCode -ne 0) {
    Write-Host "ERROR: npm run build failed with exit code $buildExitCode"
    exit 1
}
if (-not (Test-Path ".next")) {
    Write-Host "ERROR: .next folder not created - build failed"
    exit 1
}
Write-Host "Build OK!"

# Step 6: Graceful reload using PM2 (if available) or NSSM restart
Write-Host ""
Write-Host "[6/7] Reloading service..."

# Try PM2 first (zero-downtime)
$pm2Available = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Available) {
    Write-Host "  Using PM2 for zero-downtime reload..."
    & pm2 reload jobai-frontend --update-env 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  PM2 reload failed, trying NSSM restart..."
        try {
            & "C:\nssm-2.24\win64\nssm.exe" restart jobai-frontend 2>&1 | Out-Null
        } catch {
            Write-Host "  WARNING: NSSM restart failed: $_"
        }
    } else {
        Write-Host "  PM2 reload successful!"
    }
} else {
    Write-Host "  PM2 not available, using NSSM restart..."
    try {
        & "C:\nssm-2.24\win64\nssm.exe" restart jobai-frontend 2>&1 | Out-Null
        Write-Host "  NSSM restart successful!"
    } catch {
        Write-Host "  WARNING: NSSM restart failed: $_"
    }
}

Write-Host "Waiting for service to start..."
Start-Sleep -Seconds 5

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
    Write-Host "ERROR: Frontend not responding after 10 attempts"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "  DEPLOY SUCCESSFUL!"
Write-Host "========================================"
Write-Host "Old: $oldVersion"
Write-Host "New: $newVersion"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

exit 0
