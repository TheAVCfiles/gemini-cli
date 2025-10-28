/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'node:os';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  'dist',
  'Executive_Entry_Pack_v2.zip',
);

function toJson(content) {
  return `${JSON.stringify(content, null, 2)}\n`;
}

function buildStripeProducts(nowIso) {
  return {
    generatedAt: nowIso,
    products: [
      {
        id: 'gcp-private-cloud-pilot',
        name: 'GCP Private Cloud Pilot',
        price: {
          amount: 75000,
          currency: 'usd',
          type: 'one_time',
        },
        description:
          'Six-week private deployment of a secure Gemini environment inside your preferred GCP region.',
        metadata: {
          onboardingForm: 'https://typeform.com/to/cloud-offer-close',
          supabaseTable: 'funding_tx',
          revenueEngine: 'Pilot',
        },
      },
      {
        id: '8765-resilience-seat',
        name: '8765 Resilience Cohort Seat',
        price: {
          amount: 297,
          currency: 'usd',
          type: 'recurring',
          interval: 'month',
        },
        description:
          'Monthly cohort membership with automated burnout telemetry and recovery playbooks.',
        metadata: {
          seatsIncluded: 1,
          supabaseTable: 'learner_stats',
          revenueEngine: 'Cohort',
        },
      },
      {
        id: 'founder-alignment-retainer',
        name: 'Founder Alignment Retainer',
        price: {
          amount: 1500,
          currency: 'usd',
          type: 'recurring',
          interval: 'month',
        },
        description:
          'Always-on advisory channel and asynchronous diagnostics for venture teams.',
        metadata: {
          onboardingForm: 'https://typeform.com/to/founder-alignment',
          supabaseTable: 'funding_tx',
          revenueEngine: 'Services',
        },
      },
    ],
  };
}

function buildMakeScenario({
  slug,
  name,
  typeformLink,
  stripeProductId,
  supabaseTable,
  summary,
}) {
  return {
    blueprint_version: 1,
    slug,
    name,
    summary,
    modules: [
      {
        id: 'typeform_trigger',
        type: 'typeform',
        description: 'Starts when a Typeform response is received.',
        config: {
          trigger: 'form.submitted',
          formUrl: typeformLink,
        },
      },
      {
        id: 'stripe_lookup',
        type: 'stripe',
        description: 'Fetches checkout session data for reconciliation.',
        config: {
          productId: stripeProductId,
        },
      },
      {
        id: 'supabase_upsert',
        type: 'supabase',
        description: 'Upserts funding state for the opportunity.',
        config: {
          table: supabaseTable,
          endpointVariable: 'SUPABASE_REST_URL',
          serviceRoleKeyVariable: 'SUPABASE_SERVICE_ROLE_KEY',
        },
      },
      {
        id: 'notion_brief',
        type: 'notion',
        description: 'Posts a structured summary into the operations database.',
        config: {
          databaseIdVariable: 'NOTION_FUNNELS_DB',
        },
      },
      {
        id: 'gmail_notification',
        type: 'gmail',
        description: 'Sends the concierge confirmation message.',
        config: {
          draftTemplate: `${slug}-confirmation`,
        },
      },
    ],
    testing: {
      instructions: [
        'Open the scenario in Make and switch to manual run mode.',
        'Submit a test Typeform response using the preview link.',
        'Confirm the Supabase module reports a 200 OK response.',
      ],
    },
  };
}

function buildEdgeWebhook(nowIso) {
  return `import { buffer } from 'node:stream/consumers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '', {
  apiVersion: '2023-10-16',
});

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const body = await buffer(request.body ?? new ReadableStream());
  const signature = request.headers.get('stripe-signature') ?? '';
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'] ?? '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('[stripe] signature verification failed', error);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const payload = JSON.stringify(
      {
        source: 'stripe',
        receivedAt: '${nowIso}',
        data: event.data.object,
      },
      null,
      2,
    );

    const supabaseUrl = process.env['SUPABASE_REST_URL'] ?? '';
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

    const response = await fetch(supabaseUrl + '/funding_tx', {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: 'Bearer ' + serviceRoleKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: payload,
    });

    if (!response.ok) {
      console.error('[stripe] Supabase insert failed', await response.text());
      return new Response('Supabase insert failed', { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
`;
}

