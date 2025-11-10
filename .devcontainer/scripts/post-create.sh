#!/usr/bin/env bash
set -euo pipefail

echo "[post-create] Starting dependency bootstrap..."

# Node: install if lockfile present
if [ -f package-lock.json ] || [ -f pnpm-lock.yaml ] || [ -f yarn.lock ]; then
  if command -v pnpm >/dev/null 2>&1 && [ -f pnpm-lock.yaml ]; then
    echo "[post-create] Installing Node deps with pnpm"
    pnpm install --frozen-lockfile || pnpm install
  elif command -v yarn >/dev/null 2>&1 && [ -f yarn.lock ]; then
    echo "[post-create] Installing Node deps with yarn"
    yarn install --frozen-lockfile || yarn install
  else
    echo "[post-create] Installing Node deps with npm"
    npm ci || npm install
  fi
fi

# Python: install if requirements or pyproject found
if [ -f requirements.txt ]; then
  echo "[post-create] Installing Python deps (requirements.txt)"
  pip install --upgrade pip
  pip install -r requirements.txt || true
elif [ -f pyproject.toml ]; then
  echo "[post-create] Installing Python deps (pyproject.toml)"
  pip install --upgrade pip
  pip install -e . || pip install . || true
fi

# Create a convenient run task if none exists
if [ ! -f .vscode/tasks.json ]; then
  mkdir -p .vscode
  cat > .vscode/tasks.json <<'JSON'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start (auto)",
      "type": "shell",
      "command": "bash .devcontainer/scripts/start-auto.sh",
      "problemMatcher": []
    }
  ]
}
JSON
fi

echo "[post-create] Done."
