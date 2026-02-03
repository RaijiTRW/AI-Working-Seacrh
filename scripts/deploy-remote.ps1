# JobAI Deploy Script
# Called by GitHub Actions via SSH

param(
    [string]$AppDir = "C:\apps\AI-Working-Seacrh"
)

Set-Location $AppDir
$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "  DEPLOY STARTED"
Write-Host "========================================"
Write-Host "Directory: $AppDir"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# Step 1: Save old version
Write-Host ""
Write-Host "[1/9] Saving old version..."
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

# Step 2: STOP SERVICE FIRST (to unlock node_modules files)
Write-Host ""
Write-Host "[2/9] Stopping frontend service..."

# First stop NSSM service
Write-Host "  Stopping NSSM service..."
& "C:\nssm-2.24\win64\nssm.exe" stop jobai-frontend 2>&1 | Out-Null
Start-Sleep -Seconds 5

# Force kill ALL node processes (aggressive cleanup)
Write-Host "  Force killing ALL node processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "    Killing node PID $($_.Id)"
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3

# Double-check: Kill any process on port 3000
Write-Host "  Checking port 3000..."
$attempts = 0
while ($attempts -lt 5) {
    $connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    if (-not $connections) {
        Write-Host "  Port 3000 is free!"
        break
    }
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        if ($pid -ne 0) {
            Write-Host "    Force killing PID $pid on port 3000"
            taskkill /F /PID $pid 2>&1 | Out-Null
        }
    }
    Start-Sleep -Seconds 2
    $attempts++
}

# Verify port is free
$finalCheck = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
if ($finalCheck) {
    Write-Host "WARNING: Port 3000 still occupied after cleanup attempts!"
    foreach ($conn in $finalCheck) {
        Write-Host "  PID: $($conn.OwningProcess)"
    }
} else {
    Write-Host "Service stopped!"
}

# Step 3: Set up git remote with token for authenticated access
Write-Host ""
Write-Host "[3/9] Setting up git remote..."
$gitToken = $env:GH_DEPLOY_TOKEN
if (-not $gitToken) {
    Write-Host "ERROR: GH_DEPLOY_TOKEN environment variable not set!"
    Write-Host "This token is required to fetch from private repository."
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    exit 1
}

$repoUrl = "https://${gitToken}@github.com/RaijiTRW/AI-Working-Seacrh.git"
Write-Host "  Setting remote URL with token..."
& git remote set-url origin $repoUrl 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to set git remote URL"
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    exit 1
}
Write-Host "  Remote configured"

# Step 4: Pull latest code
Write-Host ""
Write-Host "[4/9] Pulling latest code..."

# Show git remote info
Write-Host "  Git remote: $(git remote get-url origin)"
Write-Host "  Current HEAD: $(git rev-parse --short HEAD 2>&1)"

# Fetch with error checking
Write-Host "  Running git fetch..."
$fetchOutput = & git fetch --all --prune 2>&1
Write-Host $fetchOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git fetch failed with exit code $LASTEXITCODE"
    Write-Host "This usually means git credentials are not configured on the server."
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
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
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
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
}

# Step 5: Clear ALL caches + delete node_modules
Write-Host ""
Write-Host "[5/9] Clearing ALL caches..."
$cacheDirs = @(".next", "node_modules", ".turbo", ".swc")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing $dir..."
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}
& npm cache clean --force 2>$null | Out-Null
Write-Host "Caches cleared!"

# Step 6: Install dependencies (fresh)
Write-Host ""
Write-Host "[6/9] Installing dependencies..."
& npm ci 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm ci failed with exit code $LASTEXITCODE"
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    exit 1
}
Write-Host "Dependencies installed!"

# Step 7: Build
Write-Host ""
Write-Host "[7/9] Building frontend..."
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

# Step 8: Start service
Write-Host ""
Write-Host "[8/9] Starting frontend service..."

# Ensure no stale node process before starting
$staleNode = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($staleNode) {
    Write-Host "  WARNING: Found stale node process, killing..."
    $staleNode | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

& "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend
Write-Host "Waiting for service to start..."
Start-Sleep -Seconds 10

# Verify new process is running
$newNode = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($newNode) {
    Write-Host "  Node process started with PID: $($newNode.Id)"
    Write-Host "  Started at: $($newNode.StartTime)"
} else {
    Write-Host "  WARNING: No node process found after service start!"
}

# Step 9: Health check
Write-Host ""
Write-Host "[9/9] Health check..."
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

# Step 9b: Verify chunks are being served correctly
Write-Host ""
Write-Host "Verifying static assets..."
$buildId = Get-Content ".next/BUILD_ID" -ErrorAction SilentlyContinue
Write-Host "  Build ID: $buildId"

# Get a sample chunk hash from disk
$sampleChunk = Get-ChildItem ".next/static/chunks" -Filter "*.js" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($sampleChunk) {
    $chunkName = $sampleChunk.Name
    Write-Host "  Sample chunk on disk: $chunkName"

    # Try to fetch the chunk
    try {
        $chunkUrl = "http://127.0.0.1:3000/_next/static/chunks/$chunkName"
        $chunkResponse = Invoke-WebRequest -Uri $chunkUrl -UseBasicParsing -TimeoutSec 5
        if ($chunkResponse.StatusCode -eq 200) {
            Write-Host "  Chunk fetch: OK (200)"
        }
    } catch {
        Write-Host "  WARNING: Could not fetch chunk - $_"
    }
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
