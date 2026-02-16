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

function Stop-AppNodeProcesses {
    param([string]$WorkingDirectory)

    if ([string]::IsNullOrWhiteSpace($WorkingDirectory)) { return }

    $needle = $WorkingDirectory.ToLowerInvariant()
    $killed = 0

    try {
        $nodeProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
        foreach ($proc in $nodeProcesses) {
            $commandLine = if ($proc.CommandLine) { $proc.CommandLine.ToLowerInvariant() } else { "" }
            if ($commandLine.Contains($needle)) {
                Write-Host "  Killing app node process PID $($proc.ProcessId)"
                Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
                $killed++
            }
        }
    } catch {
        Write-Host ("  Warning: could not inspect node.exe processes: {0}" -f $_) -ForegroundColor Yellow
    }

    if ($killed -gt 0) {
        Start-Sleep -Seconds 1
    }
}

function Remove-DirectoryWithRetries {
    param(
        [string]$TargetPath,
        [int]$MaxAttempts = 4,
        [int]$DelaySeconds = 2
    )

    if ([string]::IsNullOrWhiteSpace($TargetPath) -or -not (Test-Path $TargetPath)) {
        return $true
    }

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            Remove-Item -Recurse -Force $TargetPath -ErrorAction Stop
            if (-not (Test-Path $TargetPath)) {
                return $true
            }
        } catch {}

        cmd /c "rmdir /s /q `"$TargetPath`"" 2>&1 | Out-Null
        if (-not (Test-Path $TargetPath)) {
            return $true
        }

        Write-Host "  Attempt $attempt/$MaxAttempts to remove $TargetPath failed" -ForegroundColor Yellow
        Start-Sleep -Seconds $DelaySeconds
    }

    return -not (Test-Path $TargetPath)
}

function Test-DependenciesChanged {
    param(
        [string]$OldRef,
        [string]$NewRef
    )

    if ([string]::IsNullOrWhiteSpace($OldRef) -or [string]::IsNullOrWhiteSpace($NewRef)) {
        return $true
    }

    $changedFiles = (& git diff --name-only $OldRef $NewRef -- package.json package-lock.json 2>$null)
    if ($LASTEXITCODE -ne 0) {
        return $true
    }

    foreach ($file in $changedFiles) {
        if (-not [string]::IsNullOrWhiteSpace("$file")) {
            return $true
        }
    }

    return $false
}

function Set-NodeMemoryTuning {
    param(
        [string]$Phase = "build"
    )

    $forcedHeapMb = 0
    if ($env:DEPLOY_NODE_HEAP_MB) {
        [void][int]::TryParse($env:DEPLOY_NODE_HEAP_MB, [ref]$forcedHeapMb)
    }

    $targetHeapMb = $forcedHeapMb
    if ($targetHeapMb -le 0) {
        $totalRamBytes = 0
        try {
            $computerSystem = Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue
            $totalRamBytes = [int64]($computerSystem.TotalPhysicalMemory)
        } catch {}

        $totalRamGb = if ($totalRamBytes -gt 0) { [math]::Floor($totalRamBytes / 1GB) } else { 0 }

        if ($totalRamGb -le 4 -and $totalRamGb -gt 0) {
            $targetHeapMb = 768
        } elseif ($totalRamGb -le 8 -and $totalRamGb -gt 0) {
            $targetHeapMb = 1024
        } elseif ($totalRamGb -le 12 -and $totalRamGb -gt 0) {
            $targetHeapMb = 1536
        } elseif ($totalRamGb -gt 12) {
            $targetHeapMb = 2048
        } else {
            $targetHeapMb = 1024
        }
    }

    if ($targetHeapMb -lt 768) {
        $targetHeapMb = 768
    }

    $existingNodeOptions = if ($env:NODE_OPTIONS) { $env:NODE_OPTIONS } else { "" }
    $cleanNodeOptions = $existingNodeOptions `
        -replace '--max-old-space-size=\d+\s*', '' `
        -replace '--max-semi-space-size=\d+\s*', ''
    $cleanNodeOptions = $cleanNodeOptions.Trim()

    $memoryOptions = "--max-old-space-size=$targetHeapMb --max-semi-space-size=64"
    if ([string]::IsNullOrWhiteSpace($cleanNodeOptions)) {
        $env:NODE_OPTIONS = $memoryOptions
    } else {
        $env:NODE_OPTIONS = "$cleanNodeOptions $memoryOptions"
    }

    # Reduce Next.js build parallelism on low-memory VPS/Windows hosts
    $env:NEXT_PRIVATE_BUILD_WORKER = "1"
    $env:NEXT_TELEMETRY_DISABLED = "1"

    Write-Host "  Node memory tuning ($Phase): NODE_OPTIONS=$($env:NODE_OPTIONS)" -ForegroundColor DarkGray
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

function Test-HealthFast {
    param(
        [string]$Url
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
    } catch {
        return $false
    }
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

function Remove-TaskIfExists {
    param([string]$TaskName)

    if ([string]::IsNullOrWhiteSpace($TaskName)) { return }

    cmd /c "schtasks /Query /TN `"$TaskName`" >nul 2>&1"
    if ($LASTEXITCODE -ne 0) { return }

    cmd /c "schtasks /End /TN `"$TaskName`" >nul 2>&1"
    cmd /c "schtasks /Delete /TN `"$TaskName`" /F >nul 2>&1"
    Write-Host "  Removed scheduled task: $TaskName"
}

