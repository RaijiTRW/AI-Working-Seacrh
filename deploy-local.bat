@echo off
REM Скрипт для локального деплоя на VDS
REM Запускать вручную на сервере

echo === AI Working Search - Local Deploy ===
echo.

cd /d C:\apps\AI-Working-Seacrh

echo === Saving current version ===
git rev-parse --short HEAD > .version-old 2>nul

echo === Pulling latest code from GitHub ===
git fetch origin main
git reset --hard origin/main

echo === Saving new version ===
git rev-parse --short HEAD > .version

echo === Installing frontend dependencies ===
call npm install

echo === Installing backend dependencies ===
cd backend
call pip install -r requirements.txt
cd ..

echo === Building Next.js ===
set NODE_ENV=production
call npm run build

echo === Reloading PM2 services (zero-downtime) ===
call pm2 reload all

echo === Checking PM2 status ===
call pm2 status

echo.
echo === Deployment completed! ===
echo Old version:
type .version-old 2>nul
echo New version:
type .version
echo.
echo Press any key to exit...
pause >nul
