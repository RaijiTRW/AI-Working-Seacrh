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

// VDS ecosystem config for zero-downtime deployment
module.exports.vds = {
  apps: [
    {
      name: 'jobaisearch',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/jobaisearch',
      interpreter: 'node',
      // Use cluster mode with 2 instances for zero-downtime reloads
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Graceful shutdown settings
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: '/var/www/jobaisearch/logs/error.log',
      out_file: '/var/www/jobaisearch/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
