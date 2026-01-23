@echo off
echo Restarting services...

net stop jobai-frontend
timeout /t 2 /nobreak

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak

net start jobai-frontend

echo Services restarted.
