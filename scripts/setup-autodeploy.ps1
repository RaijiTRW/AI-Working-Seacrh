# Setup script for auto-deploy (run as Administrator)
Write-Host "Setting up JobAI auto-deploy..." -ForegroundColor Green

$AppDir = "C:\apps\AI-Working-Seacrh"

# Create logs directory
New-Item -ItemType Directory -Force -Path "$AppDir\logs" | Out-Null

# Create the watchdog scheduled task
$taskName = "JobAI-Watchdog"
$scriptPath = "$AppDir\scripts\check-restart.bat"

# Remove old task if exists
schtasks /delete /tn $taskName /f 2>$null

# Create new task that runs every minute
schtasks /create /tn $taskName /tr $scriptPath /sc minute /mo 1 /ru SYSTEM /rl HIGHEST /f

if ($LASTEXITCODE -eq 0) {
    Write-Host "Scheduled task '$taskName' created successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to create scheduled task" -ForegroundColor Red
    exit 1
}

# Test it now
Write-Host "`nTesting restart mechanism..." -ForegroundColor Yellow
echo "restart" | Out-File -FilePath "$AppDir\.restart-needed" -Encoding ascii

Write-Host "Trigger file created. Waiting for watchdog (max 60 seconds)..." -ForegroundColor Yellow

for ($i = 1; $i -le 12; $i++) {
    Start-Sleep -Seconds 5
    if (-not (Test-Path "$AppDir\.restart-needed")) {
        Write-Host "Watchdog triggered successfully!" -ForegroundColor Green

        Start-Sleep -Seconds 5
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/version" -ErrorAction SilentlyContinue
        Write-Host "API Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
        exit 0
    }
    Write-Host "  Waiting... ($($i*5)s)"
}

Write-Host "Watchdog did not trigger. Check task scheduler." -ForegroundColor Red
