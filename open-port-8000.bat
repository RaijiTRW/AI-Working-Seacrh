@echo off
echo Opening port 8000 for JobAI Backend...
echo.

:: Check admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Run this script as Administrator!
    echo Right-click on the file and select "Run as administrator"
    pause
    exit /b 1
)

:: Add firewall rule for incoming connections
netsh advfirewall firewall add rule name="JobAI Backend Port 8000 (TCP IN)" dir=in action=allow protocol=TCP localport=8000

:: Add firewall rule for outgoing connections (optional)
netsh advfirewall firewall add rule name="JobAI Backend Port 8000 (TCP OUT)" dir=out action=allow protocol=TCP localport=8000

echo.
echo Port 8000 opened successfully!
echo.

:: Verify
echo Verifying firewall rules:
netsh advfirewall firewall show rule name="JobAI Backend Port 8000 (TCP IN)"

pause
