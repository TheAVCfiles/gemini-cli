#!/usr/bin/env bash
set -euo pipefail
echo "[update-content] Syncing environment after content change..."

# Lightweight re-install if lockfiles changed
if [ -f package-lock.json ]; then
  npm ci || npm install
elif [ -f pnpm-lock.yaml ]; then
  pnpm install --frozen-lockfile || pnpm install
elif [ -f yarn.lock ]; then
  yarn install --frozen-lockfile || yarn install
fi

if [ -f requirements.txt ]; then
  pip install -r requirements.txt || true
fi

echo "[update-content] Done."
