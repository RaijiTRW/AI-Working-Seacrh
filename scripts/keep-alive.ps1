# Keep-Alive Script for JobAI Search
# Checks if Node.js is running, starts if not
# No admin rights required, no services, no scheduled tasks

param(
    [string]$AppDir = "C:\AI-Working-Seacrh",
    [string]$Port = "3000"
)

$ErrorActionPreference = "Stop"

Set-Location $AppDir

Write-Host "========================================"
Write-Host "  Keep-Alive Script"
Write-Host "========================================"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Function to start Node.js
function Start-NodeJs {
    $nodeExe = "C:\Program Files\nodejs\node.exe"
    $nextBin = "$AppDir\node_modules\next\dist\bin\next"
    $nextStart = "$nextBin start"

    $env:NODE_ENV = "production"
    $env:PORT = $Port

    # Start process
    $process = Start-Process -FilePath $nodeExe -ArgumentList $nextStart -WorkingDirectory $AppDir -WindowStyle Hidden -PassThru
    $process.Id | Out-File -FilePath "$AppDir\node.pid" -Encoding UTF8

    Write-Host "  Started Node.js with PID: $($process.Id)" -ForegroundColor Green
    return $process
}

# Function to check if Node.js is running
function Test-NodeJs {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/version" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $version = $response.Content | ConvertFrom-Json
            Write-Host "  Node.js is running! Version: $($version.version)" -ForegroundColor Green
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

Write-Host "[1/4] Checking if Node.js is running..." -ForegroundColor Cyan

$isRunning = Test-NodeJs

if (-not $isRunning) {
    Write-Host ""
    Write-Host "[2/4] Node.js is NOT running. Starting..." -ForegroundColor Yellow
    Write-Host ""

    $process = Start-NodeJs

    Write-Host ""
    Write-Host "[3/4] Waiting for startup (20s)..." -ForegroundColor Cyan

    # Wait for startup
    $ready = $false
    for ($i = 1; $i -le 20; $i++) {
        if (Test-NodeJs) {
            $ready = $true
            break
        }
        Start-Sleep -Seconds 1
    }

    if (-not $ready) {
        Write-Host ""
        Write-Host "ERROR: Node.js failed to start!" -ForegroundColor Red
        Write-Host "Check logs: $AppDir\logs\service-err.log" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "  Node.js is running!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/4] Node.js is already running. Exiting." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================"
Write-Host "Done!"
Write-Host "========================================"
Write-Host ""
Write-Host "To stop Node.js:"
Write-Host "  Stop-Process -Name node"
Write-Host ""
Write-Host "To restart:"
Write-Host "  & '$AppDir\scripts\keep-alive.ps1'"
Write-Host ""
