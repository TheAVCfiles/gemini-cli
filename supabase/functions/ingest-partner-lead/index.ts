// Handles JSON from Typeform or Notion automation → inserts into partner_leads

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const payload = await req.json();

    // Normalize Typeform payload (fallbacks for Notion/Custom)
    const source = payload?.source ?? "typeform";

    const lead = {
      org_name: payload.org_name ?? payload.company ?? null,
      contact_name: payload.contact_name ?? payload.name ?? null,
      contact_email: payload.contact_email ?? payload.email ?? null,
      platform: payload.platform ?? null,
      role: payload.role ?? null,
      company_size: payload.company_size ?? null,
      message: payload.message ?? payload.notes ?? null,
      source,
      utm_campaign: payload.utm_campaign ?? null,
      utm_medium: payload.utm_medium ?? null,
      utm_source: payload.utm_source ?? null
    };

    const { error } = await supabase.from("partner_leads").insert(lead);
    if (error) {
      console.error("Insert error:", error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error("Webhook error:", e.message);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 400 });
  }
});
