/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Universal config helper for Gemini/OpenAI across Firebase, Netlify, Vercel, Node.
// Usage:
//   const cfg = await getAIConfig();           // caches by default
//   const { provider, model, apiKey } = chooseProvider(req, cfg);

export type Provider = "gemini" | "openai";

export type AIConfig = Readonly<{
  geminiKey?: string;
  openaiKey?: string;
  geminiModel: string;
  openaiModel: string;
  defaultProvider: Provider;
}>;

type MinimalReq = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, unknown>;
};

let _cache: AIConfig | null = null;

/** Safely peel a string from unknown input */
function s(x: unknown): string | undefined {
  if (typeof x === "string") return x;
  if (x != null && typeof (x as any).toString === "function") {
    const y = (x as any).toString();
    return typeof y === "string" ? y : undefined;
  }
  return undefined;
}

/** Optional Secret Manager lazy import (only used if secret names are set) */
async function maybeFetchFromSecretManager(name: string): Promise<string | undefined> {
  try {
    const { SecretManagerServiceClient } = await import("@google-cloud/secret-manager");
    const client = new SecretManagerServiceClient();
    // name: "projects/<PROJECT_NUMBER>/secrets/<SECRET_NAME>/versions/latest"
    const [v] = await client.accessSecretVersion({ name });
    return v.payload?.data?.toString();
  } catch (err) {
    // Don’t throw here; absence of Secret Manager support shouldn’t kill config resolution
    // but do leave a breadcrumb for logs.
    console.warn(`[ai-config] Secret Manager fetch failed for ${name}:`, (err as Error)?.message);
    return undefined;
  }
}

/** Optional Firebase functions config (v1/v2 compatible; safe no-op elsewhere) */
function getFirebaseConfig(path: string[]): unknown {
  try {
    // dynamic require to avoid bundlers choking in ESM or non-Firebase environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fns = require("firebase-functions");
    const root = typeof fns.config === "function" ? fns.config() : {};
    return path.reduce<unknown>((acc, k) => {
      if (acc && typeof acc === "object" && k in (acc as any)) return (acc as any)[k];
      return undefined;
    }, root);
  } catch {
    return undefined;
  }
}

function pick<T = string>(...candidates: Array<unknown>): T | undefined {
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== "") return c as T;
  }
  return undefined;
}

/** Build config with a clear resolution order and optional refresh in serverless */
export async function getAIConfig(opts?: { forceRefresh?: boolean }): Promise<AIConfig> {
  if (_cache && !opts?.forceRefresh) return _cache;

  // 1) Env vars (portable)
  let geminiKey = pick<string>(
    process.env.GEMINI_API_KEY,
    process.env.generativeai_key,
    process.env.GENERATIVEAI_KEY
  );
  let openaiKey = pick<string>(
    process.env.OPENAI_API_KEY,
    process.env.openai_key,
    process.env.OPENAI_KEY
  );

  let geminiModel = pick<string>(process.env.GEMINI_MODEL, "gemini-1.5-flash")!;
  let openaiModel = pick<string>(process.env.OPENAI_MODEL, "gpt-4o-mini")!;
  let defaultProvider = (pick<string>(process.env.AI_PROVIDER, "gemini") as Provider) ?? "gemini";

  // 2) Firebase Functions config fallback (if set via CLI)
  if (!geminiKey) geminiKey = s(getFirebaseConfig(["generativeai", "key"]));
  if (!openaiKey) openaiKey = s(getFirebaseConfig(["openai", "key"]));
  geminiModel = s(getFirebaseConfig(["gemini", "model"])) ?? geminiModel;
  openaiModel = s(getFirebaseConfig(["openai", "model"])) ?? openaiModel;
  defaultProvider = (s(getFirebaseConfig(["ai", "provider"])) as Provider) ?? defaultProvider;

  // 3) Optional Secret Manager (set names via env)
  if (!geminiKey && process.env.GEMINI_SECRET_RESOURCE) {
    geminiKey = await maybeFetchFromSecretManager(process.env.GEMINI_SECRET_RESOURCE);
  }
  if (!openaiKey && process.env.OPENAI_SECRET_RESOURCE) {
    openaiKey = await maybeFetchFromSecretManager(process.env.OPENAI_SECRET_RESOURCE);
  }

  _cache = Object.freeze({ geminiKey, openaiKey, geminiModel, openaiModel, defaultProvider });
  return _cache;
}

/** Reset cache — handy for hot reload in dev or controlled refreshes */
export function resetAIConfigCache(): void {
  _cache = null;
}

/** Choose provider deterministically and assert key presence for the chosen one */
export function chooseProvider(
  req: MinimalReq | undefined,
  cfg: AIConfig
): { provider: Provider; model: string; apiKey: string } {
  // Preference order for runtime overrides:
  // 1) header: x-ai-provider
  // 2) query/body: provider
  // 3) cfg.defaultProvider
  const headerProv = s(req?.headers?.["x-ai-provider"])?.toLowerCase();
  const qbProv =
    s(req?.query?.provider)?.toLowerCase() ||
    s(req?.body?.provider)?.toLowerCase();

  const normalized =
    headerProv === "openai" || headerProv === "gemini"
      ? (headerProv as Provider)
      : qbProv === "openai" || qbProv === "gemini"
      ? (qbProv as Provider)
      : cfg.defaultProvider;

  if (normalized === "openai") {
    if (!cfg.openaiKey) {
      throw new Error(
        "[ai-config] OPENAI_API_KEY missing (also checked alternate env names, Firebase config, and Secret Manager)."
      );
    }
    return { provider: "openai", model: cfg.openaiModel, apiKey: cfg.openaiKey };
  }

  if (!cfg.geminiKey) {
    throw new Error(
      "[ai-config] GEMINI_API_KEY missing (also checked alternate env names, Firebase config, and Secret Manager)."
    );
  }
  return { provider: "gemini", model: cfg.geminiModel, apiKey: cfg.geminiKey };
}
