# Unified Deploy Script for JobAI Search
# Supports:
# - dual service mode (jobai-frontend-1 on 3000 + jobai-frontend-2 on 3001)
# - single service mode (jobai-frontend on 3000)
# - fallback detached process mode when services are missing

param(
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$FallbackAppDir = "C:\apps\AI-Working-Seacrh",
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe",
    [string]$RepoUrl = "https://github.com/RaijiTRW/AI-Working-Seacrh.git",
    [string]$ExternalHealthUrl = "https://jobaisearch.ru/api/version"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host $Title -ForegroundColor Cyan
}

function Invoke-GitCommand {
    param(
        [string]$Command,
        [string]$StepName
    )

    $output = cmd /c "$Command 2>&1"
    if ($output) {
        $output | Out-Host
    }

    if ($LASTEXITCODE -ne 0) {
        throw "$StepName failed (exit code $LASTEXITCODE)"
    }
}

function Invoke-NpmCommand {
    param(
        [string]$Command,
        [string]$StepName
    )

    $output = cmd /c "$Command 2>&1"
    if ($output) {
        $output | Out-Host
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host ("  {0} failed (exit code {1})" -f $StepName, $LASTEXITCODE) -ForegroundColor Yellow
        return $false
    }

    return $true
}

function Get-PortPid {
    param([int]$Port)

    try {
        $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($listener -and $listener.OwningProcess -and $listener.OwningProcess -ne 0) {
            return [int]$listener.OwningProcess
        }
    } catch {}

    return $null
}

function Resolve-AppDirectory {
    param(
        [string]$Primary,
        [string]$Secondary
    )

    $candidates = @($Primary, $Secondary) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    foreach ($candidate in $candidates) {
        if ((Test-Path $candidate) -and (Test-Path (Join-Path $candidate ".git")) -and (Test-Path (Join-Path $candidate "package.json"))) {
            return $candidate
        }
    }
    throw "Could not find a valid app directory. Checked: $($candidates -join ', ')"
}

function Get-ServiceAppDirectory {
    param(
        [string]$NssmExecutable,
        [string[]]$ServiceNames
    )

    if (-not (Test-Path $NssmExecutable)) {
        return $null
    }

    foreach ($serviceName in $ServiceNames) {
        try {
            $dir = (& $NssmExecutable get $serviceName AppDirectory 2>$null)
            if ($LASTEXITCODE -eq 0 -and $dir) {
                $candidate = $dir.Trim()
                if ((Test-Path $candidate) -and (Test-Path (Join-Path $candidate ".git")) -and (Test-Path (Join-Path $candidate "package.json"))) {
                    return $candidate
                }
            }
        } catch {}
    }

    return $null
}

function Sanitize-RemoteUrl {
    param([string]$Url)
    if ([string]::IsNullOrWhiteSpace($Url)) { return $Url }
    return ($Url -replace 'https://[^@/]+@github\.com/', 'https://github.com/')
}

function Service-Exists {
    param([string]$Name)
    return $null -ne (Get-Service -Name $Name -ErrorAction SilentlyContinue)
}

function Stop-ServiceSafe {
    param([string]$Name)
    if (-not (Service-Exists -Name $Name)) { return }

    try {
        & $script:NssmPath stop $Name 2>&1 | Out-Host
    } catch {
        Write-Host ("  Warning: failed to stop service ${Name}: {0}" -f $_) -ForegroundColor Yellow
    }

    Start-Sleep -Seconds 2
}

function Start-ServiceSafe {
    param([string]$Name)
    if (-not (Service-Exists -Name $Name)) {
        throw "Service $Name not found"
    }

    & $script:NssmPath start $Name 2>&1 | Out-Host
}

function Clear-Port {
    param([int]$Port)

    try {
        $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($listener in $listeners) {
            $processId = $listener.OwningProcess
            if ($processId -and $processId -ne 0) {
                Write-Host "  Killing PID $processId on port $Port"
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        Write-Host ("  Warning: could not clear port ${Port}: {0}" -f $_) -ForegroundColor Yellow
    }
}

function Wait-Health {
    param(
        [string]$Url,
        [int]$Attempts = 30,
        [int]$DelaySeconds = 2
    )

    for ($i = 1; $i -le $Attempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                return $true
            }
        } catch {}

        Write-Host "  Waiting for health: attempt $i/$Attempts"
        Start-Sleep -Seconds $DelaySeconds
    }

    return $false
}

function Stop-PidFileProcess {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return }

    try {
        $pidFromFile = Get-Content $FilePath -ErrorAction SilentlyContinue
        if ($pidFromFile) {
            Stop-Process -Id $pidFromFile -Force -ErrorAction SilentlyContinue
        }
    } catch {}

    Remove-Item $FilePath -Force -ErrorAction SilentlyContinue
}

