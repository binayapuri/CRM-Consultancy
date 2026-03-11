# Dev deployment (VPS + GitHub Actions)

This sets up **dev-only** CI/CD:
- Push to branch `dev` → GitHub Actions builds + deploys to your VPS.
- Nginx serves `bigfew.com` → proxies to Node on port `4000`.
- Secrets for dev live in a single GitHub Secret (`DEV_ENV`); the pipeline writes it to `/etc/orivisa-dev.env` on the server automatically.

## 1) Server prerequisites (VPS)

SSH to your server:

```bash
ssh root@158.220.116.6
```

Install Node 20+, npm, nginx:

```bash
apt update
apt install -y curl nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

## 2) Nginx + domain (Namecheap)

### DNS
In Namecheap for `bigfew.com`:
- Add `A` record: `@` → `158.220.116.6`
- Add `A` record: `www` → `158.220.116.6`

### Nginx site

```bash
cp /var/www/orivisa-dev/current/deploy/dev/nginx-bigfew-dev.conf /etc/nginx/sites-available/bigfew.com
ln -sfn /etc/nginx/sites-available/bigfew.com /etc/nginx/sites-enabled/bigfew.com
nginx -t
systemctl reload nginx
```

### SSL (Let’s Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d bigfew.com -d www.bigfew.com
```

## 3) GitHub Actions secrets

In GitHub → Repo → **Settings → Secrets and variables → Actions**, add:

- `DEV_HOST`: `158.220.116.6`
- `DEV_USER`: `root`
- `DEV_SSH_PORT`: `22`
- `DEV_SSH_KEY`: your private SSH key for connecting to the VPS
- `DEV_ENV`: the exact contents you want in `/etc/orivisa-dev.env`, for example:

  ```text
  PORT=4000
  MONGODB_URI=mongodb://localhost:27017/orivisa
  JWT_SECRET=replace_with_long_random_secret
  FRONTEND_URL=https://bigfew.com
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  TWILIO_ACCOUNT_SID=...
  TWILIO_AUTH_TOKEN=...
  TWILIO_PHONE_NUMBER=...
  ```

## 4) How deploy works (HTTPS-ready)

- Workflow: `.github/workflows/deploy-dev.yml`
- On push to `dev`:
  - Builds `client`
  - Creates `release.tgz` containing:
    - `server/` (no node_modules)
    - `client/dist/`
    - `deploy/`
  - Uploads to VPS
  - Extracts into `/var/www/orivisa-dev/releases/<sha>`
  - Points `/var/www/orivisa-dev/current` at that release
  - On the VPS (behind HTTPS Nginx proxy):
    - Writes `/etc/orivisa-dev.env` from the `DEV_ENV` GitHub secret
    - Installs/refreshes `orivisa-dev.service` in systemd
    - Installs/refreshes the Nginx site config for `bigfew.com`
    - Runs `deploy/dev/deploy-remote.sh` (installs server deps with `npm ci --omit=dev` and restarts the service)

## Notes

- Do **not** commit `server/.env` to Git.
- If a secret was previously pushed, rotate it (MongoDB/Google/Twilio).

