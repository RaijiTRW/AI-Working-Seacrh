@echo off
setlocal EnableDelayedExpansion

set GH_DEPLOY_TOKEN=ghs_test
cd /d C:\AI-Working-Seacrh
powershell -ExecutionPolicy Bypass -File "scripts\deploy.ps1"
