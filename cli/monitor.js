#!/usr/bin/env node
/**
 * JobAI Server Monitor CLI
 * Мониторинг, управление и автообновление сервера
 */

const http = require('http');
const https = require('https');
const { spawn, execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Конфигурация
const CONFIG = {
  projectDir: 'C:\\apps\\AI-Working-Seacrh',
  frontend: {
    name: 'Frontend (Next.js)',
    url: 'http://127.0.0.1:3000/api/version',
    port: 3000,
    pm2Name: 'jobai-frontend',
    nssmName: 'JobAISearch-Frontend',
  },
  backend: {
    name: 'Backend (FastAPI)',
    url: 'http://127.0.0.1:8000/health',
    port: 8000,
    pm2Name: 'jobai-backend',
    nssmName: 'JobAISearch-Backend',
  },
  checkInterval: 5000, // 5 секунд
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
  },
};

// Состояние
let state = {
  frontend: { status: 'unknown', lastCheck: null, version: null, responseTime: null },
  backend: { status: 'unknown', lastCheck: null, responseTime: null },
  lastGitPull: null,
  autoRefresh: true,
  monitoring: false,
};

// Утилиты для цветного вывода
const c = CONFIG.colors;
const log = {
  info: (msg) => console.log(`${c.cyan}ℹ${c.reset} ${msg}`),
  success: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
  error: (msg) => console.log(`${c.red}✗${c.reset} ${msg}`),
  warn: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
  title: (msg) => console.log(`\n${c.bright}${c.blue}═══ ${msg} ═══${c.reset}\n`),
};

// Очистка консоли
function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

// Проверка health endpoint
function checkHealth(url, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          resolve({ ok: true, status: res.statusCode, data: json, responseTime });
        } catch {
          resolve({ ok: res.statusCode === 200, status: res.statusCode, data, responseTime });
        }
      });
    });

    req.on('error', () => resolve({ ok: false, error: 'Connection failed' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout' });
    });
  });
}

