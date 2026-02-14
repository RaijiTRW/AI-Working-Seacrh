@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo   Starting JobAI Frontend
echo ========================================
echo.

cd /d C:\AI-Working-Seacrh

REM Kill existing node processes
for /f "tokens=2" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo Killing process %%a on port 3000
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

REM Create logs directory
if not exist logs mkdir logs

REM Set environment
set NODE_ENV=production
set PORT=3000

echo Starting Next.js on port 3000...
start /B node node_modules\next\bin\next start > logs\service-out.log 2>&1

echo Waiting for startup...
timeout /t 15 /nobreak >nul

echo Checking health...
curl -s http://127.0.0.1:3000/api/version
echo.

echo ========================================
echo   Frontend Started
echo ========================================
echo.
