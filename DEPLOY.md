# Деплой на VDS (Windows Server)

## Домен: jobaisearch.ru

---

## 1. Требования к VDS

- **ОС**: Windows Server 2019/2022
- **RAM**: минимум 2 GB (рекомендуется 4 GB)
- **CPU**: 2 ядра
- **Диск**: 20 GB SSD
- **Порты**: 80, 443, 3000, 8000

---

## 2. Установка необходимого ПО

### 2.1 Node.js (для Frontend)
```powershell
# Скачать и установить Node.js 20 LTS
# https://nodejs.org/en/download/

# Проверить установку
node -v
npm -v
```

### 2.2 Python 3.12 (для Backend)
```powershell
# Скачать и установить Python 3.12
# https://www.python.org/downloads/
# ВАЖНО: Поставить галочку "Add Python to PATH"

# Проверить установку
python --version
pip --version
```

### 2.3 Git
```powershell
# Скачать и установить Git
# https://git-scm.com/download/win

git --version
```

### 2.4 NSSM (Non-Sucking Service Manager)
```powershell
# Скачать NSSM
# https://nssm.cc/download

# Распаковать в C:\nssm
# Добавить C:\nssm\win64 в PATH
```

### 2.5 Nginx для Windows
```powershell
# Скачать Nginx
# https://nginx.org/en/download.html (Windows version)

# Распаковать в C:\nginx
```

---

## 3. Структура папок

```
C:\
├── apps\
│   ├── jobaisearch-frontend\    # Next.js приложение
│   └── jobaisearch-backend\     # FastAPI приложение
├── nginx\                        # Nginx
├── nssm\                         # NSSM
└── logs\
    ├── frontend\
    ├── backend\
    └── nginx\
```

Создать папки:
```powershell
mkdir C:\apps
mkdir C:\apps\jobaisearch-frontend
mkdir C:\apps\jobaisearch-backend
mkdir C:\logs
mkdir C:\logs\frontend
mkdir C:\logs\backend
mkdir C:\logs\nginx
```

---

## 4. Деплой Frontend (Next.js)

### 4.1 Клонировать репозиторий
```powershell
cd C:\apps\jobaisearch-frontend
git clone https://github.com/YOUR_USERNAME/jobaisearch.git .
```

### 4.2 Установить зависимости и собрать
```powershell
npm install
npm run build
```

### 4.3 Создать .env.local
```powershell
# C:\apps\jobaisearch-frontend\.env.local

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_API_URL=https://jobaisearch.ru/api
```

### 4.4 Создать start-frontend.bat
```batch
@echo off
cd /d C:\apps\jobaisearch-frontend
set NODE_ENV=production
npm start
```

### 4.5 Установить как службу Windows через NSSM
```powershell
# Открыть PowerShell от администратора
nssm install JobAISearch-Frontend

# В GUI указать:
# Path: C:\Program Files\nodejs\node.exe
# Startup directory: C:\apps\jobaisearch-frontend
# Arguments: node_modules\.bin\next start -p 3000

# Или через командную строку:
nssm install JobAISearch-Frontend "C:\Program Files\nodejs\node.exe" "node_modules\.bin\next start -p 3000"
nssm set JobAISearch-Frontend AppDirectory C:\apps\jobaisearch-frontend
nssm set JobAISearch-Frontend AppStdout C:\logs\frontend\stdout.log
nssm set JobAISearch-Frontend AppStderr C:\logs\frontend\stderr.log
nssm set JobAISearch-Frontend AppRotateFiles 1
nssm set JobAISearch-Frontend AppRotateBytes 10485760
nssm set JobAISearch-Frontend AppEnvironmentExtra NODE_ENV=production

# Настройка автоперезапуска при падении
nssm set JobAISearch-Frontend AppExit Default Restart
nssm set JobAISearch-Frontend AppRestartDelay 5000

# Запустить службу
nssm start JobAISearch-Frontend
```

---

## 5. Деплой Backend (FastAPI)

### 5.1 Клонировать репозиторий
```powershell
cd C:\apps\jobaisearch-backend
git clone https://github.com/YOUR_USERNAME/jobaisearch-backend.git .
```

