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
2. **HTTPS** — The **repo Nginx template is HTTP-only** (port 80 → Node). It does **not** reference `/etc/letsencrypt/...` so **deploy never fails** when certs don’t exist yet.  
   - After DNS works, SSH to the VPS and run **Certbot**; it will add HTTPS (port 443) to your Nginx config.  
   - **Important:** so the next GitHub deploy **does not overwrite** Certbot’s changes, create a marker file once:

   ```bash
   sudo touch /etc/nginx/.abroadup-keep-nginx
   ```

   While that file exists, the deploy script **skips** copying `nginx-abroadup-dev.conf`. Remove the file only when you intentionally want the repo template reapplied.

   - **Later:** When `abroadup.com` DNS works, expand the cert:

   ```bash
   sudo certbot --nginx --expand \
     -d abroadup.online -d www.abroadup.online \
     -d abroadup.com -d www.abroadup.com
   ```

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

CI/CD copies this automatically on deploy **unless** `/etc/nginx/.abroadup-keep-nginx` exists.

Manual copy (first-time / debugging):

```bash
cp /var/www/orivisa-dev/current/deploy/dev/nginx-abroadup-dev.conf /etc/nginx/sites-available/abroadup
ln -sfn /etc/nginx/sites-available/abroadup /etc/nginx/sites-enabled/abroadup
nginx -t
systemctl reload nginx
```

### SSL (Let’s Encrypt) — go live on **https://**

Prerequisites: **A records** for `@` and `www` → your VPS IP (e.g. `158.220.116.6`), and **wait for DNS** (TTL often 30 min).

1. SSH in: `ssh root@YOUR_VPS_IP`

2. Install Certbot (if not already):

```bash
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
```

3. **One certificate for the domain you’re enabling** (repeat later for the other domain, or expand):

**If this DNS panel is for `abroadup.online`:**

```bash
sudo certbot --nginx -d abroadup.online -d www.abroadup.online --redirect
```

**If this panel is for `abroadup.com`:**

```bash
sudo certbot --nginx -d abroadup.com -d www.abroadup.com --redirect
```

**All four names on one cert** (only when **both** domains resolve to this server):

```bash
sudo certbot --nginx \
  -d abroadup.online -d www.abroadup.online \
  -d abroadup.com -d www.abroadup.com \
  --redirect
```

4. **Stop deploy from overwriting Nginx** after Certbot edits:

```bash
sudo touch /etc/nginx/.abroadup-keep-nginx
```

5. Set **`FRONTEND_URL`** to HTTPS in `/etc/orivisa-dev.env` (and mirror in GitHub `DEV_ENV`), e.g.:

```text
FRONTEND_URL=https://abroadup.online
```

Then: `sudo systemctl restart orivisa-dev.service`

**Optional:** repo script (after deploy has extracted files):

```bash
sudo LETSENCRYPT_EMAIL=you@example.com bash /var/www/orivisa-dev/current/deploy/dev/enable-https-abroadup.sh abroadup.online www.abroadup.online
```

**Phase 2 — add `.com` to an existing cert** (when `.com` DNS is ready):

```bash
sudo certbot --nginx --expand \
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
