@echo off
echo Reloading Nginx...
cd /d C:\nginx
nginx.exe -s reload
echo Done!
pause