### 5.2 Создать виртуальное окружение
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 5.3 Создать .env
```powershell
# C:\apps\jobaisearch-backend\.env

OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
MODEL_NAME=anthropic/claude-sonnet-4-5-20250514

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=service_role_key_here

# YooKassa
YOOKASSA_SHOP_ID=xxx
YOOKASSA_SECRET_KEY=xxx
YOOKASSA_RETURN_URL=https://jobaisearch.ru/subscription/success

DEBUG=false
CORS_ORIGINS=["https://jobaisearch.ru"]
```

### 5.4 Установить как службу Windows через NSSM
```powershell
nssm install JobAISearch-Backend "C:\apps\jobaisearch-backend\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 127.0.0.1 --port 8000"
nssm set JobAISearch-Backend AppDirectory C:\apps\jobaisearch-backend
nssm set JobAISearch-Backend AppStdout C:\logs\backend\stdout.log
nssm set JobAISearch-Backend AppStderr C:\logs\backend\stderr.log
nssm set JobAISearch-Backend AppRotateFiles 1
nssm set JobAISearch-Backend AppRotateBytes 10485760

# Настройка автоперезапуска при падении
nssm set JobAISearch-Backend AppExit Default Restart
nssm set JobAISearch-Backend AppRestartDelay 5000

# Запустить службу
nssm start JobAISearch-Backend
```

---

## 6. Настройка Nginx

### 6.1 Конфигурация nginx.conf
```nginx
# C:\nginx\conf\nginx.conf

worker_processes  auto;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    client_max_body_size 10M;

    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Логи
    access_log  C:/logs/nginx/access.log;
    error_log   C:/logs/nginx/error.log;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Upstream серверы
    upstream frontend {
        server 127.0.0.1:3000;
    }

    upstream backend {
        server 127.0.0.1:8000;
    }

    # HTTP -> HTTPS редирект
    server {
        listen 80;
        server_name jobaisearch.ru www.jobaisearch.ru;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS сервер
    server {
        listen 443 ssl http2;
        server_name jobaisearch.ru www.jobaisearch.ru;

        # SSL сертификаты (после получения от Let's Encrypt)
        ssl_certificate      C:/nginx/ssl/fullchain.pem;
        ssl_certificate_key  C:/nginx/ssl/privkey.pem;

        # SSL настройки
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API запросы -> Backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Для SSE (стриминг)
            proxy_set_header Connection '';
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 300s;
        }

        # YooKassa webhook
        location /api/subscription/webhook {
            proxy_pass http://backend/api/subscription/webhook;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Все остальное -> Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Статика Next.js
        location /_next/static/ {
            proxy_pass http://frontend;
            proxy_cache_valid 200 60m;
            add_header Cache-Control "public, immutable, max-age=31536000";
        }
    }
}
```

### 6.2 Установить Nginx как службу
```powershell
nssm install Nginx "C:\nginx\nginx.exe"
nssm set Nginx AppDirectory C:\nginx
nssm set Nginx AppExit Default Restart
nssm set Nginx AppRestartDelay 5000

nssm start Nginx
```

---

## 7. SSL сертификат (Let's Encrypt)

### 7.1 Установить win-acme
```powershell
# Скачать win-acme
# https://www.win-acme.com/

# Распаковать в C:\win-acme
```

### 7.2 Получить сертификат
```powershell
cd C:\win-acme
wacs.exe

# Выбрать:
# M: Create certificate (full options)
# 1: Manual input
# Ввести: jobaisearch.ru,www.jobaisearch.ru
# 4: [http] Save verification files on (network) path
# Указать: C:\nginx\html
# 2: PEM encoded files (nginx, etc.)
# Указать: C:\nginx\ssl

# Сертификаты будут в C:\nginx\ssl
```

### 7.3 Временный Nginx для получения сертификата
```nginx
# Временный конфиг для верификации
server {
    listen 80;
    server_name jobaisearch.ru www.jobaisearch.ru;

    location /.well-known/acme-challenge/ {
        root C:/nginx/html;
    }
}
```

---

## 8. DNS настройки

