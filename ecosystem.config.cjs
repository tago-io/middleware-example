// pm2 process configuration. Run with: pm2 start ecosystem.config.cjs
// Build first (pnpm build) so dist/main.js exists. The app loads its
// environment from the .env file itself (via dotenv), so pm2 only needs to
// start it from the project directory.
module.exports = {
  apps: [
    {
      name: "middleware-example",
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",

      // Restart on crash, with backoff so a persistent failure does not loop hard.
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      exp_backoff_restart_delay: 200,

      // Log handling: timestamped, combined, written under ./logs.
      time: true,
      merge_logs: true,
      out_file: "logs/out.log",
      error_file: "logs/error.log",
    },
  ],
};
