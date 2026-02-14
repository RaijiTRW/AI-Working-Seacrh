# Setup Auto-Run for JobAI Frontend
# Creates a scheduled task to run Next.js on startup

param(
    [string]$AppDir = "C:\AI-Working-Seacrh"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up Auto-Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define task name
$TaskName = "JobAI-Frontend"

# Remove existing task
Write-Host "[1/4] Removing existing task..." -ForegroundColor Cyan
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Kill any existing node processes
Write-Host "[2/4] Cleaning up..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Create startup script
Write-Host "[3/4] Creating startup script..." -ForegroundColor Cyan

$startupScript = @"
@echo off
setlocal EnableDelayedExpansion

cd /d $AppDir

REM Kill existing node processes on port 3000
for /f "tokens=2" %%a in ('netstat -ano ^| findstr ":3000"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

REM Create logs directory
if not exist logs mkdir logs

REM Set environment
set NODE_ENV=production
set PORT=3000

echo Starting Next.js on port 3000 at: %date% %time% >> logs\startup.log

REM Start Next.js
start /B node node_modules\next\bin\next start > logs\service-out.log 2>logs\service-err.log

echo Started with PID: %ERRORLEVEL% >> logs\startup.log
"@

$scriptPath = "$AppDir\start-frontend-autorun.bat"
Set-Content -Path $scriptPath -Value $startupScript -Encoding ASCII
Write-Host "  Created: $scriptPath"

# Create scheduled task
Write-Host "[4/4] Creating scheduled task..." -ForegroundColor Cyan

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$scriptPath`"" -WorkingDirectory $AppDir
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description "JobAI Search Frontend (Next.js on port 3000)"

Write-Host "  Task registered: $TaskName"

# Test run
Write-Host ""
Write-Host "Testing task..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  Next.js is running!" -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING: Could not verify" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Auto-Run Configured!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Task Name: $TaskName"
Write-Host "Startup Script: $scriptPath"
Write-Host ""
Write-Host "To manage:"
Write-Host "  Start task: Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Stop task: Stop-Process -Name node"
Write-Host "  View logs: Get-Content '$AppDir\logs\service-out.log'"
Write-Host ""
