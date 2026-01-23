@echo off
REM ==========================================
REM   Setup Windows Services via NSSM
REM   Run as Administrator!
REM ==========================================

echo.
echo ==========================================
echo   JobAI Search - Service Setup
echo   Requires Administrator privileges!
echo ==========================================
echo.

REM Check admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run as Administrator!
    pause
    exit /b 1
)

set NSSM=C:\nssm-2.24\win64\nssm.exe
set APP_DIR=C:\apps\AI-Working-Seacrh
set CADDY_DIR=C:\caddy

echo [1/5] Stopping old services...
%NSSM% stop jobai-caddy 2>nul
%NSSM% stop jobai-frontend 2>nul
net stop nginx 2>nul
taskkill /F /IM nginx.exe 2>nul
taskkill /F /IM caddy.exe 2>nul

echo [2/5] Removing old services...
%NSSM% remove jobai-caddy confirm 2>nul
%NSSM% remove jobai-frontend confirm 2>nul
sc delete nginx 2>nul

echo [3/5] Installing Caddy service...
%NSSM% install jobai-caddy "%CADDY_DIR%\caddy.exe"
%NSSM% set jobai-caddy AppParameters "run --config %CADDY_DIR%\Caddyfile"
%NSSM% set jobai-caddy AppDirectory "%CADDY_DIR%"
%NSSM% set jobai-caddy DisplayName "JobAI Caddy (Reverse Proxy)"
%NSSM% set jobai-caddy Description "Caddy reverse proxy with auto SSL for JobAI Search"
%NSSM% set jobai-caddy Start SERVICE_AUTO_START
%NSSM% set jobai-caddy AppStdout "%APP_DIR%\logs\caddy-out.log"
%NSSM% set jobai-caddy AppStderr "%APP_DIR%\logs\caddy-error.log"

echo [4/5] Installing Frontend service...
%NSSM% install jobai-frontend "C:\Program Files\nodejs\node.exe"
%NSSM% set jobai-frontend AppParameters "%APP_DIR%\node_modules\next\dist\bin\next" start -p 3000
%NSSM% set jobai-frontend AppDirectory "%APP_DIR%"
%NSSM% set jobai-frontend DisplayName "JobAI Frontend (Next.js)"
%NSSM% set jobai-frontend Description "Next.js frontend for JobAI Search"
%NSSM% set jobai-frontend Start SERVICE_AUTO_START
%NSSM% set jobai-frontend AppEnvironmentExtra NODE_ENV=production
%NSSM% set jobai-frontend AppStdout "%APP_DIR%\logs\frontend-out.log"
%NSSM% set jobai-frontend AppStderr "%APP_DIR%\logs\frontend-error.log"

echo [5/5] Starting services...
%NSSM% start jobai-frontend
timeout /t 5 /nobreak >nul
%NSSM% start jobai-caddy

echo.
echo ==========================================
echo   Services installed and started!
echo ==========================================
echo.
echo Use 'jobai status' to check services
echo Use 'jobai restart' to restart all
echo.
pause
