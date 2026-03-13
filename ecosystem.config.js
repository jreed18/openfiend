const isWin = process.platform === 'win32';

module.exports = {
  apps: [
    {
      name: 'openfiend',
      script: isWin ? 'cmd' : 'pnpm',
      args: isWin ? '/c pnpm dev' : 'dev',
      cwd: './packages/backend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 3737,
      },
      error_file: '../../logs/openfiend-error.log',
      out_file: '../../logs/openfiend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
