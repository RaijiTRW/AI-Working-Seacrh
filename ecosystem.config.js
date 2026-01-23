module.exports = {
  apps: [
    {
      name: 'jobai-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: 'C:\\apps\\AI-Working-Seacrh',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: 'C:\\apps\\AI-Working-Seacrh\\logs\\frontend-error.log',
      out_file: 'C:\\apps\\AI-Working-Seacrh\\logs\\frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
