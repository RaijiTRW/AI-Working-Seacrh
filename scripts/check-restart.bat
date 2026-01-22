@echo off
set TRIGGER=C:\apps\AI-Working-Seacrh\.restart-needed

if exist "%TRIGGER%" (
    echo Restart trigger found. Restarting services...

    del "%TRIGGER%"

    net stop jobai-frontend
    net stop jobai-backend
    timeout /t 2 /nobreak >nul

    net start jobai-backend
    timeout /t 3 /nobreak >nul
    net start jobai-frontend

    echo Services restarted at %date% %time% >> C:\apps\AI-Working-Seacrh\logs\restart.log
)
