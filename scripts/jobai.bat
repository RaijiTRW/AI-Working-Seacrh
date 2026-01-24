@echo off
REM ==========================================
REM   JobAI Search - CLI Management Tool
REM ==========================================

setlocal enabledelayedexpansion

set NSSM=C:\nssm-2.24\win64\nssm.exe
set APP_DIR=C:\apps\AI-Working-Seacrh
set CADDY_DIR=C:\caddy

if "%1"=="" goto :help
if "%1"=="help" goto :help
if "%1"=="status" goto :status
if "%1"=="start" goto :start
if "%1"=="stop" goto :stop
if "%1"=="restart" goto :restart
if "%1"=="logs" goto :logs
if "%1"=="deploy" goto :deploy
if "%1"=="build" goto :build
goto :help

:help
echo.
echo  JobAI Search CLI
echo  ================
echo.
echo  Commands:
echo    jobai status    - Show service status
echo    jobai start     - Start all services
echo    jobai stop      - Stop all services
echo    jobai restart   - Restart all services
echo    jobai logs      - Show recent logs
echo    jobai deploy    - Pull, build and restart
echo    jobai build     - Build frontend only
echo.
goto :eof

:status
echo.
echo  === Service Status ===
echo.
for %%s in (jobai-caddy jobai-frontend) do (
    for /f "tokens=*" %%i in ('%NSSM% status %%s 2^>nul') do (
        echo  %%s: %%i
    )
)
echo.
echo  === Port Check ===
netstat -an | findstr ":80 " | findstr LISTENING >nul && echo  Port 80:   OK || echo  Port 80:   NOT LISTENING
netstat -an | findstr ":443 " | findstr LISTENING >nul && echo  Port 443:  OK || echo  Port 443:  NOT LISTENING
netstat -an | findstr ":3000 " | findstr LISTENING >nul && echo  Port 3000: OK || echo  Port 3000: NOT LISTENING
echo.
echo  === Health Check ===
curl -s -f http://127.0.0.1:3000/api/version >nul 2>&1 && echo  Frontend:  OK || echo  Frontend:  NOT RESPONDING
echo.
goto :eof

:start
echo Starting services...
call :kill_port_3000
%NSSM% start jobai-frontend
timeout /t 3 /nobreak >nul
%NSSM% start jobai-caddy
echo Done!
goto :status

:stop
echo Stopping services...
%NSSM% stop jobai-caddy
%NSSM% stop jobai-frontend
timeout /t 1 /nobreak >nul
call :kill_port_3000
echo Done!
goto :eof

:restart
echo Restarting services...

echo Stopping frontend...
%NSSM% stop jobai-frontend 2>nul
timeout /t 2 /nobreak >nul
call :kill_port_3000
timeout /t 1 /nobreak >nul
echo Starting frontend...
%NSSM% start jobai-frontend
timeout /t 3 /nobreak >nul

%NSSM% restart jobai-caddy
echo Done!
goto :status

:kill_port_3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
goto :eof

:logs
echo.
echo === Recent Frontend Logs ===
if exist "%APP_DIR%\logs\frontend-out.log" (
    powershell -Command "Get-Content '%APP_DIR%\logs\frontend-out.log' -Tail 10"
) else (
    echo No logs found
)
echo.
goto :eof

:deploy
echo.
echo ==========================================
echo   Deploying JobAI Search
echo ==========================================
echo.

cd /d %APP_DIR%

echo [1/5] Saving current version...
git rev-parse --short HEAD > .version-old 2>nul

echo [2/5] Pulling latest code...
git fetch origin main
git reset --hard origin/main
git rev-parse --short HEAD > .version

echo [3/5] Installing dependencies...
call npm ci --prefer-offline --no-audit

echo [4/5] Building frontend...
if exist .next rmdir /s /q .next
call npm run build

echo [5/5] Restarting frontend...
%NSSM% stop jobai-frontend 2>nul
timeout /t 2 /nobreak >nul
call :kill_port_3000
timeout /t 1 /nobreak >nul
%NSSM% start jobai-frontend
timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo   Deploy complete!
echo ==========================================
for /f %%i in (.version-old) do echo   Old: %%i
for /f %%i in (.version) do echo   New: %%i
echo.
goto :status

:build
echo.
echo Building frontend...
cd /d %APP_DIR%
if exist .next rmdir /s /q .next
call npm run build
echo Done!
goto :eof
