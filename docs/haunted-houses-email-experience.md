# Haunted Houses Horoscope Email Experience

## Vision
Deliver a cinematic, narrative-driven horoscope that guides clients through the "haunted houses" of their birth chart. The experience starts on the client-side form where birth data is collected and flows into a generative AI storytelling engine. The output is an email-ready experience that feels like a guided tour through twelve enchanted rooms, each representing an astrological house with bespoke transits, rituals, and affirmations.

## Experience Pillars
- **Fun & Playful:** Lean into mystical haunted-house motifs—secret passages, whispering walls, ghostly guides—without becoming gimmicky or frightening.
- **Personally Powerful:** Anchor each house's message to the client's chart data, highlighting agency, growth, and actionable insight.
- **Curated & Unique:** Blend deterministic chart calculations with curated prompt templates and AI-generated copy tuned to the client's style preferences.
- **Email-Ready:** The final output renders cleanly in email clients, using modular sections and minimal interactive elements that degrade gracefully.

## Client Journey Overview
1. **Landing Page & Form**
   - Atmospheric hero section inviting the user to "Enter Your Haunted Houses" with a CTA to begin.
   - Multi-step form collects birth date, birth time, birth location, pronouns, tone preference (e.g., soothing, adventurous), and optional focus areas (career, love, self-discovery).
   - Preview card updates in real time with animated constellations reacting to inputs, reinforcing magic.

2. **Processing State**
   - Display a short narrative loading state: "Casting wards & summoning guides…"
   - Behind the scenes, the system calculates houses, applies transit data, and assembles AI prompts.

3. **Email Delivery**
   - User receives a richly formatted email containing the haunted house tour.
   - Optional web-view mirrors the email for enhanced interactivity (parallax backgrounds, subtle animations).

## Narrative Structure
Each of the twelve astrological houses becomes a room in the haunted manor.

| House | Room Title | Narrative Hook | Focus Elements |
| --- | --- | --- | --- |
| 1 | The Threshold | Ghostly mirror reflects self-image. | Identity, first impressions |
| 2 | The Vault | Whispering vault of treasures. | Values, resources |
| 3 | The Corridor | Talking portraits share messages. | Communication, siblings |
| 4 | The Hearth | Ancestor spirits around a fireplace. | Home, roots |
| 5 | The Ballroom | Phantom musicians encourage play. | Creativity, romance |
| 6 | The Study | Busy sprites sorting schedules. | Routine, wellness |
| 7 | The Parlor | Candlelit agreements with spectral partners. | Partnerships, contracts |
| 8 | The Reliquary | Vault of transformations and secrets. | Intimacy, shared resources |
| 9 | The Observatory | Starlit dome with floating books. | Philosophy, travel |
| 10 | The Tower | Bell tower echoing ambition. | Career, reputation |
| 11 | The Conservatory | Spirit-hosted salons. | Community, aspirations |
| 12 | The Hidden Garden | Moonlit labyrinth of dreams. | Subconscious, healing |

## Email Layout Blueprint
1. **Header Panel**
   - Background: watercolor wash with mansion silhouette.
   - Personalized greeting: "{Name}, the Manor Awaits".
   - Quick-glance astrological summary: Sun, Moon, Rising with icons.

2. **Narrative Introduction**
   - 2–3 paragraphs setting the scene, referencing current lunar phase and major transits.
   - CTA button linking to web-view.

3. **Haunted House Tour (12 modules)**
   - Each module includes:
     - Room illustration (static PNG/GIF fallback).
     - House title + narrative hook.
     - Transit Highlights: 2–3 bullet points generated from chart data.
     - Ritual & Reflection: actionable practice or journaling prompt.
     - Affirmation spelled as an incantation.
     - Tone-specific copy (based on user preference).
   - Use alternating background colors or subtle textures for pacing.

4. **Interactive Elements for Email Compatibility**
   - Accordion-style sections using checkbox hacks for clients that support it; fall back to stacked content.
   - Animated GIFs kept under 1MB for deliverability.
   - Include alt text for all imagery to maintain accessibility.

5. **Closing & Call to Action**
   - Invite to "Book a Live Séance" (consultation) or purchase add-ons (e.g., monthly haunted house updates).
   - Provide social sharing snippet with pre-written text.
   - Footer with unsubscribe, contact, and astrological disclaimers.

