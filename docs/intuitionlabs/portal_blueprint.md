# IntuitionLabs Portal Blueprint

The IntuitionLabs Portal curates a personalized planning experience for learners and clients who receive the Ballet Bots curriculum bundle. This reference page documents the core interface regions and scripted interactions described in the latest design mock.

## Layout overview

- **Header strip**
  - Branded as **Intuition Labs Portal** with a status chip indicating the expiration date for portal access (e.g., `Portal Access Expires: Nov 28, 2025`).
  - Designed with a charcoal background (`#1F2937`) and rounded corners to mirror the aesthetic of the Ballet Bots dashboard widgets.
- **Welcome panel**
  - Greets the recipient by name ("Welcome, Lilly.").
  - Includes supportive copy reminding the user that their "comprehensive blueprint is ready" and hints at the insights below.
- **Executive Summary card**
  - Outlines four headline takeaways:
    1. **Central Thesis** describing the synergy between the user's Scorpio Sun and Aquarius Stellium placements.
    2. **Key Business Window** highlighting an optimal launch period between **October 15–30, 2025**.
    3. **Key Personal Window** forecasting a romantic partnership window from **November 2025 – February 2026**.
    4. **Core Challenge** emphasizing the need to ground visionary ideas into daily execution.
- **12-Month Action Plan module**
  - Framed as an interactive "Natal-Transit Chart" rendered in the style of a candlestick plot.
  - Green candles represent harmonious days; red candles mark challenging days.
  - The highlighted focus range (`Oct 15–30, 2025`) overlays a green band to reinforce the business launch window.
  - Tooltip copy for the highlighted range reads:
    - **Event:** Jupiter-Mars Energy Peak
    - **Action:** "HIGH-PRIORITY LAUNCH WINDOW. Take decisive action. Launch marketing campaigns, seek initial funding, and formalize partnerships."
- **AI Council chat module**
  - Includes router metadata indicating that questions about missing Earth placements should be routed to the **Chronos Scribe** persona.
  - Sample answer reminds the user to source grounding through structure, partnerships, and collaborators with strong Earth influences.
- **Artifacts grid**
  - Provides quick links to the `Comprehensive PDF`, `Audio Summary`, `Video Consultation`, and the **DeCrypt the Moon** journal cover.
  - Also surfaces the `30-Day Support` mailto link (`support@intuition-labs.io`).

## Implementation guidance

- Persist the copy in the shared IntuitionLabs vector store ([vs_6859e43920848191a894dd36ecf0595a](https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a)) for retrieval-augmented assistants.
- Use Tailwind or utility CSS tokens matching the marketing site palette: slate background (`#1F2937`), neutral text (`#D1D5DB`), and accent highlights (`#6EE7B7`, `#FCA5A5`).
- Render the candlestick chart with an interactive library (e.g., ApexCharts) so the Oct 15–30, 2025 window can be focused via programmatic zoom and annotated overlays.
- For the AI Council, configure the router agent to map planetary placement questions to the Chronos Scribe persona while leaving other prompts to domain-specific specialists.

## Next steps for facilitators

1. Pair this portal blueprint with the [SaaS product catalog](./saas_products.md) to align launch campaigns with asset fulfillment.
2. Reference the Ballet Bots [lesson plans](./teaching_materials/lesson_plans.md) when producing supporting workshop material for the highlighted business window.
3. Schedule a quarterly content review to refresh the executive summary copy, ensuring astrological forecasts stay aligned with the client's current transit data.
