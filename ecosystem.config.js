const isWin = process.platform === 'win32';

module.exports = {
  apps: [
    {
      name: 'openfiend-backend',
      script: isWin ? 'cmd' : 'pnpm',
      args: isWin ? '/c pnpm dev' : 'dev',
      cwd: './packages/backend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 3737,
      },
      error_file: '../../logs/backend-error.log',
      out_file: '../../logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'openfiend-frontend',
      script: isWin ? 'cmd' : 'pnpm',
      args: isWin ? '/c pnpm dev' : 'dev',
      cwd: './packages/frontend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      error_file: '../../logs/frontend-error.log',
      out_file: '../../logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};