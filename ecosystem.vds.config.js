// PM2 ecosystem config for VDS deployment
// Zero-downtime deployment with cluster mode
module.exports = {
  apps: [{
    name: 'jobaisearch',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/jobaisearch',
    // Cluster mode with 2 instances for zero-downtime reloads
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // Graceful shutdown settings
    kill_timeout: 10000,
    wait_ready: true,
    listen_timeout: 15000,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: '/var/www/jobaisearch/logs/error.log',
    out_file: '/var/www/jobaisearch/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }],
};
