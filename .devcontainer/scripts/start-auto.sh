#!/usr/bin/env bash
set -euo pipefail

# Prefer Node dev servers if available
if [ -f package.json ]; then
  if grep -q '"dev"' package.json; then
    echo "[start-auto] Running: npm run dev"
    exec npm run dev
  elif grep -q '"start"' package.json; then
    echo "[start-auto] Running: npm start"
    exec npm start
  fi
fi

# Fallback: Python http server (serves ./public or root)
servedir="."
if [ -d public ]; then
  servedir="public"
elif [ -d dist ]; then
  servedir="dist"
fi
echo "[start-auto] Serving ${servedir} on http://localhost:8000"
exec python -m http.server --directory "${servedir}" 8000
