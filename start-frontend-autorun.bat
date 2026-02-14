@echo off
setlocal EnableDelayedExpansion

cd /d C:\AI-Working-Seacrh

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
