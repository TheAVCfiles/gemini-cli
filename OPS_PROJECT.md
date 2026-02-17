# MoveMint-Ledger Operational Spine

This playbook keeps the MoveMint-Ledger MVP shippable while staying lean and ADHD-friendly.

## North Star

- **Ship first, standardize second.** Keep `/api/ledger` live via Vercel with a fast smoke test.
- **Automation over memory.** Use GitHub templates + CI to reduce decision fatigue.
- **Clarity at a glance.** Each repo documents purpose, status, and the next shippable.

## Current Focus

- **Endpoint:** `/api/ledger` from `bet-on-avc` deployed on Vercel.
- **Version tag:** Stable `v1` once the smoke test passes.

## Operational Workflow

1. **Branches:** Small PRs into `main` with issue links.
2. **CI:** Vercel deploy workflow builds `bet-on-avc` and runs a post-deploy smoke test against `/api/ledger` (requires secrets below).
3. **Issue Templates:** Bug, Feature, and Ops/Milestone templates standardize intake.
4. **Status Updates:** Close issues with linked deployments; add notes to this file when milestones move.

## Required Secrets for Deploy Workflow

- `VERCEL_TOKEN` – Vercel CLI token.
- `VERCEL_ORG_ID` – Organization ID for the project.
- `VERCEL_PROJECT_ID` – Project ID for `bet-on-avc`.
- `MOVEMINT_LEDGER_URL` – Production base URL (e.g., `https://movemint-ledger.vercel.app`).

## Smoke Test (manual)

```bash
curl -f "$MOVEMINT_LEDGER_URL/api/ledger"
```

Expect HTTP 200 with a JSON array. If it fails, check the Vercel logs for `bet-on-avc`.

## Milestones

- **MVP:** `/api/ledger` live on Vercel with passing smoke test.
- **Stability:** Tag deployment as `v1` after two consecutive green runs.
- **Scale-out:** Replicate the workflow + templates to sibling repos.

## UX Notes

- Keep the API payload small and mobile-friendly; responses should render cleanly in iPhone browsers and shortcuts.
- Prefer consistent JSON keys and short descriptions to keep cognitive load low across UI, backend, and ops.
