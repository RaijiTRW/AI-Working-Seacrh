@echo off
echo Restarting services...

net stop jobai-frontend
net stop jobai-backend
timeout /t 2 /nobreak

net start jobai-backend
timeout /t 3 /nobreak
net start jobai-frontend

echo Services restarted.
