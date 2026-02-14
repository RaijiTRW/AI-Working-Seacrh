# Setup Auto-Start Scheduled Task for JobAI Site
# Run this script as Administrator on the VDS

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Auto-Start Task" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check admin rights
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Not running as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

$AppDir = "C:\AI-Working-Seacrh"
$TaskName = "JobAI-Site-AutoStart"
$BatPath = "$AppDir\start-site.bat"

Write-Host "[1/4] Removing old task..." -ForegroundColor Cyan
try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
} catch {}

Write-Host "[2/4] Creating task..." -ForegroundColor Cyan

$Action = New-ScheduledTaskAction -Execute $BatPath -WorkingDirectory $AppDir
$Trigger = New-ScheduledTaskTrigger -AtLogon -User $env:USERNAME

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Description "Auto-start JobAI site on user login" | Out-Null

Write-Host "  Task created: $TaskName" -ForegroundColor Green

Write-Host "[3/4] Setting task to auto-run..." -ForegroundColor Cyan

# Enable auto-start
& $TaskName | Out-Null

Write-Host "  Task enabled" -ForegroundColor Green

Write-Host "[4/4] Testing task..." -ForegroundColor Cyan

Start-Sleep -Seconds 2
Start-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

Start-Sleep -Seconds 10

# Check if site is running
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/version" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $version = $response.Content | ConvertFrom-Json
        Write-Host "  Site is running! Version: $($version.version)" -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING: Site not responding" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The site will now auto-start when you login to VDS."
Write-Host ""
Write-Host "To manage:"
Write-Host "  Start manually:  & '$BatPath'"
Write-Host "  Disable task:  Unregister-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
