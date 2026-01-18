# Чеклист настройки автодеплоя

## На VDS (один раз)

- [ ] Установить PM2
  ```powershell
  npm install -g pm2 pm2-windows-service
  pm2-service-install
  ```

- [ ] Запустить приложение через PM2
  ```powershell
  cd C:\apps\AI-Working-Seacrh
  pm2 start ecosystem.config.js
  pm2 save
  ```

- [ ] Остановить старые NSSM службы (если были)
  ```powershell
  nssm stop JobAISearch-Frontend
  nssm stop JobAISearch-Backend
  nssm remove JobAISearch-Frontend confirm
  nssm remove JobAISearch-Backend confirm
  ```

- [ ] Установить OpenSSH Server
  ```powershell
  Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
  Start-Service sshd
  Set-Service -Name sshd -StartupType 'Automatic'
  ```

- [ ] Создать SSH ключ
  ```powershell
  ssh-keygen -t rsa -b 4096 -C "github-actions"
  type C:\Users\Administrator\.ssh\id_rsa.pub >> C:\Users\Administrator\.ssh\authorized_keys
  ```

- [ ] Скопировать приватный ключ для GitHub
  ```powershell
  type C:\Users\Administrator\.ssh\id_rsa
  ```

## В GitHub (один раз)

- [ ] Settings → Secrets and variables → Actions
- [ ] Добавить секреты:
  - `VDS_HOST` - IP адрес VDS
  - `VDS_USERNAME` - Administrator
  - `VDS_SSH_KEY` - приватный ключ из шага выше
  - `VDS_PORT` - 22

## Проверка

- [ ] Запушить тестовый коммит в main
  ```bash
  git commit --allow-empty -m "Test autodeploy"
  git push origin main
  ```

- [ ] Проверить Actions в GitHub (вкладка Actions)
- [ ] Проверить что деплой прошёл успешно
- [ ] Проверить что сайт работает
- [ ] Проверить уведомление об обновлении (должно появиться через 30 сек)

## Готово! 🚀

Теперь при каждом пуше в `main` будет автоматический деплой без даунтайма.