function Start-FallbackProcess {
    param([string]$WorkingDirectory)

    $nodeExe = "C:\Program Files\nodejs\node.exe"
    $nextDistBin = Join-Path $WorkingDirectory "node_modules\next\dist\bin\next"
    $nextBin = Join-Path $WorkingDirectory "node_modules\next\bin\next"

    if (-not (Test-Path $nodeExe)) {
        throw "node.exe not found at $nodeExe"
    }

    if (Test-Path $nextDistBin) {
        $nextPath = $nextDistBin
    } elseif (Test-Path $nextBin) {
        $nextPath = $nextBin
    } else {
        throw "Next.js binary not found in node_modules"
    }

    $env:NODE_ENV = "production"
    $env:PORT = "3000"

    $process = Start-Process -FilePath $nodeExe -ArgumentList @($nextPath, "start", "-p", "3000") -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -PassThru
    $process.Id | Out-File -FilePath (Join-Path $WorkingDirectory "node.pid") -Encoding UTF8
    Write-Host "  Fallback process started with PID: $($process.Id)" -ForegroundColor Green
}

try {
    $script:NssmPath = $NssmPath

    $serviceAppDir = Get-ServiceAppDirectory -NssmExecutable $NssmPath -ServiceNames @(
        "jobai-frontend-1",
        "jobai-frontend-2",
        "jobai-frontend"
    )

    if ($serviceAppDir) {
        $resolvedAppDir = $serviceAppDir
    } else {
        $resolvedAppDir = Resolve-AppDirectory -Primary $AppDir -Secondary $FallbackAppDir
    }

    $AppDir = $resolvedAppDir
    Set-Location $AppDir

    Write-Host "========================================"
    Write-Host "  JobAI Deploy (Unified)"
    Write-Host "========================================"
    Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "AppDir: $AppDir"
    Write-Host ""

    $originBefore = (& git remote get-url origin 2>$null)
    $originBefore = if ($originBefore) { $originBefore.Trim() } else { $RepoUrl }
    $originForRestore = Sanitize-RemoteUrl -Url $originBefore

    $hasService1 = Service-Exists -Name "jobai-frontend-1"
    $hasService2 = Service-Exists -Name "jobai-frontend-2"
    $hasSingleService = Service-Exists -Name "jobai-frontend"
    $dualMode = $hasService1 -and $hasService2

    if ($dualMode) {
        Write-Host "Mode: dual-service (3000 + 3001)" -ForegroundColor Green
    } elseif ($hasSingleService) {
        Write-Host "Mode: single-service (3000)" -ForegroundColor Green
    } else {
        Write-Host "Mode: fallback process (no NSSM service found)" -ForegroundColor Yellow
    }

    Write-Section "[1/6] Pulling latest code"

    $gitToken = $env:GH_DEPLOY_TOKEN
    if (-not $gitToken) {
        throw "GH_DEPLOY_TOKEN is not set"
    }

    & git config --local --unset credential.helper 2>&1 | Out-Null
    & git config --local credential.helper "" 2>&1 | Out-Null

    $authRepoUrl = ($RepoUrl -replace '^https://', "https://$gitToken@")
    & git remote set-url origin $authRepoUrl 2>&1 | Out-Null

    Invoke-GitCommand -Command "git fetch origin main" -StepName "git fetch"
    Invoke-GitCommand -Command "git reset --hard origin/main" -StepName "git reset"
    Invoke-GitCommand -Command "git clean -fd" -StepName "git clean"

    $newVersion = (& git rev-parse --short HEAD).Trim()
    Write-Host "Deploying commit: $newVersion"

    Write-Section "[2/6] Stopping previous runtime"

    Stop-PidFileProcess -FilePath (Join-Path $AppDir "node.pid")

    if ($dualMode) {
        Stop-ServiceSafe -Name "jobai-frontend-1"
        Stop-ServiceSafe -Name "jobai-frontend-2"
    } elseif ($hasSingleService) {
        Stop-ServiceSafe -Name "jobai-frontend"
    }

    Clear-Port -Port 3000
    Clear-Port -Port 3001
    Start-Sleep -Seconds 2

    Write-Section "[3/6] Installing dependencies"

    if (Test-Path "node_modules") {
        try {
            Remove-Item -Recurse -Force "node_modules" -ErrorAction Stop
        } catch {
            Write-Host "  Warning: could not fully remove node_modules, continuing with fallback installs" -ForegroundColor Yellow
        }
    }

    $depsOk = $false
    if (Invoke-NpmCommand -Command "npm ci" -StepName "npm ci") {
        $depsOk = $true
    } elseif (Invoke-NpmCommand -Command "npm install --no-audit --no-fund" -StepName "npm install") {
        $depsOk = $true
    } elseif (Invoke-NpmCommand -Command "npm install --force" -StepName "npm install --force") {
        $depsOk = $true
    }

    if (-not $depsOk) {
        throw "Dependency installation failed after all retries"
    }

    Write-Section "[4/6] Building"

    if (Test-Path ".next") {
        try {
            Remove-Item -Recurse -Force ".next" -ErrorAction Stop
        } catch {
            Write-Host "  Warning: could not remove .next with Remove-Item, trying cmd rmdir" -ForegroundColor Yellow
            cmd /c "rmdir /s /q .next" 2>&1 | Out-Host
        }
    }

    if (-not (Invoke-NpmCommand -Command "npm run build" -StepName "npm run build")) {
        throw "npm run build failed"
    }

    $buildIdPath = Join-Path $AppDir ".next\BUILD_ID"
    if (-not (Test-Path $buildIdPath)) {
        throw ".next/BUILD_ID not found after build"
    }

    $newBuildId = (Get-Content $buildIdPath).Trim()
    Set-Content -Path (Join-Path $AppDir ".version") -Value $newVersion -Encoding UTF8

    Write-Host "Build ID: $newBuildId"

    Write-Section "[5/6] Starting runtime"

    if ($dualMode) {
        Start-ServiceSafe -Name "jobai-frontend-1"
        if (-not (Wait-Health -Url "http://127.0.0.1:3000/api/version" -Attempts 40 -DelaySeconds 2)) {
            throw "jobai-frontend-1 failed health check on port 3000"
        }

        Start-ServiceSafe -Name "jobai-frontend-2"
        if (-not (Wait-Health -Url "http://127.0.0.1:3001/api/version" -Attempts 40 -DelaySeconds 2)) {
            throw "jobai-frontend-2 failed health check on port 3001"
        }

        Set-Content -Path (Join-Path $AppDir "active-instance.txt") -Value "1" -Encoding UTF8
    } elseif ($hasSingleService) {
        Start-ServiceSafe -Name "jobai-frontend"
        if (-not (Wait-Health -Url "http://127.0.0.1:3000/api/version" -Attempts 40 -DelaySeconds 2)) {
            throw "jobai-frontend failed health check on port 3000"
        }
    } else {
        $pidBeforeFallback = Get-PortPid -Port 3000
        if ($pidBeforeFallback) {
            Write-Host "  Warning: port 3000 is already occupied by PID $pidBeforeFallback before fallback start" -ForegroundColor Yellow
        }

        Start-FallbackProcess -WorkingDirectory $AppDir
        if (-not (Wait-Health -Url "http://127.0.0.1:3000/api/version" -Attempts 40 -DelaySeconds 2)) {
            throw "Fallback process failed health check on port 3000"
        }

        $pidAfterFallback = Get-PortPid -Port 3000
        if ($pidBeforeFallback -and $pidAfterFallback -eq $pidBeforeFallback) {
            throw "Port 3000 is still owned by old PID $pidAfterFallback after fallback start. New code is not active."
        }
    }

    Write-Section "[6/6] Final checks"

    try {
        $localVersion = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 10
        Write-Host "Local health: OK (3000)" -ForegroundColor Green
        Write-Host $localVersion.Content
    } catch {
        throw "Final local check failed on port 3000: $_"
    }

    if ($dualMode) {
        try {
            $localVersion3001 = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/version" -UseBasicParsing -TimeoutSec 10
            Write-Host "Local health: OK (3001)" -ForegroundColor Green
            Write-Host $localVersion3001.Content
        } catch {
            throw "Final local check failed on port 3001: $_"
        }
    }

    try {
        $external = Invoke-WebRequest -Uri $ExternalHealthUrl -UseBasicParsing -TimeoutSec 15
        Write-Host "External health: OK" -ForegroundColor Green
        Write-Host $external.Content
    } catch {
        Write-Host "Warning: external check failed ($ExternalHealthUrl): $_" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "========================================"
    Write-Host "  Deploy Complete!"
    Write-Host "========================================"
    Write-Host "Commit: $newVersion"
    Write-Host "Build:  $newBuildId"
    Write-Host "Time:   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "========================================"

    exit 0
}
catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Deploy failed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Red
    exit 1
}
finally {
    try {
        if (Test-Path $AppDir) {
            Set-Location $AppDir
            & git remote set-url origin $originForRestore 2>&1 | Out-Null
            & git config --local --unset credential.helper 2>&1 | Out-Null
        }
    } catch {}
}
