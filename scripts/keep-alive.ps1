# Keep-Alive Script for JobAI Search
# Ensures NSSM services are up without spawning ad-hoc node processes.

param(
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$FallbackAppDir = "C:\apps\AI-Working-Seacrh",
    [string]$NssmPath = "C:\nssm-2.24\win64\nssm.exe"
)

$ErrorActionPreference = "Stop"

function Resolve-AppDirectory {
    param([string]$Primary, [string]$Secondary)
    $candidates = @($Primary, $Secondary) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    foreach ($candidate in $candidates) {
        if ((Test-Path $candidate) -and (Test-Path (Join-Path $candidate "package.json"))) {
            return $candidate
        }
    }
    throw "Could not find app directory. Checked: $($candidates -join ', ')"
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
                if ((Test-Path $candidate) -and (Test-Path (Join-Path $candidate "package.json"))) {
                    return $candidate
                }
            }
        } catch {}
    }

    return $null
}

function Service-Exists {
    param([string]$Name)
    return $null -ne (Get-Service -Name $Name -ErrorAction SilentlyContinue)
}

function Stop-ServiceSafe {
    param([string]$Name)
    try { & $script:NssmPath stop $Name 2>&1 | Out-Host } catch {}
    Start-Sleep -Seconds 2
}

function Start-ServiceSafe {
    param([string]$Name)
    & $script:NssmPath start $Name 2>&1 | Out-Host
}

function Wait-Health {
    param(
        [string]$Url,
        [int]$Attempts = 20,
        [int]$DelaySeconds = 2
    )

    for ($i = 1; $i -le $Attempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                return $true
            }
        } catch {}

        Start-Sleep -Seconds $DelaySeconds
    }

    return $false
}

function Ensure-ServiceHealthy {
    param(
        [string]$ServiceName,
        [int]$Port
    )

    $healthUrl = "http://127.0.0.1:$Port/api/version"
    if (Wait-Health -Url $healthUrl -Attempts 2 -DelaySeconds 1) {
        Write-Host "  $ServiceName is healthy on port $Port" -ForegroundColor Green
        return
    }

    Write-Host "  Restarting $ServiceName (port $Port)..." -ForegroundColor Yellow
    Stop-ServiceSafe -Name $ServiceName
    Start-ServiceSafe -Name $ServiceName

    if (-not (Wait-Health -Url $healthUrl -Attempts 30 -DelaySeconds 2)) {
        throw "$ServiceName failed health check on port $Port"
    }

    Write-Host "  $ServiceName recovered on port $Port" -ForegroundColor Green
}

try {
    $script:NssmPath = $NssmPath

    $serviceAppDir = Get-ServiceAppDirectory -NssmExecutable $NssmPath -ServiceNames @(
        "jobai-frontend-1",
        "jobai-frontend-2",
        "jobai-frontend"
    )

    if ($serviceAppDir) {
        $AppDir = $serviceAppDir
    } else {
        $AppDir = Resolve-AppDirectory -Primary $AppDir -Secondary $FallbackAppDir
    }

    Set-Location $AppDir

    Write-Host "========================================"
    Write-Host "  Keep-Alive Script"
    Write-Host "========================================"
    Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "AppDir: $AppDir"
    Write-Host ""

    if (-not (Test-Path $NssmPath)) {
        throw "NSSM not found: $NssmPath"
    }

    $hasService1 = Service-Exists -Name "jobai-frontend-1"
    $hasService2 = Service-Exists -Name "jobai-frontend-2"
    $hasSingleService = Service-Exists -Name "jobai-frontend"

    if ($hasService1 -and $hasService2) {
        Write-Host "Mode: dual-service" -ForegroundColor Cyan
        Ensure-ServiceHealthy -ServiceName "jobai-frontend-1" -Port 3000
        Ensure-ServiceHealthy -ServiceName "jobai-frontend-2" -Port 3001
    } elseif ($hasSingleService) {
        Write-Host "Mode: single-service" -ForegroundColor Cyan
        Ensure-ServiceHealthy -ServiceName "jobai-frontend" -Port 3000
    } else {
        throw "No supported frontend services found (expected jobai-frontend or jobai-frontend-1/-2)"
    }

    Write-Host ""
    Write-Host "========================================"
    Write-Host "Keep-alive OK"
    Write-Host "========================================"
    exit 0
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
