@echo off
REM Kill any process holding port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

REM Start Next.js
cd /d "C:\apps\AI-Working-Seacrh"
"C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" start -p 3000