// Проверка порта (альтернативный метод)
function checkPort(port, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = require('net').createConnection({ port, host: '127.0.0.1' });
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Обновление статуса сервисов
async function updateStatus() {
  // Frontend
  const frontendResult = await checkHealth(CONFIG.frontend.url);
  state.frontend = {
    status: frontendResult.ok ? 'online' : 'offline',
    lastCheck: new Date(),
    version: frontendResult.data?.version || null,
    responseTime: frontendResult.responseTime || null,
    error: frontendResult.error || null,
  };

  // Backend
  const backendResult = await checkHealth(CONFIG.backend.url);
  state.backend = {
    status: backendResult.ok ? 'online' : 'offline',
    lastCheck: new Date(),
    responseTime: backendResult.responseTime || null,
    error: backendResult.error || null,
  };

  return { frontend: state.frontend, backend: state.backend };
}

// Получение статуса PM2
function getPM2Status() {
  try {
    const output = execSync('pm2 jlist', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const processes = JSON.parse(output);
    return processes.map((p) => ({
      name: p.name,
      status: p.pm2_env.status,
      pid: p.pid,
      memory: Math.round(p.monit.memory / 1024 / 1024),
      cpu: p.monit.cpu,
      uptime: p.pm2_env.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : 0,
      restarts: p.pm2_env.restart_time,
    }));
  } catch {
    return null;
  }
}

// Получение статуса NSSM
function getNSSMStatus(serviceName) {
  try {
    const output = execSync(`nssm status ${serviceName}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return output.trim();
  } catch {
    return 'NOT_FOUND';
  }
}

// Форматирование uptime
function formatUptime(ms) {
  if (!ms || ms < 0) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}д ${hours % 24}ч`;
  if (hours > 0) return `${hours}ч ${minutes % 60}м`;
  if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
  return `${seconds}с`;
}

// Отрисовка статусной панели
function renderStatus() {
  clearScreen();

  console.log(`${c.bright}${c.magenta}`);
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           🖥️  JobAI Server Monitor CLI v1.0                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(c.reset);

  const now = new Date().toLocaleString('ru-RU');
  console.log(`${c.dim}Время: ${now}${c.reset}\n`);

  // Статус сервисов
  console.log(`${c.bright}┌─ Статус сервисов ────────────────────────────────────────────┐${c.reset}`);

  // Frontend
  const feStatus = state.frontend.status === 'online'
    ? `${c.bgGreen}${c.white} ONLINE ${c.reset}`
    : `${c.bgRed}${c.white} OFFLINE ${c.reset}`;
  const feVersion = state.frontend.version ? `v${state.frontend.version}` : '-';
  const feTime = state.frontend.responseTime ? `${state.frontend.responseTime}ms` : '-';
  console.log(`│ ${c.cyan}Frontend${c.reset}  ${feStatus}  Версия: ${feVersion}  Время: ${feTime}`);

  // Backend
  const beStatus = state.backend.status === 'online'
    ? `${c.bgGreen}${c.white} ONLINE ${c.reset}`
    : `${c.bgRed}${c.white} OFFLINE ${c.reset}`;
  const beTime = state.backend.responseTime ? `${state.backend.responseTime}ms` : '-';
  console.log(`│ ${c.cyan}Backend${c.reset}   ${beStatus}  Порт: 8000       Время: ${beTime}`);

  console.log(`${c.bright}└──────────────────────────────────────────────────────────────┘${c.reset}`);

  // Процессы (проверяем порты)
  console.log(`\n${c.bright}┌─ Процессы ───────────────────────────────────────────────────┐${c.reset}`);
  console.log(`│ ${c.yellow}Frontend (3000)${c.reset}  ${state.frontend.status === 'online' ? c.green + 'running' : c.red + 'stopped'}${c.reset}`);
  console.log(`│ ${c.yellow}Backend (8000)${c.reset}   ${state.backend.status === 'online' ? c.green + 'running' : c.red + 'stopped'}${c.reset}`);
  console.log(`${c.bright}└──────────────────────────────────────────────────────────────┘${c.reset}`);

  // Git статус
  try {
    const branch = execSync('git branch --show-current', { cwd: CONFIG.projectDir, encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { cwd: CONFIG.projectDir, encoding: 'utf8' }).trim();
    console.log(`\n${c.bright}┌─ Git ────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`│ Ветка: ${c.green}${branch}${c.reset}  Коммит: ${c.yellow}${commit}${c.reset}`);
    console.log(`${c.bright}└──────────────────────────────────────────────────────────────┘${c.reset}`);
  } catch {}

  // Команды
  console.log(`
${c.bright}Команды:${c.reset}
  ${c.cyan}[1]${c.reset} Перезапустить Frontend    ${c.cyan}[4]${c.reset} Git pull + Rebuild
  ${c.cyan}[2]${c.reset} Перезапустить Backend     ${c.cyan}[5]${c.reset} Показать логи Frontend
  ${c.cyan}[3]${c.reset} Перезапустить всё         ${c.cyan}[6]${c.reset} Показать логи Backend
  ${c.cyan}[R]${c.reset} Обновить статус           ${c.cyan}[Q]${c.reset} Выход
  ${c.cyan}[S]${c.reset} Остановить всё            ${c.cyan}[H]${c.reset} Помощь
`);

  if (state.monitoring) {
    console.log(`${c.dim}Автообновление каждые ${CONFIG.checkInterval / 1000} сек...${c.reset}`);
  }
}

// Команды управления
const commands = {
  async restartFrontend() {
    log.info('Перезапуск Frontend...');
    try {
      // Останавливаем старый процесс
      try {
        execSync('taskkill /F /FI "WINDOWTITLE eq npm*" 2>nul', { stdio: 'pipe' });
      } catch {}

      // Запускаем новый
      const logOut = path.join(CONFIG.projectDir, 'logs', 'frontend-out.log');
      const logErr = path.join(CONFIG.projectDir, 'logs', 'frontend-error.log');
      const child = spawn('cmd', ['/c', 'npm', 'run', 'start'], {
        cwd: CONFIG.projectDir,
        detached: true,
        stdio: ['ignore', fs.openSync(logOut, 'a'), fs.openSync(logErr, 'a')],
      });
      child.unref();
      log.success('Frontend перезапущен');
    } catch (e) {
      log.error(`Ошибка: ${e.message}`);
    }
  },

  async restartBackend() {
    log.info('Перезапуск Backend...');
    try {
      // Останавливаем старый процесс на порту 8000
      try {
        execSync('taskkill /F /FI "IMAGENAME eq python*" 2>nul', { stdio: 'pipe' });
      } catch {}

      await new Promise(r => setTimeout(r, 1000));

      // Запускаем новый
      const logOut = path.join(CONFIG.projectDir, 'logs', 'backend-out.log');
      const logErr = path.join(CONFIG.projectDir, 'logs', 'backend-error.log');
      const child = spawn('python', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'], {
        cwd: path.join(CONFIG.projectDir, 'backend'),
        detached: true,
        stdio: ['ignore', fs.openSync(logOut, 'a'), fs.openSync(logErr, 'a')],
      });
      child.unref();
      log.success('Backend перезапущен');
    } catch (e) {
      log.error(`Ошибка: ${e.message}`);
    }
  },

  async restartAll() {
    log.info('Перезапуск всех сервисов...');
    await this.restartBackend();
    await new Promise(r => setTimeout(r, 2000));
    await this.restartFrontend();
    log.success('Все сервисы перезапущены');
  },

  async stopAll() {
    log.warn('Остановка всех сервисов...');
    try {
      execSync('taskkill /F /IM node.exe 2>nul', { stdio: 'pipe' });
      execSync('taskkill /F /IM python.exe 2>nul', { stdio: 'pipe' });
      log.success('Все сервисы остановлены');
    } catch (e) {
      log.warn('Некоторые процессы уже остановлены');
    }
  },

  async gitPullAndRebuild() {
    log.title('Git Pull + Rebuild');

    try {
      log.info('Остановка сервисов...');
      await this.stopAll();
      await new Promise(r => setTimeout(r, 2000));

      log.info('Git pull...');
      execSync('git fetch origin main && git reset --hard origin/main', { stdio: 'inherit', cwd: CONFIG.projectDir });

      log.info('Очистка кэша...');
      execSync('rm -rf .next node_modules/.cache', { stdio: 'inherit', cwd: CONFIG.projectDir });

      log.info('Установка зависимостей...');
      execSync('npm ci', { stdio: 'inherit', cwd: CONFIG.projectDir });

      log.info('Сборка Next.js...');
      execSync('npm run build', { stdio: 'inherit', cwd: CONFIG.projectDir });

      log.info('Запуск сервисов...');
      await this.restartAll();

      state.lastGitPull = new Date();
      log.success('Обновление завершено!');
    } catch (e) {
      log.error(`Ошибка обновления: ${e.message}`);
    }
  },

  showLogsFrontend() {
    log.title('Логи Frontend (последние 50 строк)');
    try {
      const logsPath = path.join(CONFIG.projectDir, 'logs', 'frontend-out.log');
      if (fs.existsSync(logsPath)) {
        const content = fs.readFileSync(logsPath, 'utf8');
        const lines = content.split('\n').slice(-50);
        console.log(lines.join('\n'));
      } else {
        execSync('pm2 logs jobai-frontend --lines 50 --nostream', { stdio: 'inherit' });
      }
    } catch (e) {
      log.error(`Не удалось показать логи: ${e.message}`);
    }
  },

  showLogsBackend() {
    log.title('Логи Backend (последние 50 строк)');
    try {
      const logsPath = path.join(CONFIG.projectDir, 'logs', 'backend-out.log');
      if (fs.existsSync(logsPath)) {
        const content = fs.readFileSync(logsPath, 'utf8');
        const lines = content.split('\n').slice(-50);
        console.log(lines.join('\n'));
      } else {
        execSync('pm2 logs jobai-backend --lines 50 --nostream', { stdio: 'inherit' });
      }
    } catch (e) {
      log.error(`Не удалось показать логи: ${e.message}`);
    }
  },

  showHelp() {
    clearScreen();
    console.log(`
${c.bright}${c.magenta}JobAI Server Monitor - Справка${c.reset}

${c.bright}Описание:${c.reset}
  CLI инструмент для мониторинга и управления сервером JobAI.
  Отслеживает статус Frontend (Next.js) и Backend (FastAPI).

${c.bright}Команды клавиатуры:${c.reset}
  1  - Перезапустить Frontend (PM2 reload)
  2  - Перезапустить Backend (PM2 reload)
  3  - Перезапустить все сервисы
  4  - Git pull + npm install + build + restart
  5  - Показать логи Frontend
  6  - Показать логи Backend
  R  - Обновить статус вручную
  S  - Остановить все сервисы
  Q  - Выход из программы
  H  - Показать эту справку

${c.bright}Health Endpoints:${c.reset}
  Frontend: http://127.0.0.1:3000/api/version
  Backend:  http://127.0.0.1:8000/health

${c.bright}Логи:${c.reset}
  ${CONFIG.projectDir}\\logs\\frontend-*.log
  ${CONFIG.projectDir}\\logs\\backend-*.log

${c.bright}Использование с GitHub Actions:${c.reset}
  При пуше в main ветку автоматически происходит деплой.
  CLI покажет новую версию после обновления.

${c.dim}Нажмите любую клавишу для возврата...${c.reset}
`);
  },
};

// Основной цикл мониторинга
async function startMonitoring() {
  state.monitoring = true;

  // Начальная проверка
  await updateStatus();
  renderStatus();

  // Автообновление
  const interval = setInterval(async () => {
    if (state.monitoring) {
      await updateStatus();
      renderStatus();
    }
  }, CONFIG.checkInterval);

  // Обработка клавиш
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', async (str, key) => {
    if (key.ctrl && key.name === 'c') {
      console.log('\n\nВыход...');
      process.exit(0);
    }

    const cmd = str?.toLowerCase();

    switch (cmd) {
      case '1':
        state.monitoring = false;
        clearInterval(interval);
        await commands.restartFrontend();
        await new Promise((r) => setTimeout(r, 2000));
        await updateStatus();
        state.monitoring = true;
        startMonitoring();
        break;

      case '2':
        state.monitoring = false;
        clearInterval(interval);
        await commands.restartBackend();
        await new Promise((r) => setTimeout(r, 2000));
        await updateStatus();
        state.monitoring = true;
        startMonitoring();
        break;

      case '3':
        state.monitoring = false;
        clearInterval(interval);
        await commands.restartAll();
        await new Promise((r) => setTimeout(r, 3000));
        await updateStatus();
        state.monitoring = true;
        startMonitoring();
        break;

      case '4':
        state.monitoring = false;
        clearInterval(interval);
        await commands.gitPullAndRebuild();
        console.log(`\n${c.dim}Нажмите любую клавишу для продолжения...${c.reset}`);
        break;

      case '5':
        state.monitoring = false;
        clearInterval(interval);
        commands.showLogsFrontend();
        console.log(`\n${c.dim}Нажмите любую клавишу для продолжения...${c.reset}`);
        break;

      case '6':
        state.monitoring = false;
        clearInterval(interval);
        commands.showLogsBackend();
        console.log(`\n${c.dim}Нажмите любую клавишу для продолжения...${c.reset}`);
        break;

      case 'r':
        await updateStatus();
        renderStatus();
        break;

      case 's':
        state.monitoring = false;
        clearInterval(interval);
        await commands.stopAll();
        console.log(`\n${c.dim}Нажмите любую клавишу для продолжения...${c.reset}`);
        break;

      case 'q':
        console.log('\n\nВыход...');
        process.exit(0);
        break;

      case 'h':
        state.monitoring = false;
        clearInterval(interval);
        commands.showHelp();
        break;

      default:
        // После показа логов/справки - возврат к мониторингу
        if (!state.monitoring) {
          state.monitoring = true;
          startMonitoring();
        }
        break;
    }
  });
}

// Запуск
console.log(`${c.cyan}Запуск JobAI Server Monitor...${c.reset}`);
startMonitoring().catch(console.error);
