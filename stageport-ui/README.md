# Stageport UI Demo

A lightweight React + Vite playground for the Stageport faculty vault experience. The UI is Tailwind-friendly (utility classes included in components) and showcases:

- A Stageport faculty gallery with agentic personas.
- Vault modal that requests `/api/vault-query` for teaching artifacts.
- License modal that posts to `/api/license-create-session`.

## Getting started
1. `npm install`
2. Run `npm run dev` and open the provided localhost URL.
3. Optional: set `VITE_STRIPE_PUBLISHABLE_KEY` to enable live Stripe Checkout redirects. Otherwise the demo uses a client-side success simulation.
4. Tailwind users can add `@tailwind base; @tailwind components; @tailwind utilities;` to `src/index.css` and configure `postcss.config.js`. Without Tailwind, the layout still renders but without utility styling.

The UI is designed to pair with the serverless endpoints in `../stageport-server/api`.
