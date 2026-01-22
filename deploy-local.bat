@echo off
REM ==========================================
REM   AI Working Search - Local Deploy
REM   Run this script manually on the server
REM ==========================================

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   AI Working Search - Local Deploy
echo ==========================================
echo.

cd /d C:\apps\AI-Working-Seacrh

REM Save old version
echo [1/7] Saving current version...
git rev-parse --short HEAD > .version-old 2>nul
set /p OLD_VERSION=<.version-old
echo       Old version: %OLD_VERSION%

REM Pull latest code
echo.
echo [2/7] Pulling latest code from GitHub...
git fetch origin main
git reset --hard origin/main
git rev-parse --short HEAD > .version
set /p NEW_VERSION=<.version
echo       New version: %NEW_VERSION%

REM Install frontend dependencies
echo.
echo [3/7] Installing frontend dependencies...
call npm ci --prefer-offline --no-audit
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

REM Install backend dependencies
echo.
echo [4/7] Installing backend dependencies...
cd backend
call pip install -r requirements.txt --quiet --disable-pip-version-check
cd ..

REM Build Next.js
echo.
echo [5/7] Building Next.js...
echo       Cleaning old build...
if exist .next rmdir /s /q .next

echo       Running build...
set NODE_ENV=production
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

REM Verify build
if not exist ".next\BUILD_ID" (
    echo ERROR: Build incomplete - BUILD_ID not found!
    pause
    exit /b 1
)
set /p BUILD_ID=<.next\BUILD_ID
echo       Build complete! BUILD_ID: %BUILD_ID%

REM Reload PM2
echo.
echo [6/7] Reloading PM2 services (zero-downtime)...
pm2 list | findstr "jobai-frontend" >nul 2>&1
if %errorlevel%==0 (
    echo       Reloading existing processes...
    call pm2 reload jobai-frontend --update-env
    call pm2 reload jobai-backend --update-env
) else (
    echo       Starting PM2 for the first time...
    call pm2 start ecosystem.config.js
    call pm2 save
)

REM Health check
echo.
echo [7/7] Health check...
timeout /t 5 /nobreak >nul

curl -s -f http://127.0.0.1:3001/api/version >nul 2>&1
if %errorlevel%==0 (
    echo       Frontend: OK
) else (
    echo       Frontend: NOT RESPONDING
)

curl -s -f http://127.0.0.1:8001/health >nul 2>&1
if %errorlevel%==0 (
    echo       Backend: OK
) else (
    echo       Backend: NOT RESPONDING
)

REM Show PM2 status
echo.
echo PM2 Status:
call pm2 status

echo.
echo ==========================================
echo   DEPLOYMENT COMPLETE
echo   %OLD_VERSION% -^> %NEW_VERSION%
echo ==========================================
echo.
echo Press any key to exit...
pause >nul
