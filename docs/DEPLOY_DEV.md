# Dev deployment (VPS + GitHub Actions)

This sets up **dev-only** CI/CD:
- Push to branch `dev` → GitHub Actions builds + deploys to your VPS.
- Nginx serves **both** `abroadup.online` and `abroadup.com` (and `www` variants) → proxies to Node on port `4000`.
- Secrets for dev live in a single GitHub Secret (`DEV_ENV`); the pipeline writes it to `/etc/orivisa-dev.env` on the server automatically.

## Domains (Abroad Up)

| Domain | Typical use |
|--------|-------------|
| **abroadup.online** | Works as soon as DNS points to the VPS — good default for HTTPS first. |
| **abroadup.com** | Use when registrar/DNS verification is done; add to the **same** TLS certificate (see SSL below). |

### Can I configure abroadup.com now and have HTTPS work later?

**Yes, with two parts:**

1. **DNS** — In Namecheap (or your registrar), create **A** records for `abroadup.com` and `www` → your VPS IP. Until DNS propagates, browsers won’t reach your server on that hostname.
2. **HTTPS** — Browsers expect a certificate that **includes** the hostname you visit.  
   - **Now:** Issue a cert for `abroadup.online` + `www.abroadup.online` only, update `ssl_certificate` paths in Nginx to match Certbot output (often `/etc/letsencrypt/live/abroadup.online/`).  
   - **Later:** When `abroadup.com` DNS works, **expand** the certificate so it lists all four names:

   ```bash
   sudo certbot certonly --nginx --expand \
     -d abroadup.online -d www.abroadup.online \
     -d abroadup.com -d www.abroadup.com
   ```

   Then reload Nginx. The repo config already lists all four `server_name`s; after expand, **HTTPS for .com works** without changing Nginx server blocks.

**If you add `abroadup.com` to Nginx before the cert includes it**, visitors will see a certificate warning until you run `certbot --expand` (or temporarily remove `.com` from `server_name` until ready).

### `FRONTEND_URL` (OAuth, emails, magic links)

The app uses **one** canonical URL string (`FRONTEND_URL` in `.env`). It does not need to list every domain — pick the one you want users to land on:

```text
# While .online is primary:
FRONTEND_URL=https://abroadup.online

# After .com is live and preferred:
FRONTEND_URL=https://abroadup.com
```

Users can still open the site on the other domain; API uses open CORS. Links in emails will use whatever `FRONTEND_URL` you set.

## 1) Server prerequisites (VPS)

SSH to your server:

```bash
ssh root@YOUR_SERVER_IP
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

## 2) Nginx + DNS (Namecheap or any DNS)

### DNS

For **abroadup.online**:

- `A` `@` → your VPS IP  
- `A` `www` → your VPS IP  

For **abroadup.com** (when ready):

- Same records for `@` and `www`.

### Nginx site (from repo)

```bash
cp /var/www/orivisa-dev/current/deploy/dev/nginx-abroadup-dev.conf /etc/nginx/sites-available/abroadup
ln -sfn /etc/nginx/sites-available/abroadup /etc/nginx/sites-enabled/abroadup
nginx -t
systemctl reload nginx
```

Edit `ssl_certificate` / `ssl_certificate_key` if Certbot used a different **certificate lineage** name.

### SSL (Let’s Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
```

**Phase 1 — .online only (recommended first):**

```bash
sudo certbot --nginx -d abroadup.online -d www.abroadup.online
```

**Phase 2 — add .com when DNS verifies:**

```bash
sudo certbot certonly --nginx --expand \
  -d abroadup.online -d www.abroadup.online \
  -d abroadup.com -d www.abroadup.com
sudo systemctl reload nginx
```

## 3) GitHub Actions secrets

In GitHub → Repo → **Settings → Secrets and variables → Actions**, add:

- `DEV_HOST`: your VPS IP or hostname  
- `DEV_USER`: `root` (or deploy user)  
- `DEV_SSH_PORT`: `22`  
- `DEV_SSH_KEY`: your private SSH key for connecting to the VPS  
- `DEV_ENV`: the exact contents you want in `/etc/orivisa-dev.env`, for example:

  ```text
  PORT=4000
  MONGODB_URI=mongodb://localhost:27017/orivisa
  JWT_SECRET=replace_with_long_random_secret
  FRONTEND_URL=https://abroadup.online
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
    - Installs/refreshes the Nginx site config for **abroadup** (both domains)
    - Runs `deploy/dev/deploy-remote.sh` (installs server deps with `npm ci --omit=dev` and restarts the service)

## Notes

- Do **not** commit `server/.env` to Git.
- If a secret was previously pushed, rotate it (MongoDB/Google/Twilio).
- Old `bigfew.com` Nginx snippets are superseded by `deploy/dev/nginx-abroadup-dev.conf`.
