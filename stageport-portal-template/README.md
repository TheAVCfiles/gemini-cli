[![Run on Replit](https://replit.com/badge?caption=Run%20on%20Replit)](https://replit.com/new/github/YOURNAME/stageport-portal-template)

# StagePort Portal Template

A minimal Replit-ready portal scaffold: Next.js + Supabase auth/DB + role-based dashboard shell + demo seed script.

## Step 1 — Open in Replit

Click the badge above.

## Step 2 — Add Secrets (env vars)

In Replit, open **Secrets** and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Step 3 — Seed + Run

In Replit Shell:

```bash
npm i
npm run seed
npm run dev
```

Seed creates demo logins for `owner`, `staff`, `auditor`, and `super_admin`.

## RBAC model

`profiles` table fields:

- `id` (uuid)
- `email`
- `role` (`super_admin | owner | staff | auditor`)
- `studio_id`

Minimal access rules:

- **owner** sees studio data.
- **staff** sees sessions only.
- **auditor** sees reports only.
- **super_admin** sees everything.
