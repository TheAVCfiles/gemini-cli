# DeCrypt the Girl — Codespaces Quickstart

This repo is pre-wired for one-click GitHub Codespaces.

## One-click
- On GitHub, click **Code → Create codespace on main** (or open in **VS Code Desktop** if set as default).
- When the container finishes building, run **Tasks: Run Task → Start (auto)** to launch a dev server (Node `dev` script or Python http server).

## Ports
- 3000 (Node), 5173 (Vite), 8000 (Python). Codespaces will forward these automatically.

## Customize
- Install deps: edit `requirements.txt` / `pyproject.toml` / `package.json`. The container will auto-install.
- Devcontainer settings: `.devcontainer/devcontainer.json` and shell scripts in `.devcontainer/scripts/`.

## Prebuilds (optional)
Enable **Settings → Codespaces → Prebuilds** for this repo to speed up first-time startup.
