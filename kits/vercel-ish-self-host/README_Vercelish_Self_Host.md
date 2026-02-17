# Vercel-ish on Your Own Box

A self-host kit for a Next.js frontend + FastAPI backend + Postgres database, all fronted by Caddy with automatic HTTPS. Deploy on a single server you control (home lab or VPS) with push-to-deploy over SSH from GitHub Actions.

## What You Need on the Server (One-Time)

- Linux host reachable from the internet (public IP or forwarded 80/443).
- DNS pointing your domain at that host (A/AAAA for apex, optional `www` CNAME).
- Docker + Docker Compose installed:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  # log out/in, then confirm
  docker --version && docker compose version
  ```
- Open ports 80 and 443. If you are behind CGNAT, swap port-forwarding for Tailscale Funnel or Cloudflare Tunnel and adapt the Caddyfile.

## Repo Layout (template lives in `kits/vercel-ish-self-host/my-host`)

```
my-host/
  docker-compose.yml
  Caddyfile
  .env.example             # never commit real secrets
  app/
    next/
      Dockerfile
      package.json
      next.config.js
      .dockerignore
      app/ (Next.js App Router sample)
    api/
      Dockerfile
      requirements.txt
      app.py
  db/
    init.sql               # optional bootstrap
  .github/workflows/
    deploy.yml             # SSH rsync deploy
```

## Compose Stack

- **Caddy** terminates TLS and routes `/api` to FastAPI and everything else to Next.js.
- **Next.js** built with `output: 'standalone'` for slim runtime images.
- **FastAPI** receives `DB_URL` and exposes `/api/health`, `/api/ping`, and `/api/dbcheck`.
- **Postgres** persists to a named volume and can ingest `db/init.sql` on first boot.

Environment expected in `.env`:

```
DB_PASSWORD=change-me-super-secret
```

## Bring It Up

```bash
cd my-host
cp .env.example .env   # set DB_PASSWORD
# edit Caddyfile to set your domain + email
# optional: adjust NEXT_PUBLIC_API_BASE build arg in docker-compose.yml

docker compose build --pull
docker compose up -d
docker compose logs -f reverse-proxy
```

Visit `https://yourdomain.com` once DNS and ports are ready. Caddy will auto-issue certificates.

## GitHub Actions Push-to-Deploy

`my-host/.github/workflows/deploy.yml` syncs the repo to the server and restarts the stack via SSH. Configure these repo secrets:

- `SSH_HOST`, `SSH_PORT`, `SSH_USER`
- `SSH_PRIVATE_KEY` (matches a public key in `~/.ssh/authorized_keys` on the server)
- `REMOTE_PATH` (e.g., `/home/you/my-host`)
- `DB_PASSWORD` (written into `.env` server-side)

The workflow executes:

1. `rsync` the repo to `${REMOTE_PATH}`.
2. Write `.env` with `DB_PASSWORD`.
3. `docker compose build --pull && docker compose up -d --remove-orphans`.
4. `docker system prune -f` for cleanup.

## Notes and Options

- Keep backups: add a nightly `pg_dump` cron on the host.
- Zero downtime: Caddy will continue serving while new containers start; `--remove-orphans` keeps services tidy.
- Preview URLs: add wildcard DNS and a second Caddyfile plus per-branch containers if you want PR-specific hosts (e.g., `pr-123.yourdomain.com`).
- Home-host caveats: power and uplink stability limit reliability; a small VPS removes those constraints.
