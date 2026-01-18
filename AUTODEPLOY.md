# Автодеплой через GitHub Actions + Zero-downtime

## Как это работает

1. **Пушишь в main** → GitHub Actions автоматически запускается
2. **Подключается к VDS** по SSH
3. **Обновляет код** из git
4. **Устанавливает зависимости** (npm, pip)
5. **Собирает Next.js** (npm run build)
6. **PM2 reload** — старая версия работает пока новая не запустится
7. **Пользователи видят уведомление** "Доступно обновление" в правом углу

**Важно:** Старый сайт продолжает работать до полного запуска нового!

---

## Настройка на VDS (один раз)

### 1. Установить PM2

```powershell
# На VDS выполнить
npm install -g pm2
npm install -g pm2-windows-service

# Установить PM2 как службу Windows
pm2-service-install
# При установке указать имя пользователя и пароль
```

### 2. Запустить приложение через PM2

```powershell
cd C:\apps\AI-Working-Seacrh

# Запустить из конфига
pm2 start ecosystem.config.js

# Сохранить для автозапуска
pm2 save

# Проверить статус
pm2 status
pm2 logs
```

**Если у тебя были NSSM службы:**
```powershell
# Остановить и удалить старые
nssm stop JobAISearch-Frontend
nssm stop JobAISearch-Backend
nssm remove JobAISearch-Frontend confirm
nssm remove JobAISearch-Backend confirm

# Теперь используй PM2 (см. выше)
```

### 3. Настроить SSH доступ

```powershell
# Установить OpenSSH Server
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# Создать SSH ключ для GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions"
# Нажать Enter 3 раза (пустой пароль)

# Добавить публичный ключ в authorized_keys
type C:\Users\Administrator\.ssh\id_rsa.pub >> C:\Users\Administrator\.ssh\authorized_keys

# ВАЖНО: Скопируй ПРИВАТНЫЙ ключ для GitHub Secrets
type C:\Users\Administrator\.ssh\id_rsa
# Скопируй весь вывод (от -----BEGIN до -----END-----)
```

### 4. Добавить GitHub Secrets

В репозитории: **Settings → Secrets and variables → Actions → New repository secret**

Добавить 4 секрета:

| Имя | Значение |
|-----|----------|
| `VDS_HOST` | IP адрес VDS (например: `195.123.45.67`) |
| `VDS_USERNAME` | `Administrator` (или другое имя пользователя) |
| `VDS_SSH_KEY` | Приватный ключ из `C:\Users\Administrator\.ssh\id_rsa` |
| `VDS_PORT` | `22` (стандартный SSH порт) |

### 5. Проверить что Git установлен на VDS

```powershell
# На VDS
git --version

# Если нет — установить Git for Windows
# https://git-scm.com/download/win
```

---

## Использование

### Автоматический деплой

Просто пушь в `main`:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

GitHub Actions автоматически:
- Обновит код на VDS
- Соберёт приложение
- Перезапустит через PM2 (без даунтайма)

### Ручной деплой (если нужно)

```powershell
# На VDS
cd C:\apps\AI-Working-Seacrh

git pull origin main
npm install
cd backend\JobAISeacrh_Backend
pip install -r requirements.txt
cd ..\..
npm run build

pm2 reload all
```

### Мониторинг

```powershell
# Статус приложений
pm2 status

# Логи (live)
pm2 logs

# Логи конкретного приложения
pm2 logs jobai-frontend
pm2 logs jobai-backend

# Перезапуск (если нужно)
pm2 reload jobai-frontend
pm2 reload jobai-backend

# Остановить
pm2 stop all

# Запустить
pm2 start all
```

---

## Уведомление пользователей

### Как работает

1. **Проверка версии каждые 30 сек** через `/api/version`
2. **При обновлении** показывается уведомление в правом верхнем углу
3. **Пользователь нажимает "Обновить сейчас"** → страница перезагружается

### Файлы

- **Компонент**: [src/components/UpdateNotification.tsx](src/components/UpdateNotification.tsx)
- **API endpoint**: [src/app/api/version/route.ts](src/app/api/version/route.ts)
- **Анимация**: [src/app/globals.css](src/app/globals.css) (`.animate-slide-in-from-right`)

---

## Структура файлов

```
.github/workflows/deploy.yml    # GitHub Actions workflow
ecosystem.config.js             # Конфигурация PM2
.version                        # Текущая версия (создаётся при деплое)
```

---

## Troubleshooting

### GitHub Actions падает с ошибкой SSH

**Проблема:** `Permission denied (publickey)`

**Решение:**
1. Проверь что SSH ключ добавлен в GitHub Secrets (VDS_SSH_KEY)
2. Проверь что публичный ключ добавлен в `authorized_keys` на VDS
3. Проверь что OpenSSH Server запущен: `Get-Service sshd`

### PM2 не перезапускается

**Проблема:** `pm2 reload` не работает

**Решение:**
```powershell
# Пересоздать конфиг
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### Сайт не работает после деплоя

**Проблема:** Сайт недоступен

**Решение:**
```powershell
# Проверить статус
pm2 status

# Если stopped — запустить
pm2 start all

# Проверить логи
pm2 logs --lines 50
```

### Уведомление не показывается

**Проблема:** Пользователи не видят уведомление об обновлении

**Решение:**
1. Проверь что файл `.version` создаётся при деплое
2. Проверь что `/api/version` отдаёт версию
3. Проверь консоль браузера на ошибки

---

## FAQ

**Q: Можно ли откатиться на старую версию?**
A: Да, просто запуши старый коммит:
```bash
git revert HEAD
git push origin main
```

**Q: Как остановить автодеплой?**
A: Удали файл `.github/workflows/deploy.yml` или отключи Actions в настройках репозитория.

**Q: Как часто можно деплоить?**
A: Без ограничений. PM2 reload занимает ~10-20 секунд.

**Q: Что если деплой упадёт?**
A: Старая версия продолжит работать. Исправь ошибку и пушь снова.

**Q: Можно ли деплоить только frontend или только backend?**
A: Да, можно модифицировать workflow для выборочного деплоя. Но сейчас деплоится всё сразу.

---

## Дополнительно

### Webhook для уведомлений (опционально)

Можно настроить уведомления в Telegram/Slack при успешном деплое:

```yaml
# В .github/workflows/deploy.yml добавить step:
- name: Notify Telegram
  if: always()
  run: |
    curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
    -d "chat_id=${{ secrets.TELEGRAM_CHAT_ID }}" \
    -d "text=Deployment ${{ job.status }}: ${{ github.sha }}"
```

### Мониторинг метрик PM2 (опционально)

```powershell
# Установить PM2 Plus для мониторинга
pm2 link <secret_key> <public_key>
# Получить ключи: https://app.pm2.io/
```