## Personalization Logic
- **Core Data:** Birth chart planets, houses, aspects, and current transits.
- **Tone Modifiers:** Map the user's chosen tone to synonyms, sentence structure, and pacing in prompts.
- **Focus Areas:** Re-weight copy emphasis to highlight relevant houses and transits.
- **Narrative Flair:** Maintain consistent haunted-house motifs while adapting sensory details to user preferences (e.g., cozy vs. thrilling).

### Prompt Template Structure
```
System: You are an enchanted mansion guide. Maintain mystical, encouraging tone.
User Context:
- Client Name: {name}
- Birth Data Summary: {sun_sign}, {moon_sign}, {rising_sign}
- Transit Snapshot: {transits}
- Tone Preference: {tone}
- Focus Houses: {priority_houses}
Task: For each house, craft a 90-word vignette that includes:
- Opening line describing the room and spectral guide.
- Insight tied to the relevant astrological themes and current transits.
- Ritual suggestion.
- Affirmation starting with "Incantation:".
```

## Automation Flow
1. **Data Collection** → multi-step form posts to backend.
2. **Chart Calculation** → existing astrology library (e.g., `swisseph`) determines houses and transits.
3. **Prompt Assembly** → server builds prompts with curated descriptors per house.
4. **AI Generation** → call to Gemini API for each house + intro + closing.
5. **Content Validation** → optional toxicity/sentiment check, ensure length constraints.
6. **Email Rendering** → populate MJML/React Email template, export to HTML.
7. **Delivery** → send via transactional email service (SendGrid, Postmark). Attach web-view URL.

## Visual Language & Assets
- **Palette:** Midnight indigo, candlelight gold, spectral lavender, and mossy green accents.
- **Typography:** Display header (e.g., "Cormorant Garamond"), body copy (e.g., "Source Sans Pro").
- **Illustrations:** Hand-drawn or watercolor-style rooms, subtle grain overlay.
- **Iconography:** Tarot-inspired glyphs for planets and houses.

## Extensibility
- Offer seasonal overlays (e.g., "Harvest Moon Edition").
- Add upsell for audio narration voiced by AI.
- Allow exporting as shareable story highlights or printable PDF grimoire.

## Success Metrics
- Email open rate & click-through to web-view.
- Time-on-page for web-view and ritual completion confirmations.
- Add-on purchases (monthly updates, live readings).
- Qualitative feedback: user-reported resonance and empowerment.

## Implementation Notes
- Store user birth data securely and allow deletion on request.
- Consider light/dark mode toggles for the web-view.
- Ensure accessible color contrast and screen reader support.
- Include fallback copy for missing birth time (use solar houses with adjusted narrative cues).

## Sample Email Section (MJML Snippet)
```mjml
<mj-section background-url="https://cdn.example.com/rooms/vault-texture.png" background-repeat="no-repeat" padding="32px">
  <mj-column>
    <mj-image src="https://cdn.example.com/icons/house2.png" alt="The Vault of Echoing Treasures" width="96px"/>
    <mj-text font-size="24px" font-family="Cormorant Garamond" color="#F5E6C5">Room II: The Vault of Echoing Treasures</mj-text>
    <mj-text font-size="16px" line-height="1.6" color="#E9D8FD">
      A hush falls as spectral coins levitate before you, {name}. Venus trines your natal Saturn, urging grounded abundance.
    </mj-text>
    <mj-text font-size="14px" color="#C4B5FD"><strong>Ritual:</strong> Inventory your resources by candlelight, naming what feels nourished.
    </mj-text>
    <mj-text font-size="14px" color="#C4B5FD"><strong>Incantation:</strong> "What I treasure, treasures me in return."
    </mj-text>
  </mj-column>
</mj-section>
```

## Email Packaging for Easy Delivery
- Export HTML + plaintext versions.
- Include hero and room imagery as hosted assets with CDN caching.
- Provide shareable PDF summary for clients preferring offline reading.
- Embed calendar link for scheduling follow-up readings.

## Future Enhancements
- Interactive quiz inside email for discovering "Which spirit guide walks beside you?".
- AI-generated ambient soundtrack linked via web-view.
- Community leaderboard for most completed rituals (opt-in).

