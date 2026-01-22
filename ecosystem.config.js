module.exports = {
  apps: [
    {
      name: 'jobai-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: 'C:\\apps\\AI-Working-Seacrh',
      instances: 2, // 2 инстанса для zero-downtime reload
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Zero-downtime настройки
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      // Автоперезапуск при падении
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Логи
      error_file: 'C:\\apps\\AI-Working-Seacrh\\logs\\frontend-error.log',
      out_file: 'C:\\apps\\AI-Working-Seacrh\\logs\\frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'jobai-backend',
      script: 'uvicorn',
      args: 'main:app --host 127.0.0.1 --port 8000',
      cwd: 'C:\\apps\\AI-Working-Seacrh\\backend',
      interpreter: 'python',
      interpreter_args: '-m',
      instances: 1, // FastAPI - 1 инстанс (scheduler конфликтует)
      exec_mode: 'fork',
      env: {
        PYTHONUNBUFFERED: '1',
      },
      // Автоперезапуск
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Логи
      error_file: 'C:\\apps\\AI-Working-Seacrh\\logs\\backend-error.log',
      out_file: 'C:\\apps\\AI-Working-Seacrh\\logs\\backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
