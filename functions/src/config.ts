// Universal config helper for Gemini + OpenAI across Firebase, Netlify, Vercel, Node

export type Provider = "gemini" | "openai";

export type AIConfig = {
  geminiKey?: string;
  openaiKey?: string;
  geminiModel: string;
  openaiModel: string;
  defaultProvider: Provider;
};

let _cache: AIConfig | null = null;

export async function getAIConfig(): Promise<AIConfig> {
  if (_cache) return _cache;

  // 1) Env vars (portable everywhere)
  let geminiKey = process.env.GEMINI_API_KEY || process.env.generativeai_key;
  let openaiKey = process.env.OPENAI_API_KEY || process.env.openai_key;

  let geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  let openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  let defaultProvider: Provider =
    (process.env.AI_PROVIDER as Provider) || "gemini";

  // 2) Firebase Functions config (if deployed there)
  try {
    const fns = await import("firebase-functions");
    const cfg = typeof fns.config === "function" ? fns.config() : {};
    geminiKey = geminiKey || cfg.generativeai?.key;
    openaiKey = openaiKey || cfg.openai?.key;
    geminiModel = (cfg.gemini?.model as string) || geminiModel;
    openaiModel = (cfg.openai?.model as string) || openaiModel;
    defaultProvider = (cfg.ai?.provider as Provider) || defaultProvider;
  } catch {
    // ignore if not running in Firebase
  }

  _cache = {
    geminiKey,
    openaiKey,
    geminiModel,
    openaiModel,
    defaultProvider
  };
  return _cache;
}

export function chooseProvider(
  req: any,
  cfg: AIConfig
): { provider: Provider; model: string; apiKey?: string } {
  const q = (req?.query?.provider || req?.body?.provider || "")
    .toString()
    .toLowerCase();
  const provider: Provider =
    q === "openai" || q === "gemini" ? (q as Provider) : cfg.defaultProvider;

  if (provider === "openai") {
    return { provider, model: cfg.openaiModel, apiKey: cfg.openaiKey };
  }
  return { provider: "gemini", model: cfg.geminiModel, apiKey: cfg.geminiKey };
}
