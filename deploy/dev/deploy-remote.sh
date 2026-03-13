#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/orivisa-dev/current"
SERVER_DIR="$APP_DIR/server"

echo "Deploying ORIVISA dev on $(hostname)"
echo "APP_DIR=$APP_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed on the server."
  echo "Install Node 20+ first, then re-run deploy."
  exit 1
fi

cd "$SERVER_DIR"
echo "Installing server dependencies (npm ci --omit=dev)..."
npm ci --omit=dev

echo "Restarting orivisa-dev.service..."
systemctl restart orivisa-dev.service || true
systemctl --no-pager --full status orivisa-dev.service || true

echo "Remote deploy script finished."

