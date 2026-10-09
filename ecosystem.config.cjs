/**
 * PM2 process definitions.
 *
 *   npm run build                       # required — `next start` needs a build
 *   pm2 start ecosystem.config.cjs      # starts both apps
 *   pm2 save && pm2 startup             # survive reboots
 *
 * Both apps are the same Next.js build serving different roles:
 *   NEW-CyberautoCRM-BD  :2442  → the API (/api/*)
 *   NEW-CyberautoCRM-FD  :2552  → the web UI
 *
 * Runtime secrets are read from `.env.local` by Next itself, so nothing
 * sensitive belongs in this file. Remember that NEXT_PUBLIC_* values are baked
 * in at BUILD time — change one and you must rebuild, not just restart.
 */
module.exports = {
  apps: [
    {
      name: 'NEW-CyberautoCRM-BD',
      cwd: __dirname,
      script: 'npm',
      args: 'run start:api',
      env: { NODE_ENV: 'production', PORT: '2442' },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
    },
    {
      name: 'NEW-CyberautoCRM-FD',
      cwd: __dirname,
      script: 'npm',
      args: 'run start:web',
      env: { NODE_ENV: 'production', PORT: '2552' },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
    },
  ],
};
