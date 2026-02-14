@echo off
REM Start JobAI Frontend - Run this on VDS or add to Windows Scheduler
REM For autostart: Task Scheduler -> Create Task -> Action: Start a program
REM   Program: C:\Windows\System32\cmd.exe
REM   Arguments: /c "C:\AI-Working-Seacrh\start-site.bat"

cd /d C:\AI-Working-Seacrh
set NODE_ENV=production
set PORT=3000

echo Starting JobAI Search...
node "node_modules\next\dist\bin\next" start

pause