function buildExpressWebhook(nowIso) {
  return `import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '', {
  apiVersion: '2023-10-16',
});
const supabase = createClient(
  process.env['SUPABASE_REST_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
);

app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const signature = request.headers['stripe-signature'] ?? '';
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'] ?? '';

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        webhookSecret,
      );
    } catch (error) {
      console.error('[stripe] signature verification failed', error);
      response.status(400).send('Invalid signature');
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const payload = {
        source: 'stripe',
        received_at: '${nowIso}',
        data: event.data.object,
      };

      const { error } = await supabase
        .from('funding_tx')
        .upsert(payload, { onConflict: 'data->>id' });

      if (error) {
        console.error('[stripe] Supabase insert failed', error);
        response.status(500).send('Supabase insert failed');
        return;
      }
    }

    response.status(200).send('ok');
  },
);

export default app;
`;
}

function buildLandingHtml(nowIso) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Intuition Labs Executive Entry Portal</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      :root {
        color-scheme: light dark;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: radial-gradient(circle at top, #0a0a24, #02010a 60%, #000 100%);
        color: #f5f7ff;
      }
      body {
        margin: 0;
        padding: 48px 16px 96px;
        display: flex;
        justify-content: center;
      }
      .shell {
        max-width: 720px;
        width: 100%;
        background: rgba(8, 8, 20, 0.78);
        border: 1px solid rgba(96, 117, 255, 0.32);
        border-radius: 20px;
        padding: 56px 40px;
        box-shadow: 0 32px 80px rgba(6, 12, 48, 0.6);
      }
      h1 {
        margin-top: 0;
        font-size: 2.75rem;
        line-height: 1.15;
        letter-spacing: -0.02em;
      }
      p.lede {
        font-size: 1.125rem;
        margin-bottom: 32px;
        color: rgba(214, 222, 255, 0.86);
      }
      .cta-grid {
        display: grid;
        gap: 16px;
      }
      a.cta {
        display: block;
        padding: 18px 20px;
        border-radius: 14px;
        background: linear-gradient(120deg, #4d7cff, #7a5cff);
        color: white;
        text-decoration: none;
        font-weight: 600;
        text-align: center;
        box-shadow: 0 18px 40px rgba(76, 122, 255, 0.35);
      }
      footer {
        margin-top: 40px;
        font-size: 0.9rem;
        color: rgba(214, 222, 255, 0.7);
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <h1>Intuition Labs Executive Entry Portal</h1>
      <p class="lede">
        Activate capital, cohorts, and founder operations in a single evening. Each
        purchase routes to Supabase in realtime so your team can onboard without waiting.
      </p>
      <div class="cta-grid">
        <a class="cta" href="https://typeform.com/to/cloud-offer-close" target="_blank">
          Book the $75K Pilot
        </a>
        <a class="cta" href="https://buy.stripe.com/test_checkout_link" target="_blank">
          Join 8765 Resilience Cohort
        </a>
        <a class="cta" href="https://paypal.com/checkoutnow?token=founder-diagnostic" target="_blank">
          Founder Diagnostic ($222)
        </a>
      </div>
      <footer>
        All purchases auto-generate your onboarding link within 5 minutes.<br />
        Last updated ${nowIso}.
      </footer>
    </main>
  </body>
</html>
`;
}

function buildLandingNotionMarkdown(nowIso) {
  return `# Intuition Labs Executive Entry Portal

- **Updated:** ${nowIso}
- **Stripe Dashboard:** https://dashboard.stripe.com/test/dashboard
- **Supabase Funding Table:** \`funding_tx\`

## Call-to-Action Links

1. [Book the $75K Pilot](https://typeform.com/to/cloud-offer-close)
2. [Join 8765 Resilience Cohort](https://buy.stripe.com/test_checkout_link)
3. [Founder Diagnostic ($222)](https://paypal.com/checkoutnow?token=founder-diagnostic)

> All purchases auto-generate your onboarding link within 5 minutes.

## Copy Blocks

- Stripe + Make + Supabase automate receipts, onboarding, and CRM handoffs.
- Webhooks pre-configured for both Express and Vercel Edge runtimes.
- Dashboard card pulls totals from the \`/api/codex\` endpoint every minute.
`;
}

function buildDashboardScript() {
  return `import { setIntervalAsync, clearIntervalAsync } from 'set-interval-async/dynamic';

const API_BASE = process.env['INTUITION_API_URL'] ?? 'https://intuitionlabs.ai';
const TARGET = document.getElementById('executive-dashboard');

if (!TARGET) {
  throw new Error('Missing #executive-dashboard container');
}

function renderCard({ totalFundingUsd, activeLearners, latestTransaction }) {
  TARGET.innerHTML = ` + '`' + `
    <section style="border-radius:16px;padding:24px;background:#0f142f;color:#f5f7ff;font-family:Inter, sans-serif;">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2 style="margin:0;font-size:1.25rem;">Executive Revenue Pulse</h2>
        <span style="font-size:0.85rem;color:rgba(214,222,255,0.65);">\${new Date().toLocaleTimeString()}</span>
      </header>
      <dl style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:0;">
        <div>
          <dt style="font-size:0.8rem;text-transform:uppercase;color:rgba(214,222,255,0.6);">Total Funding</dt>
          <dd style="margin:8px 0 0;font-size:1.6rem;">$\${totalFundingUsd.toLocaleString()}</dd>
        </div>
        <div>
          <dt style="font-size:0.8rem;text-transform:uppercase;color:rgba(214,222,255,0.6);">Active Learners</dt>
          <dd style="margin:8px 0 0;font-size:1.6rem;">\${activeLearners}</dd>
        </div>
        <div>
          <dt style="font-size:0.8rem;text-transform:uppercase;color:rgba(214,222,255,0.6);">Latest Transaction</dt>
          <dd style="margin:8px 0 0;font-size:1rem;">\${latestTransaction}</dd>
        </div>
      </dl>
    </section>
  ` + '`' + `;
}

async function fetchMetrics() {
  const response = await fetch(API_BASE + '/api/codex');
  if (!response.ok) {
    throw new Error('Failed to load metrics');
  }
  const data = await response.json();
  renderCard({
    totalFundingUsd: Math.round(data.funding_total_usd ?? 0),
    activeLearners: data.active_learners ?? 0,
    latestTransaction: data.latest_transaction ?? 'N/A',
  });
}

const handle = setIntervalAsync(async () => {
  try {
    await fetchMetrics();
  } catch (error) {
    console.error('[dashboard] refresh failed', error);
  }
}, 60_000);

await fetchMetrics();

if (import.meta.hot) {
  import.meta.hot.dispose(() => clearIntervalAsync(handle));
}
`;
}

function buildStripeTestInstructions() {
  return `# Stripe Webhook Smoke Test

1. Install the Stripe CLI locally and authenticate with \`stripe login\`.
2. In your terminal, forward events: \`stripe listen --forward-to localhost:3000/webhooks/stripe\`.
3. Trigger a test checkout event: \`stripe trigger checkout.session.completed\`.
4. Confirm logs show the webhook payload persisted into Supabase \`funding_tx\`.
`;
}

function buildReadme(nowIso) {
  return `# Executive Entry Pack v2

Generated ${nowIso}.

This bundle accelerates the "Phase 00" activation plan by providing drop-in assets for payments, automation, landing, and telemetry.

## Contents

- \`stripe/products.json\` – ready-to-import product definitions for the three revenue engines.
- \`stripe/webhook-test.md\` – command checklist for validating webhook delivery.
- \`webhooks/express/server.js\` – Node/Express webhook that upserts into Supabase.
- \`webhooks/edge/route.ts\` – Vercel Edge-compatible webhook handler.
- \`make/*.json\` – Make (Integromat) blueprints for pilots, cohorts, and retainers.
- \`landing/index.html\` – shareable portal with CTA links wired to live flows.
- \`landing/notion-export.md\` – quick import text for a Notion landing hub.
- \`dashboard/poll-metrics.js\` – embeddable widget pulling live Supabase totals.

## Next Steps

1. Import Stripe products and connect the webhook endpoint using the included handlers.
2. Upload the Make blueprints (A/B/C) and map connections for Typeform, Stripe, Gmail, Notion, and Supabase.
3. Deploy the landing page via Vercel or Notion and update the CTA URLs.
4. Drop the dashboard script into your CMS block with a container element.
`;
}

export function createExecutivePackContents(now = new Date()) {
  const nowIso = now.toISOString();
  const files = new Map();

  files.set('README.md', buildReadme(nowIso));
  files.set('stripe/products.json', toJson(buildStripeProducts(nowIso)));
  files.set('stripe/webhook-test.md', buildStripeTestInstructions());

  files.set(
    'make/cloud-offer-close.json',
    toJson(
      buildMakeScenario({
        slug: 'cloud-offer-close',
        name: 'Cloud Offer Close',
        typeformLink: 'https://typeform.com/to/cloud-offer-close',
        stripeProductId: 'gcp-private-cloud-pilot',
        supabaseTable: 'funding_tx',
        summary:
          'Qualifies private cloud pilots and routes payment confirmations into Supabase and Notion.',
      }),
    ),
  );

  files.set(
    'make/8765-cohort-sale.json',
    toJson(
      buildMakeScenario({
        slug: '8765-cohort-sale',
        name: '8765 Cohort Sale',
        typeformLink: 'https://typeform.com/to/8765-resilience',
        stripeProductId: '8765-resilience-seat',
        supabaseTable: 'learner_stats',
        summary:
          'Captures cohort purchases, allocates seats, and stores learner telemetry in Supabase.',
      }),
    ),
  );

  files.set(
    'make/services-retainer.json',
    toJson(
      buildMakeScenario({
        slug: 'services-retainer',
        name: 'Services → Retainer',
        typeformLink: 'https://typeform.com/to/founder-alignment',
        stripeProductId: 'founder-alignment-retainer',
        supabaseTable: 'funding_tx',
        summary:
          'Onboards advisory retainers and syncs context into the founder operations workspace.',
      }),
    ),
  );

  files.set('webhooks/edge/route.ts', buildEdgeWebhook(nowIso));
  files.set('webhooks/express/server.js', buildExpressWebhook(nowIso));

  files.set('landing/index.html', buildLandingHtml(nowIso));
  files.set('landing/notion-export.md', buildLandingNotionMarkdown(nowIso));

  files.set('dashboard/poll-metrics.js', buildDashboardScript());

  return files;
}

export async function writeExecutivePackZip(
  files,
  { outputPath = DEFAULT_OUTPUT_PATH } = {},
) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await rm(outputPath, { force: true });

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'executive-pack-'));

  try {
    for (const [relativePath, content] of files.entries()) {
      const filePath = path.join(tempDir, relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      const data =
        typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
      await writeFile(filePath, data);
    }

    await new Promise((resolve, reject) => {
      const child = spawn('zip', ['-rq', outputPath, '.'], { cwd: tempDir });
      child.on('error', (error) => {
        reject(
          new Error(
            `Failed to execute zip command. Ensure the \`zip\` utility is installed. Original error: ${error.message}`,
          ),
        );
      });
      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`zip exited with code ${code}`));
        }
      });
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  return { outputPath, fileCount: files.size };
}

export async function generateExecutiveEntryPack({
  now = new Date(),
  outputPath = DEFAULT_OUTPUT_PATH,
} = {}) {
  const files = createExecutivePackContents(now);
  return writeExecutivePackZip(files, { outputPath });
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  generateExecutiveEntryPack()
    .then(({ outputPath, fileCount }) => {
      console.log(
        `Created Executive Entry Pack at ${outputPath} with ${fileCount} assets.`,
      );
    })
    .catch((error) => {
      console.error('Failed to generate Executive Entry Pack:', error);
      process.exitCode = 1;
    });
}