function Start-FallbackProcess {
    param(
        [string]$WorkingDirectory,
        [int]$Port = 3000,
        [string]$TaskName = "JobAI-Frontend-Fallback"
    )

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

    $scriptsDir = Join-Path $WorkingDirectory "scripts"
    $logsDir = Join-Path $WorkingDirectory "logs"
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

    $launcherPath = Join-Path $scriptsDir "run-node-task-$Port.ps1"
    $stdoutLog = Join-Path $logsDir "fallback-$Port-out.log"
    $stderrLog = Join-Path $logsDir "fallback-$Port-err.log"

    $launcherScript = @"
`$ErrorActionPreference = "Continue"
`$env:NODE_ENV = "production"
`$env:PORT = "$Port"
Set-Location "$WorkingDirectory"

while (`$true) {
  try {
    Add-Content -Path "$stdoutLog" -Value "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [launcher] starting next"
    `$proc = Start-Process -FilePath "$nodeExe" -ArgumentList @("$nextPath", "start", "-p", "$Port") -WorkingDirectory "$WorkingDirectory" -WindowStyle Hidden -PassThru
    `$proc.Id | Out-File -FilePath "$WorkingDirectory\node-$Port.pid" -Encoding UTF8
    Wait-Process -Id `$proc.Id
    Add-Content -Path "$stderrLog" -Value "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [launcher] next exited with code `$(`$proc.ExitCode)"
  } catch {
    Add-Content -Path "$stderrLog" -Value "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [launcher] error: `$(`$_.Exception.Message)"
  }
  Start-Sleep -Seconds 3
}
"@

    Set-Content -Path $launcherPath -Value $launcherScript -Encoding UTF8

    Remove-TaskIfExists -TaskName $TaskName

    $taskCmd = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$launcherPath`""
    $createOutput = cmd /c "schtasks /Create /TN `"$TaskName`" /TR `"$taskCmd`" /SC ONCE /ST 00:00 /RL HIGHEST /F 2>&1"
    if ($createOutput) {
        $createOutput | Out-Host
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create task $TaskName"
    }

    $runOutput = cmd /c "schtasks /Run /TN `"$TaskName`" 2>&1"
    if ($runOutput) {
        $runOutput | Out-Host
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to run task $TaskName"
    }

    Write-Host "  Fallback runtime started via task: $TaskName (port $Port)" -ForegroundColor Green
    Write-Host "  Logs: $stdoutLog / $stderrLog"
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

    $previousRef = (& git rev-parse HEAD 2>$null)
    $previousRef = if ($LASTEXITCODE -eq 0 -and $previousRef) { $previousRef.Trim() } else { "" }
    $previousVersion = if ($previousRef) { (& git rev-parse --short $previousRef 2>$null).Trim() } else { "unknown" }

    & git config --local --unset credential.helper 2>&1 | Out-Null
    & git config --local credential.helper "" 2>&1 | Out-Null

    $authRepoUrl = ($RepoUrl -replace '^https://', "https://$gitToken@")
    & git remote set-url origin $authRepoUrl 2>&1 | Out-Null

    Invoke-GitCommand -Command "git fetch origin main" -StepName "git fetch"
    Invoke-GitCommand -Command "git reset --hard origin/main" -StepName "git reset"
    Invoke-GitCommand -Command "git clean -fd" -StepName "git clean"

    $newRef = (& git rev-parse HEAD).Trim()
    $newVersion = (& git rev-parse --short HEAD).Trim()
    $depsChanged = Test-DependenciesChanged -OldRef $previousRef -NewRef $newRef
    Write-Host "Deploying commit: $newVersion"

    Write-Section "[2/6] Stopping previous runtime"

    Stop-PidFileProcess -FilePath (Join-Path $AppDir "node.pid")

    if ($dualMode) {
        Stop-ServiceSafe -Name "jobai-frontend-1"
        Stop-ServiceSafe -Name "jobai-frontend-2"
        Clear-Port -Port 3000
        Clear-Port -Port 3001
    } elseif ($hasSingleService) {
        Stop-ServiceSafe -Name "jobai-frontend"
        Clear-Port -Port 3000
    } else {
        # Cleanup legacy and current fallback tasks.
        Remove-TaskIfExists -TaskName "JobAI-Node-Runner"
        Remove-TaskIfExists -TaskName "JobAI-Frontend-3000"
        Remove-TaskIfExists -TaskName "JobAI-Frontend-3001"
        Remove-TaskIfExists -TaskName "JobAI-Frontend-Fallback"
        Stop-PidFileProcess -FilePath (Join-Path $AppDir "node-3000.pid")
        Stop-PidFileProcess -FilePath (Join-Path $AppDir "node-3001.pid")
        Clear-Port -Port 3000
        Clear-Port -Port 3001
    }

    Stop-AppNodeProcesses -WorkingDirectory $AppDir
    Start-Sleep -Seconds 2

    Write-Section "[3/6] Installing dependencies"

    $nodeModulesPath = Join-Path $AppDir "node_modules"
    $nextPackagePath = Join-Path $AppDir "node_modules\next\package.json"
    $shouldInstallDeps = $false

    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host "  node_modules is missing -> install required" -ForegroundColor Yellow
        $shouldInstallDeps = $true
    } elseif (-not (Test-Path $nextPackagePath)) {
        Write-Host "  next package missing in node_modules -> install required" -ForegroundColor Yellow
        $shouldInstallDeps = $true
    } elseif ($depsChanged) {
        Write-Host "  package manifests changed ($previousVersion -> $newVersion) -> reinstall required" -ForegroundColor Yellow
        $shouldInstallDeps = $true
    } else {
        Write-Host "  package manifests unchanged -> reusing existing node_modules" -ForegroundColor Green
    }

    if ($shouldInstallDeps) {
        Stop-AppNodeProcesses -WorkingDirectory $AppDir

        if (-not (Remove-DirectoryWithRetries -TargetPath $nodeModulesPath -MaxAttempts 5 -DelaySeconds 2)) {
            throw "node_modules is locked and could not be removed"
        }

        Set-NodeMemoryTuning -Phase "deps"

        $env:npm_config_audit = "false"
        $env:npm_config_fund = "false"
        $env:npm_config_progress = "false"

        Write-Host "  Installing dependencies with reduced memory pressure..." -ForegroundColor Cyan

        $depsOk = $false
        if (Invoke-NpmCommand -Command "npm ci --no-audit --no-fund" -StepName "npm ci") {
            $depsOk = $true
        } else {
            Write-Host "  npm ci failed, doing cleanup and fallback install..." -ForegroundColor Yellow
            Stop-AppNodeProcesses -WorkingDirectory $AppDir
            Remove-DirectoryWithRetries -TargetPath $nodeModulesPath -MaxAttempts 3 -DelaySeconds 2 | Out-Null

            if (Invoke-NpmCommand -Command "npm install --no-audit --no-fund --prefer-offline" -StepName "npm install") {
                $depsOk = $true
            }
        }

        if (-not $depsOk) {
            throw "Dependency installation failed after retries"
        }
    }

    Write-Section "[4/6] Building"

    Set-NodeMemoryTuning -Phase "build"

    if (Test-Path ".next") {
        try {
            Remove-Item -Recurse -Force ".next" -ErrorAction Stop
        } catch {
            Write-Host "  Warning: could not remove .next with Remove-Item, trying cmd rmdir" -ForegroundColor Yellow
            cmd /c "rmdir /s /q .next" 2>&1 | Out-Host
        }
    }

    $nextCliPath = Join-Path $AppDir "node_modules\next\dist\bin\next"
    if (Test-Path $nextCliPath) {
        if (-not (Invoke-NpmCommand -Command "node `"$nextCliPath`" build" -StepName "next build")) {
            throw "next build failed"
        }
    } else {
        if (-not (Invoke-NpmCommand -Command "npm run build" -StepName "npm run build")) {
            throw "npm run build failed"
        }
    }

    $buildIdPath = Join-Path $AppDir ".next\BUILD_ID"
    if (-not (Test-Path $buildIdPath)) {
        throw ".next/BUILD_ID not found after build"
    }

    $newBuildId = (Get-Content $buildIdPath).Trim()
    Set-Content -Path (Join-Path $AppDir ".version") -Value $newVersion -Encoding UTF8

    Write-Host "Build ID: $newBuildId"

    Write-Section "[5/6] Starting runtime"
    $fallbackPrimaryPort = $null

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
        $port3000Healthy = Test-HealthFast -Url "http://127.0.0.1:3000/api/version"
        $port3001Healthy = Test-HealthFast -Url "http://127.0.0.1:3001/api/version"

        if ($port3000Healthy -and -not $port3001Healthy) {
            $activePort = 3000
            $standbyPort = 3001
        } elseif ($port3001Healthy -and -not $port3000Healthy) {
            $activePort = 3001
            $standbyPort = 3000
        } elseif ($port3000Healthy -and $port3001Healthy) {
            $activeFile = Join-Path $AppDir "active-instance.txt"
            $activeInstance = if (Test-Path $activeFile) { (Get-Content $activeFile -ErrorAction SilentlyContinue).Trim() } else { "1" }
            if ($activeInstance -eq "2") {
                $activePort = 3001
                $standbyPort = 3000
            } else {
                $activePort = 3000
                $standbyPort = 3001
            }
        } else {
            $activePort = 3000
            $standbyPort = 3001
        }

        Write-Host "  Fallback blue/green: active=$activePort standby=$standbyPort" -ForegroundColor Cyan

        $standbyTask = "JobAI-Frontend-$standbyPort"
        Clear-Port -Port $standbyPort
        Start-FallbackProcess -WorkingDirectory $AppDir -Port $standbyPort -TaskName $standbyTask
        if (-not (Wait-Health -Url "http://127.0.0.1:$standbyPort/api/version" -Attempts 40 -DelaySeconds 2)) {
            throw "Fallback standby failed health check on port $standbyPort"
        }

        $fallbackPrimaryPort = $standbyPort
        Set-Content -Path (Join-Path $AppDir "active-instance.txt") -Value ($(if ($fallbackPrimaryPort -eq 3000) { "1" } else { "2" })) -Encoding UTF8

        if ($port3000Healthy -or $port3001Healthy) {
            $activeTask = "JobAI-Frontend-$activePort"
            try {
                Remove-TaskIfExists -TaskName $activeTask
                Clear-Port -Port $activePort
            } catch {
                Write-Host ("  Warning: could not stop old active port ${activePort}: {0}" -f $_) -ForegroundColor Yellow
            }
        }

        try {
            $activeTask = "JobAI-Frontend-$activePort"
            Start-FallbackProcess -WorkingDirectory $AppDir -Port $activePort -TaskName $activeTask
            if (Wait-Health -Url "http://127.0.0.1:$activePort/api/version" -Attempts 30 -DelaySeconds 2) {
                Write-Host "  Active port $activePort updated with new build" -ForegroundColor Green
            } else {
                Write-Host "  Warning: active port $activePort did not return healthy after update; keeping standby as primary" -ForegroundColor Yellow
            }
        } catch {
            Write-Host ("  Warning: could not refresh active port ${activePort}: {0}" -f $_) -ForegroundColor Yellow
        }

        Write-Host "  Checking fallback stability (30s)..." -ForegroundColor Cyan
        Start-Sleep -Seconds 30
        if (-not (Wait-Health -Url "http://127.0.0.1:$fallbackPrimaryPort/api/version" -Attempts 5 -DelaySeconds 2)) {
            $fallbackErrLog = Join-Path $AppDir "logs\fallback-$fallbackPrimaryPort-err.log"
            if (Test-Path $fallbackErrLog) {
                Write-Host "  Last lines from fallback-$fallbackPrimaryPort-err.log:" -ForegroundColor Yellow
                Get-Content -Path $fallbackErrLog -Tail 40 | Out-Host
            }
            throw "Fallback runtime is not stable after startup"
        }
    }

    Write-Section "[6/6] Final checks"

    if ($dualMode) {
        try {
            $localVersion = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 10
            Write-Host "Local health: OK (3000)" -ForegroundColor Green
            Write-Host $localVersion.Content
        } catch {
            throw "Final local check failed on port 3000: $_"
        }
        try {
            $localVersion3001 = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/version" -UseBasicParsing -TimeoutSec 10
            Write-Host "Local health: OK (3001)" -ForegroundColor Green
            Write-Host $localVersion3001.Content
        } catch {
            throw "Final local check failed on port 3001: $_"
        }
    } elseif ($hasSingleService) {
        try {
            $localVersion = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 10
            Write-Host "Local health: OK (3000)" -ForegroundColor Green
            Write-Host $localVersion.Content
        } catch {
            throw "Final local check failed on port 3000: $_"
        }
    } else {
        $fallback3000Ok = $false
        $fallback3001Ok = $false

        try {
            $local3000 = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 10
            Write-Host "Local health: OK (3000)" -ForegroundColor Green
            Write-Host $local3000.Content
            $fallback3000Ok = $true
        } catch {
            Write-Host "Local health: FAIL (3000)" -ForegroundColor Yellow
        }

        try {
            $local3001 = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/version" -UseBasicParsing -TimeoutSec 10
            Write-Host "Local health: OK (3001)" -ForegroundColor Green
            Write-Host $local3001.Content
            $fallback3001Ok = $true
        } catch {
            Write-Host "Local health: FAIL (3001)" -ForegroundColor Yellow
        }

        if (-not $fallback3000Ok -and -not $fallback3001Ok) {
            throw "Final local check failed: both fallback ports are unhealthy"
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
