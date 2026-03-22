#!/usr/bin/env bash
# Run ON THE VPS (as root or with sudo) after:
#   - DNS A records for @ and www point to this server
#   - Nginx is serving HTTP (port 80) to Node on 127.0.0.1:4000
#
# Usage:
#   sudo bash deploy/dev/enable-https-abroadup.sh abroadup.online
#   sudo bash deploy/dev/enable-https-abroadup.sh abroadup.com
#
# Or pass multiple domains (Certbot will add all to one cert):
#   sudo bash deploy/dev/enable-https-abroadup.sh abroadup.online www.abroadup.online abroadup.com www.abroadup.com

set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash $0 $*"
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: sudo bash $0 <domain1> [domain2 ...]"
  echo "Example: sudo bash $0 abroadup.online www.abroadup.online"
  exit 1
fi

apt-get update -qq
apt-get install -y certbot python3-certbot-nginx

DOMAINS=()
for d in "$@"; do DOMAINS+=(-d "$d"); done

# Optional: export LETSENCRYPT_EMAIL=you@yourdomain.com before running (recommended)
EMAIL_ARGS=(--register-unsafely-without-email)
if [[ -n "${LETSENCRYPT_EMAIL:-}" ]]; then
  EMAIL_ARGS=(--email "$LETSENCRYPT_EMAIL")
fi

# Certbot adds SSL + optional HTTP→HTTPS redirect
certbot --nginx --non-interactive --agree-tos "${EMAIL_ARGS[@]}" \
  "${DOMAINS[@]}" --redirect

nginx -t
systemctl reload nginx

# Prevent GitHub Actions from overwriting nginx after certbot edits
touch /etc/nginx/.abroadup-keep-nginx
echo "Done. HTTPS enabled for: $*"
echo "Marker created: /etc/nginx/.abroadup-keep-nginx (deploys will not overwrite nginx)."
echo "Set FRONTEND_URL=https://<your-primary-domain> in /etc/orivisa-dev.env"
