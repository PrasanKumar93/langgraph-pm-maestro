## Puppeteer ubuntu dependency

```sh
sudo apt update && sudo apt install -y \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpangocairo-1.0-0 \
  libpango-1.0-0 \
  libx11-xcb1 \
  libnss3 \
  libxss1 \
  libgtk-3-0 \
  libxshmfence1 \
  libxext6 \
  libxfixes3 \
  fonts-liberation \
  libappindicator3-1 \
  libasound2t64 \
  lsb-release \
  xdg-utils \
  wget \
  ca-certificates
```

```js
// code change
const pdf = await mdToPdf(
  { content: params.content },
  {
    dest: params.destination,
    css: params.css,
    launch_options: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // ubuntu server fix (EC2)
    },
  }
);
```

## SSH into EC2

```sh
ssh -i pria-agent-ec2-key-pair.pem ubuntu@XX.XX.XX.XX
```

## PM2

```js title="ecosystem.config.js"
module.exports = {
  apps: [
    {
      name: "pria-agent-app",
      cwd: "/home/ubuntu/repos/langgraph-pm-maestro",
      script: "dist/slack-bot/index.js",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env_file: "./.env",
      env: {
        NODE_ENV: "production",
      },
      out_file: "/home/ubuntu/repos/logs/pria-agent-out.log",
      error_file: "/home/ubuntu/repos/logs/pria-agent-err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

```sh
# start
pm2 start ecosystem.config.js

# stop
pm2 stop ecosystem.config.js

# delete
pm2 delete ecosystem.config.js

# check logs
pm2 logs pria-agent-app --lines 100
```

### update-app.sh

```sh
pm2 stop pria-agent-app
cd langgraph-pm-maestro
git pull
npm run build
pm2 start pria-agent-app
```