В панели управления доменом (reg.ru, nic.ru и т.д.):

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| A | @ | IP_ВАШЕГО_VDS | 3600 |
| A | www | IP_ВАШЕГО_VDS | 3600 |

---

## 9. Файрвол Windows

```powershell
# Открыть PowerShell от администратора

# Открыть порт 80 (HTTP)
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Открыть порт 443 (HTTPS)
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

---

## 10. Управление службами

### Команды NSSM
```powershell
# Проверить статус
nssm status JobAISearch-Frontend
nssm status JobAISearch-Backend
nssm status Nginx

# Остановить
nssm stop JobAISearch-Frontend
nssm stop JobAISearch-Backend
nssm stop Nginx

# Запустить
nssm start JobAISearch-Frontend
nssm start JobAISearch-Backend
nssm start Nginx

# Перезапустить
nssm restart JobAISearch-Frontend
nssm restart JobAISearch-Backend
nssm restart Nginx

# Удалить службу
nssm remove JobAISearch-Frontend confirm
```

### Логи
```powershell
# Просмотр логов
Get-Content C:\logs\frontend\stdout.log -Tail 50
Get-Content C:\logs\backend\stdout.log -Tail 50
Get-Content C:\logs\nginx\error.log -Tail 50
```

---

## 11. Обновление приложения

### 11.1 Скрипт обновления Frontend
```batch
@echo off
REM C:\apps\update-frontend.bat

echo Stopping frontend service...
nssm stop JobAISearch-Frontend

cd /d C:\apps\jobaisearch-frontend

echo Pulling latest changes...
git pull origin main

echo Installing dependencies...
call npm install

echo Building...
call npm run build

echo Starting frontend service...
nssm start JobAISearch-Frontend

echo Frontend updated successfully!
pause
```

### 11.2 Скрипт обновления Backend
```batch
@echo off
REM C:\apps\update-backend.bat

echo Stopping backend service...
nssm stop JobAISearch-Backend

cd /d C:\apps\jobaisearch-backend

echo Pulling latest changes...
git pull origin main

echo Activating venv...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Starting backend service...
nssm start JobAISearch-Backend

echo Backend updated successfully!
pause
```

---

## 12. Мониторинг и автовосстановление

NSSM автоматически перезапускает службы при падении (настроено выше).

### Дополнительный скрипт проверки (опционально)
```powershell
# C:\apps\health-check.ps1
# Запускать через Task Scheduler каждые 5 минут

$services = @("JobAISearch-Frontend", "JobAISearch-Backend", "Nginx")

foreach ($service in $services) {
    $status = nssm status $service
    if ($status -ne "SERVICE_RUNNING") {
        Write-Host "$service is not running. Restarting..."
        nssm restart $service

        # Отправить уведомление (опционально)
        # Send-MailMessage ...
    }
}
```

---

## 13. YooKassa Webhook

После деплоя настроить webhook в личном кабинете YooKassa:

1. Войти в https://yookassa.ru/
2. Настройки → HTTP-уведомления
3. URL: `https://jobaisearch.ru/api/subscription/webhook`
4. События: `payment.succeeded`, `payment.canceled`

---

## 14. Supabase миграция

Перед запуском применить миграцию подписок:

```sql
-- Выполнить в Supabase SQL Editor
-- Содержимое файла: supabase/migrations/012_subscriptions.sql
```

---

## 15. Чек-лист перед запуском

- [ ] DNS записи настроены (A записи для jobaisearch.ru и www)
- [ ] Файрвол открыт (порты 80, 443)
- [ ] SSL сертификат получен
- [ ] .env файлы созданы (frontend и backend)
- [ ] Supabase миграция применена
- [ ] YooKassa webhook настроен
- [ ] Все 3 службы запущены (Frontend, Backend, Nginx)
- [ ] Сайт открывается по https://jobaisearch.ru

---

## Быстрый старт (после первичной настройки)

```powershell
# Запустить все службы
nssm start Nginx
nssm start JobAISearch-Backend
nssm start JobAISearch-Frontend

# Проверить статус
nssm status Nginx
nssm status JobAISearch-Backend
nssm status JobAISearch-Frontend
```
