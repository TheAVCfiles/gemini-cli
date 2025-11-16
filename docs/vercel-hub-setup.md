# Vercel Hub Deployment Guide

This guide explains how to use a single Vercel project as a deployment hub for multiple smaller web branches ("sparks") so that each branch can be deployed professionally and efficiently.

## 1. Prepare the Repository

1. **Adopt a branch naming scheme** – Use predictable names such as `spark/<feature>` or `branch/<client>` so you can map branches to deployments easily.
2. **Ensure build scripts are reusable** – Each branch should share the same build command and output directory. Configure those commands in `package.json` or your project tooling.
3. **Add environment variable templates** – Commit an `.env.example` that lists all required variables for a spark so you can configure them quickly in Vercel.

## 2. Create a Single Vercel Project

1. Log in to the Vercel dashboard and create a new project connected to your Git provider (GitHub, GitLab, Bitbucket).
2. Point the project at the root of this repository so Vercel can build any branch.
3. In the project settings, configure the build command and output directory to match the repo defaults (for example, `npm run build` with output in `dist/` or `web/dist`).

## 3. Configure Preview Branch Deployments

1. Enable **Preview Deployments** for all branches in the Vercel project settings.
2. Optionally restrict previews to branches that match your naming pattern (e.g., `spark/*`) using the **Ignored Build Step** or by enabling **Automatically Deploy Previews for PRs from Forks** only when needed.
3. Each push to a branch triggers an isolated preview deployment. Share the generated `https://<deployment>.vercel.app` URL with stakeholders.

## 4. Promote Sparks to Production

1. Merge a spark branch into your production branch (commonly `main`).
2. Vercel automatically promotes the resulting build to the production domain configured for the project.
3. If you need a spark to live at a custom subdomain, configure a **Preview Environment Alias** (e.g., `spark-login.example.com`) and assign it to the corresponding preview deployment.

## 5. Automate with GitHub Actions (Optional)

1. Create a GitHub Action that labels PRs by spark type and posts the Vercel preview URL to the PR description.
2. Add checks that block merging until the Vercel build succeeds.

## 6. Clean Up Old Sparks

1. Use Vercel's **Deployment Protection** to delete unused previews automatically after a retention period.
2. Archive or delete branches in your Git provider when a spark is complete to keep the hub clean.

## 7. Optimize Build Performance

1. Configure **Build Cache** in Vercel by enabling caching for dependencies (`package-lock.json`, `pnpm-lock.yaml`, etc.).
2. Avoid large optional dependencies in spark branches. Instead, load them dynamically or behind feature flags.
3. Use environment-specific feature toggles so that sparks can share the same production build without manual tweaks.

## 8. Keep Secrets Manageable

1. Store shared secrets (API keys, service endpoints) in Vercel project environment variables.
2. For spark-specific secrets, create environment groups (`Production`, `Preview`, `Development`) and populate only the values needed for that branch or client.
3. Document which secrets belong to each spark in your internal knowledge base.

## 9. Monitoring and Rollbacks

1. Enable Vercel analytics or integrate external monitoring (e.g., Logflare, Datadog) for each deployment.
2. If a spark deployment misbehaves, use Vercel's **Rollback** feature to revert to a previous deployment instantly.

## 10. Checklist for Each Spark

- [ ] Branch created following naming scheme
- [ ] Environment variables configured in Vercel
- [ ] Build command verified locally
- [ ] Preview deployment URL shared
- [ ] Monitoring configured (optional)
- [ ] Branch merged or archived when complete

With this setup, you can run a single Vercel project as a hub that spins up preview environments for every spark branch while keeping production clean and optimized.
