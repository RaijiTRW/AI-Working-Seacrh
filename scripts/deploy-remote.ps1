# JobAI Deploy Script (FIXED VERSION 3)
# Called by GitHub Actions via SSH
# This version fixes npm EPERM errors

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
try {
    $stopResult = & "C:\nssm-2.24\win64\nssm.exe" stop jobai-frontend 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Service not running or already stopped"
    } else {
        Write-Host "  Service stopped"
    }
} catch {
    Write-Host "  Service not running or already stopped"
}
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
        $processId = $conn.OwningProcess
        if ($processId -ne 0) {
            Write-Host "    Force killing PID $processId on port 3000"
            try {
                taskkill /F /PID $processId 2>&1 | Out-Null
            } catch {
                Write-Host "      Process already terminated"
            }
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

# Disable credential helpers to avoid conflicts
Write-Host "  Configuring git credentials..."
& git config --local --unset credential.helper 2>&1 | Out-Null
& git config --local credential.helper "" 2>&1 | Out-Null

$repoUrl = "https://${gitToken}@github.com/RaijiTRW/AI-Working-Seacrh.git"
Write-Host "  Setting remote URL with token..."
& git remote set-url origin $repoUrl 2>&1 | Out-Null
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

# Verify token is not empty
if ($gitToken.Length -eq 0) {
    Write-Host "ERROR: GH_DEPLOY_TOKEN is empty!"
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    exit 1
}

# Fetch with error checking - FIXED to handle stderr properly
Write-Host "  Running git fetch..."
Write-Host "  Fetching from origin/main..."

# Use try-catch to handle PowerShell's stderr interpretation
try {
    # Redirect stderr to stdout to prevent PowerShell from treating it as an error
    $fetchOutput = cmd /c "git fetch origin main 2>&1" 2>&1
    $fetchExitCode = $LASTEXITCODE

    Write-Host "  Fetch output:"
    Write-Host $fetchOutput

    if ($fetchExitCode -ne 0) {
        Write-Host "ERROR: git fetch failed with exit code $fetchExitCode"
        Write-Host ""
        Write-Host "Debugging information:"
        Write-Host "  Git version: $(git --version 2>&1)"
        Write-Host "  Remote URL: $(git remote get-url origin 2>&1)"
        Write-Host "  Current branch: $(git branch --show-current 2>&1)"
        Write-Host ""
        Write-Host "Common causes:"
        Write-Host "  1. GH_DEPLOY_TOKEN is invalid or expired"
        Write-Host "  2. Token lacks 'repo' permissions"
        Write-Host "  3. Repository is private and token doesn't have access"
        Write-Host "  4. Network connectivity issues"
        Write-Host ""
        Write-Host "Please check your GitHub Actions secrets and try again."
        & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
        exit 1
    }

    Write-Host "  Fetch successful!"
} catch {
    Write-Host "ERROR: Exception during git fetch: $_"
    Write-Host ""
    Write-Host "Debugging information:"
    Write-Host "  Git version: $(git --version 2>&1)"
    Write-Host "  Remote URL: $(git remote get-url origin 2>&1)"
    Write-Host "  Current branch: $(git branch --show-current 2>&1)"
    & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    exit 1
}

# Show what origin/main points to
$remoteHead = git rev-parse --short origin/main 2>&1
Write-Host "  Remote origin/main: $remoteHead"

# Reset with error checking
Write-Host "  Running git reset --hard origin/main..."
try {
    $resetOutput = cmd /c "git reset --hard origin/main 2>&1" 2>&1
    $resetExitCode = $LASTEXITCODE

    Write-Host $resetOutput

    if ($resetExitCode -ne 0) {
        Write-Host "ERROR: git reset failed with exit code $resetExitCode"
        & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
        exit 1
    }
} catch {
    Write-Host "ERROR: Exception during git reset: $_"
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

# Step 5: Clear ALL caches + delete node_modules - AGGRESSIVE VERSION
Write-Host ""
Write-Host "[5/9] Clearing ALL caches..."
$cacheDirs = @(".next", "node_modules", ".turbo", ".swc")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing $dir..."
        # Try multiple methods to delete
        try {
            Remove-Item -Recurse -Force $dir -ErrorAction Stop
            Write-Host "    Removed with Remove-Item"
        } catch {
            Write-Host "    Remove-Item failed, trying cmd /c rmdir..."
            try {
                cmd /c "rmdir /s /q `"$dir`"" 2>&1 | Out-Null
                Write-Host "    Removed with cmd /c rmdir"
            } catch {
                Write-Host "    cmd /c rmdir failed, trying robocopy..."
                try {
                    # Create empty directory and use robocopy to mirror (delete everything)
                    $emptyDir = "$env:TEMP\empty_dir_$(Get-Random)"
                    New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
                    robocopy $emptyDir $dir /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
                    Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
                    Remove-Item -Recurse -Force $emptyDir -ErrorAction SilentlyContinue
                    Write-Host "    Removed with robocopy"
                } catch {
                    Write-Host "    WARNING: Could not remove $dir - $_"
                }
            }
        }
    }
}
try {
    & npm cache clean --force 2>&1 | Out-Null
} catch {
    Write-Host "  Warning: npm cache clean failed - $_"
}
Write-Host "Caches cleared!"

# Step 6: Install dependencies (fresh) - WITH RETRY
Write-Host ""
Write-Host "[6/9] Installing dependencies..."
$ErrorActionPreference = "Continue"

# Try npm ci first, if fails try npm install
$npmSuccess = $false
$maxRetries = 3

for ($retry = 1; $retry -le $maxRetries; $retry++) {
    Write-Host "  Attempt $retry/$maxRetries..."

    if ($retry -eq 1) {
        # First try: npm ci
        & npm ci 2>&1 | Out-Host
        $npmExitCode = $LASTEXITCODE
    } else {
        # Retry with npm install (more tolerant)
        Write-Host "  npm ci failed, trying npm install..."
        & npm install --force 2>&1 | Out-Host
        $npmExitCode = $LASTEXITCODE
    }

    if ($npmExitCode -eq 0) {
        $npmSuccess = $true
        Write-Host "  Dependencies installed successfully!"
        break
    } else {
        Write-Host "  Attempt $retry failed with exit code $npmExitCode"
        if ($retry -lt $maxRetries) {
            Write-Host "  Waiting 5 seconds before retry..."
            Start-Sleep -Seconds 5

            # Additional cleanup before retry
            Write-Host "  Additional cleanup before retry..."
            if (Test-Path "node_modules") {
                try {
                    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
                } catch {
                    cmd /c "rmdir /s /q node_modules" 2>&1 | Out-Null
                }
            }
        }
    }
}

$ErrorActionPreference = "Stop"

if (-not $npmSuccess) {
    Write-Host "ERROR: All npm install attempts failed"
    Write-Host "This is likely due to file locks (antivirus, Windows Defender, etc.)"
    Write-Host "Try running the deployment manually on the server."
    try {
        & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    } catch {}
    exit 1
}
Write-Host "Dependencies installed!"

# Step 7: Build
Write-Host ""
Write-Host "[7/9] Building frontend..."
$ErrorActionPreference = "Continue"
& npm run build 2>&1 | Out-Host
$buildExitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($buildExitCode -ne 0) {
    Write-Host "ERROR: npm run build failed with exit code $buildExitCode"
    try {
        & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    } catch {}
    exit 1
}
if (-not (Test-Path ".next")) {
    Write-Host "ERROR: .next folder not created - build failed"
    try {
        & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1 | Out-Null
    } catch {}
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

try {
    $startResult = & "C:\nssm-2.24\win64\nssm.exe" start jobai-frontend 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  WARNING: Service start returned error code $LASTEXITCODE"
        Write-Host "  $startResult"
    } else {
        Write-Host "  Service started"
    }
} catch {
    Write-Host "  WARNING: Service start failed: $_"
}
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

    # Try to fetch chunk
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

# Cleanup: Restore git credential helper
Write-Host ""
Write-Host "Cleaning up git configuration..."
& git config --local --unset credential.helper 2>&1 | Out-Null
Write-Host "Git credential helper reset"

exit 0
