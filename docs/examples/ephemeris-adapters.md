# Ephemeris adapter examples

Some Gemini CLI templates expose an `/api/ephemeris` endpoint so a front-end can display
an "astral forecast" card next to the agent experience. The endpoint is intentionally
left blank—the scaffolder simply forwards whatever JSON you return. To connect it to a
real data source you only need to provide an adapter that fetches the upstream service
and normalises the response to the `{ sign, moonPhase, phase, retrograde }` shape.

The snippets below show three self-contained adapters that you can paste directly into
`/api/ephemeris`. Each adapter accepts optional latitude/longitude arguments so you can
pass along the user's location if the provider supports it.

## Aztro horoscope API

[Aztro](https://aztro.readthedocs.io/en/latest/) is a hobbyist horoscope API that
returns daily zodiac information. It only supports POST requests with the zodiac sign
encoded in the query string, so the adapter hard-codes a default sign and simply maps
fields into the expected payload.

```ts
export async function fromAztro(lat?: number, lon?: number) {
  const res = await fetch(
    "https://aztro.sameerkumar.website/?sign=aries&day=today",
    { method: "POST" },
  );
  const j = await res.json();
  return {
    sign: j.sign || "Aries",
    moonPhase: j.mood || "Full",
    phase: "Active",
    retrograde: "None",
  };
}
```

## AstronomyAPI

[AstronomyAPI](https://docs.astronomyapi.com/) provides richer solar-system data but
requires authentication. Replace the placeholder credentials and tweak the endpoint per
their documentation. The response includes constellation and lunar phase fields that can
be forwarded to the UI.

```ts
export async function fromAstronomyAPI(lat?: number, lon?: number) {
  const u = new URL("https://api.astronomyapi.com/api/v2/bodies/positions");
  const res = await fetch(u.toString(), {
    headers: { Authorization: "Basic YOUR_KEY" },
  });
  const j = await res.json();
  const sign =
    j.data?.table?.rows?.[0]?.entry?.[0]?.position?.constellation?.name || "Aries";
  const moonPhase = j.data?.moonphase?.current?.phase?.name || "Full";
  const retrograde = "None"; // Map this from the provider if available
  return { sign, moonPhase, phase: "Active", retrograde };
}
```

## Custom JSON endpoint

If you already operate a horoscope service you can proxy it through a light-weight JSON
endpoint. This adapter forwards optional coordinates, accepts a flexible set of field
names, and normalises them into the expected payload structure.

```ts
export async function fromCustomJSON(endpoint: string, lat?: number, lon?: number) {
  const u = new URL(endpoint);
  if (lat && lon) {
    u.searchParams.set("lat", String(lat));
    u.searchParams.set("lon", String(lon));
  }
  const r = await fetch(u.toString());
  const j = await r.json();
  return {
    sign: j.sign || j.sunSign || j.zodiac || j.current?.sun?.sign,
    moonPhase: j.moonPhase || j.current?.moon?.phase,
    phase: j.phase || "Active",
    retrograde: (j.retrograde || j.rx || j.current?.mercury?.retrograde)
      ? "Mercury"
      : "None",
  };
}
```

> **Tip:** Whichever adapter you choose, validate and cache the upstream response inside
your handler so the endpoint remains responsive even if the provider rate limits you.
