# StudioOS Style & Theme System (Nocturne / Sovereign / Femme Upgrade)

Guiding line: **Wealth is quiet, not shouty.**

## Dual Themes

1. **NOCTURNE – The Operator Console (Dark)**
   - Backgrounds: Ink Deep (#050509), Midnight (#151821)
   - Text: Ivory Paper (#F7F3EE)
   - Accents: Gold Thread (#DBB889), Rose Footlight (#E7C2C0), Mauve Tutu (#C3AEC9)
   - Success: Teal Sensor (#3DDB82)
   - Use: Director consoles, risk alerts, live “Motion to Proof” tracking.

2. **SOVEREIGN – The Wealth Console (Light)**
   - Backgrounds: Sovereign Paper (#F5EFE5), Warm Gray/Card (#F9F4EC)
   - Text: Ink Soft (#3C3228), Sovereign Taupe (#9A8B7B)
   - Accents: Sovereign Gold (#DBB777), Sovereign Rose (#C99ABE), Faded Lilac (#BFA8C4)
   - Use: Investor PDFs, founder decks, legal exhibits, printed reports.

## Semantic Tokens (CSS)

```css
:root {
  --bg-page: var(--theme-bg-page);
  --bg-card: var(--theme-bg-card);
  --bg-subtle: var(--theme-bg-subtle);

  --text-primary: var(--theme-text-primary);
  --text-muted: var(--theme-text-muted);
  --text-on-accent: var(--theme-text-on-accent);

  --accent-gold: var(--theme-accent-gold);
  --accent-rose: var(--theme-accent-rose);
  --accent-mauve: var(--theme-accent-mauve);

  --success: var(--theme-success);
  --border-soft: var(--theme-border-soft);
}
```

Typography:

- Headlines: Playfair Display – “The House Voice.”
- Body: Inter – UI + numbers.
- Mono: IBM Plex Mono – ledgers, hashes, IDs.

Buttons = jewelry.  
UI physics: almost no drop shadow; subtle inner glows, border-soft edges. If it looks a little “too empty,” it’s right.
