const { createClient } = require("@supabase/supabase-js");

function buildResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return buildResponse(405, { message: "Method Not Allowed" });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error("Missing Supabase configuration");
    return buildResponse(500, { message: "Supabase credentials are not configured" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return buildResponse(400, { message: "Invalid JSON payload", details: error.message });
  }

  const eventType = payload?.type;
  if (eventType !== "checkout.session.completed") {
    return buildResponse(200, { message: "Event ignored", type: eventType });
  }

  const session = payload?.data?.object || {};
  const customerEmail = session?.customer_details?.email || null;
  const amountTotal = typeof session?.amount_total === "number" ? session.amount_total / 100 : null;
  const productName =
    session?.display_items?.[0]?.custom?.name ||
    session?.metadata?.product ||
    session?.metadata?.plan_name ||
    "Unknown";

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const record = {
    customer_email: customerEmail,
    amount: amountTotal,
    product: productName,
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from("funding_tx").insert(record);
    if (error) {
      console.error("Supabase insert failed", error);
      return buildResponse(500, { message: "Failed to record transaction", details: error.message });
    }
  } catch (error) {
    console.error("Unexpected Supabase error", error);
    return buildResponse(500, { message: "Failed to record transaction", details: error.message });
  }

  return buildResponse(200, { message: "ok" });
};
