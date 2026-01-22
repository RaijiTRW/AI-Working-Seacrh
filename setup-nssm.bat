@echo off
echo === Configuring NSSM services ===

echo.
echo Stopping services...
nssm stop JobAISearch-Frontend
nssm stop JobAISearch-Backend

echo.
echo Setting Frontend path...
nssm set JobAISearch-Frontend AppDirectory "C:\apps\AI-Working-Seacrh"

echo.
echo Setting Backend path...
nssm set JobAISearch-Backend AppDirectory "C:\apps\AI-Working-Seacrh\backend"

echo.
echo Adding PYTHONIOENCODING for Backend...
nssm set JobAISearch-Backend AppEnvironmentExtra PYTHONIOENCODING=utf-8

echo.
echo Starting services...
nssm start JobAISearch-Frontend
nssm start JobAISearch-Backend

echo.
echo Checking status...
nssm status JobAISearch-Frontend
nssm status JobAISearch-Backend

echo.
echo === Done! ===
pause
