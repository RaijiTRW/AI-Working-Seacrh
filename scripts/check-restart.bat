@echo off
set TRIGGER=C:\apps\AI-Working-Seacrh\.restart-needed

if exist "%TRIGGER%" (
    echo Restart trigger found. Restarting services...
    del "%TRIGGER%"

    echo Killing processes by port...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        echo Killing frontend PID %%a
        taskkill /F /PID %%a 2>nul
    )

    timeout /t 5 /nobreak >nul

    echo Starting services...
    net start jobai-frontend 2>nul

    echo Services restarted at %date% %time% >> C:\apps\AI-Working-Seacrh\logs\restart.log
)
