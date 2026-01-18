# Настройка GitHub Secrets для автодеплоя

## Что нужно сделать

### 1. Открой настройки репозитория
https://github.com/RaijiTRW/AI-Working-Seacrh/settings/secrets/actions

### 2. Добавь 4 секрета

Нажми **"New repository secret"** для каждого секрета:

---

#### Секрет 1: VDS_HOST
- **Name:** `VDS_HOST`
- **Value:** IP адрес твоего VDS (например: `195.123.45.67`)

---

#### Секрет 2: VDS_USERNAME
- **Name:** `VDS_USERNAME`
- **Value:** `Administrator` (или другое имя пользователя Windows)

---

#### Секрет 3: VDS_PORT
- **Name:** `VDS_PORT`
- **Value:** `22` (стандартный SSH порт)

---

#### Секрет 4: VDS_SSH_KEY
- **Name:** `VDS_SSH_KEY`
- **Value:** Приватный SSH ключ (создашь на следующем шаге)

---

## Создание SSH ключа на VDS

### На сервере VDS выполни команды:

```powershell
# 1. Установить OpenSSH Server
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# 2. Создать SSH ключ
ssh-keygen -t rsa -b 4096 -C "github-actions"
# Нажми Enter 3 раза (без пароля)

# 3. Добавить публичный ключ в authorized_keys
type C:\Users\Administrator\.ssh\id_rsa.pub >> C:\Users\Administrator\.ssh\authorized_keys

# 4. ПОКАЗАТЬ ПРИВАТНЫЙ КЛЮЧ (скопируй ВЕСЬ вывод)
type C:\Users\Administrator\.ssh\id_rsa
```

### Важно!
- Скопируй **ВЕСЬ** вывод команды `type C:\Users\Administrator\.ssh\id_rsa`
- Должно начинаться с `-----BEGIN OPENSSH PRIVATE KEY-----`
- Заканчиваться на `-----END OPENSSH PRIVATE KEY-----`
- Вставь это в секрет `VDS_SSH_KEY`

---

## Проверка секретов

После добавления всех 4 секретов, должно быть так:

| Name | Value |
|------|-------|
| VDS_HOST | 195.123.45.67 (твой IP) |
| VDS_USERNAME | Administrator |
| VDS_PORT | 22 |
| VDS_SSH_KEY | -----BEGIN OPENSSH PRIVATE KEY----- ... |

---

## Тестовый деплой

После добавления секретов, сделай тестовый коммит:

```bash
git commit --allow-empty -m "Test autodeploy"
git push origin main
```

Потом проверь:
1. GitHub → Actions → должен появиться запущенный workflow
2. Если всё ОК — увидишь зелёную галочку ✓
3. Если ошибка — кликни на workflow и посмотри логи

---

## Что дальше?

После успешного теста автодеплой будет работать при каждом пуше в `main`.

Подробная документация:
- [AUTODEPLOY.md](AUTODEPLOY.md) - полное руководство
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - чеклист
- [DEPLOY.md](DEPLOY.md) - общий деплой

---

## Troubleshooting

### Ошибка: Permission denied (publickey)
- Проверь что скопировал весь приватный ключ (от BEGIN до END)
- Проверь что публичный ключ добавлен в authorized_keys
- Проверь что OpenSSH Server запущен: `Get-Service sshd`

### Ошибка: Could not resolve hostname
- Проверь что IP адрес правильный в `VDS_HOST`
- Проверь что порт 22 открыт в файрволе

### Workflow не запускается
- Проверь что файл `.github/workflows/deploy.yml` есть в репозитории
- Проверь что все 4 секрета добавлены

---

## Готово! 🎉

После настройки секретов автодеплой будет работать автоматически.
