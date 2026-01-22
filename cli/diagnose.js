#!/usr/bin/env node
/**
 * JobAI Server Diagnostic Tool
 * Быстрая диагностика проблем с сервером
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  ok: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
  fail: (msg) => console.log(`${c.red}✗${c.reset} ${msg}`),
  warn: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
  info: (msg) => console.log(`${c.cyan}→${c.reset} ${msg}`),
  title: (msg) => console.log(`\n${c.bright}${c.cyan}=== ${msg} ===${c.reset}\n`),
};

const projectDir = 'C:\\apps\\AI-Working-Seacrh';

// Проверка порта
function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

// HTTP запрос
function httpGet(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout' });
    });
  });
}

// Выполнение команды
function exec(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function diagnose() {
  console.log(`
${c.bright}${c.cyan}╔════════════════════════════════════════════╗
║    JobAI Server Diagnostic Tool v1.0       ║
╚════════════════════════════════════════════╝${c.reset}
`);

  // 1. Проверка файлов проекта
  log.title('1. Файлы проекта');

  const files = [
    { path: 'backend/main.py', desc: 'Backend main.py' },
    { path: 'backend/requirements.txt', desc: 'Backend requirements' },
    { path: 'ecosystem.config.js', desc: 'PM2 config' },
    { path: 'package.json', desc: 'Frontend package.json' },
    { path: '.next', desc: 'Next.js build', isDir: true },
  ];

  for (const file of files) {
    const fullPath = path.join(projectDir, file.path);
    const exists = file.isDir ? fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() : fs.existsSync(fullPath);
    if (exists) {
      log.ok(`${file.desc}: ${file.path}`);
    } else {
      log.fail(`${file.desc}: ${file.path} - НЕ НАЙДЕН`);
    }
  }

  // 2. Проверка портов
  log.title('2. Порты');

  const port3000 = await checkPort(3000);
  const port8000 = await checkPort(8000);

  if (port3000) {
    log.ok('Порт 3000 (Frontend) - занят (сервис работает)');
  } else {
    log.fail('Порт 3000 (Frontend) - свободен (сервис НЕ работает)');
  }

  if (port8000) {
    log.ok('Порт 8000 (Backend) - занят (сервис работает)');
  } else {
    log.fail('Порт 8000 (Backend) - свободен (сервис НЕ работает)');
  }

  // 3. HTTP endpoints
  log.title('3. HTTP Endpoints');

  const frontendHealth = await httpGet('http://127.0.0.1:3000/api/version');
  const backendHealth = await httpGet('http://127.0.0.1:8000/health');
  const backendRoot = await httpGet('http://127.0.0.1:8000/');

  if (frontendHealth.ok) {
    log.ok(`Frontend /api/version: OK`);
    try {
      const data = JSON.parse(frontendHealth.data);
      log.info(`  Версия: ${data.version}`);
    } catch {}
  } else {
    log.fail(`Frontend /api/version: ${frontendHealth.error || frontendHealth.status}`);
  }

  if (backendHealth.ok) {
    log.ok('Backend /health: OK');
  } else {
    log.fail(`Backend /health: ${backendHealth.error || backendHealth.status}`);
  }

  if (backendRoot.ok) {
    log.ok('Backend /: OK');
    try {
      const data = JSON.parse(backendRoot.data);
      log.info(`  ${data.name} v${data.version} - ${data.status}`);
    } catch {}
  } else {
    log.fail(`Backend /: ${backendRoot.error || backendRoot.status}`);
  }

  // 4. PM2 статус
  log.title('4. PM2 Процессы');

  const pm2List = exec('pm2 jlist');
  if (pm2List.ok) {
    try {
      const processes = JSON.parse(pm2List.output);
      if (processes.length === 0) {
        log.warn('PM2 запущен, но нет процессов');
      } else {
        processes.forEach((p) => {
          const statusColor = p.pm2_env.status === 'online' ? c.green : c.red;
          log.info(`${p.name}: ${statusColor}${p.pm2_env.status}${c.reset} (PID: ${p.pid})`);
        });
      }
    } catch {
      log.warn('PM2 запущен, но не удалось прочитать статус');
    }
  } else {
    log.fail('PM2 не установлен или не запущен');
  }

  // 5. Python
  log.title('5. Python');

  const pythonVersion = exec('python --version');
  if (pythonVersion.ok) {
    log.ok(`Python: ${pythonVersion.output}`);
  } else {
    log.fail('Python не найден');
  }

  // 6. Node.js
  log.title('6. Node.js');

  const nodeVersion = exec('node --version');
  const npmVersion = exec('npm --version');

  if (nodeVersion.ok) log.ok(`Node.js: ${nodeVersion.output}`);
  else log.fail('Node.js не найден');

  if (npmVersion.ok) log.ok(`npm: ${npmVersion.output}`);
  else log.fail('npm не найден');

  // 7. Логи (последние ошибки)
  log.title('7. Последние ошибки в логах');

  const logsDir = path.join(projectDir, 'logs');
  const frontendErrorLog = path.join(logsDir, 'frontend-error.log');
  const backendErrorLog = path.join(logsDir, 'backend-error.log');

  if (fs.existsSync(frontendErrorLog)) {
    const content = fs.readFileSync(frontendErrorLog, 'utf8');
    const lines = content.split('\n').filter(l => l.trim()).slice(-3);
    if (lines.length > 0) {
      log.warn('Frontend errors:');
      lines.forEach(l => console.log(`  ${c.red}${l}${c.reset}`));
    } else {
      log.ok('Frontend: нет ошибок');
    }
  }

  if (fs.existsSync(backendErrorLog)) {
    const content = fs.readFileSync(backendErrorLog, 'utf8');
    const lines = content.split('\n').filter(l => l.trim()).slice(-3);
    if (lines.length > 0) {
      log.warn('Backend errors:');
      lines.forEach(l => console.log(`  ${c.red}${l}${c.reset}`));
    } else {
      log.ok('Backend: нет ошибок');
    }
  }

  // Рекомендации
  log.title('Рекомендации');

  if (!port3000 || !port8000) {
    log.info('Сервисы не запущены. Запустите:');
    console.log(`  ${c.cyan}pm2 start ecosystem.config.js${c.reset}`);
    console.log(`  или`);
    console.log(`  ${c.cyan}npm run pm2:start${c.reset}`);
  }

  if (!frontendHealth.ok && port3000) {
    log.info('Frontend запущен, но не отвечает. Попробуйте пересобрать:');
    console.log(`  ${c.cyan}npm run build && pm2 reload jobai-frontend${c.reset}`);
  }

  if (!backendHealth.ok && port8000) {
    log.info('Backend запущен, но не отвечает. Проверьте логи:');
    console.log(`  ${c.cyan}pm2 logs jobai-backend --lines 50${c.reset}`);
  }

  console.log(`\n${c.bright}Для полного мониторинга запустите:${c.reset}`);
  console.log(`  ${c.cyan}npm run monitor${c.reset}`);
  console.log(`  или`);
  console.log(`  ${c.cyan}start-monitor.bat${c.reset}\n`);
}

diagnose().catch(console.error);
