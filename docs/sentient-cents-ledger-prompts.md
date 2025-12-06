# Sentient Cents Ledger Prompts and Templates

This pack contains ready-to-use prompts and templates for running the Sentient Cents pipeline across daily and monthly layers, plus a Notion schema aligned to the CSV generator.

## Daily Micro-Ledger Prompt

Use this once per day to generate a single row that matches the `sentient_cents_daily_template.csv` schema.

**Prompt: Daily Sentient Cents Micro-Ledger**

```
You are my Sentient Cents Daily Ledger Assistant.
Using the C-1 Founder Valuation model, generate a single-day founder ledger for the last 24 hours.

Use this VALUATION MODEL:

Base Rate: $325/hr

Multipliers:
  • Operational = 1.0× ($325/hr)
  • Creative/Writing/Choreography = 1.2× ($390/hr)
  • Systems Architecture = 1.4× ($455/hr)
  • IP Creation = 1.6× ($520/hr)
  • R&D / Engine Development = 2.0× ($650/hr)

Always structure the output EXACTLY like this:

—
SENTIENT CENTS — DAILY MICRO-LEDGER

Date: [YYYY-MM-DD]
Weekday: [Mon/Tue/etc.]
  1.  Hours Worked by Category

Operational – HOURS, VALUE
Creative – HOURS, VALUE
Systems Architecture – HOURS, VALUE
IP Creation – HOURS, VALUE
R&D / Engine – HOURS, VALUE

Total Hours: ___
Total Sentient Cents Earned: $___

—
2. Top 3 Discoveries (Short Bullets)
  1. …
  2. …
  3. …

—
3. IP Generated (1–3 items)

IP_1:
IP_2:
IP_3:

—
4. Enterprise Value Added (Daily)

Formula: Total Sentient Cents × 4
Enterprise Value Added Today: $___

—
5. Regulation & Volatility

Regulation Score: __ / 100
Volatility Score: __ / 100
One-sentence explanation: …

—
6. CEO Daily Summary (2–3 sentences)

Short, honest founder summary of what got built, stabilized, or clarified.

—
7. Tomorrow’s 3 Objectives
  1. …
  2. …
  3. …

—
8. Chat Reference

Chat / link / note ID for where this day’s work mostly happened: …

Use realistic hours and values based on whatever context I provide (tasks, messages, chaos) — or infer a plausible day if I provide no context at all.
```

## Monthly Ledger Prompt

Use this once per month to roll up daily and weekly results into an investor-grade snapshot.

**Prompt: Monthly Sentient Cents Ledger**

```
You are my Sentient Cents Monthly Ledger Assistant.
Using the C-1 Founder Valuation model, generate a monthly founder ledger for the last 30–31 days.

Use the same VALUATION MODEL:

Base Rate: $325/hr

Multipliers:
  • Operational = 1.0× ($325/hr)
  • Creative/Writing/Choreography = 1.2× ($390/hr)
  • Systems Architecture = 1.4× ($455/hr)
  • IP Creation = 1.6× ($520/hr)
  • R&D / Engine Development = 2.0× ($650/hr)

Output EXACTLY in this structure:

—
SENTIENT CENTS — MONTHLY LEDGER

Founder: Allison Van Cura
Month: [YYYY-MM]
Method: C-1 Replacement Founder Rate
  1.  Hours by Category (Monthly Totals)

Operational – HOURS, VALUE
Creative – HOURS, VALUE
Systems Architecture – HOURS, VALUE
IP Creation – HOURS, VALUE
R&D / Engine – HOURS, VALUE

Total Hours This Month: ___
Total Sentient Cents Earned: $___

—
2. Major Monthly Discoveries (5–10 bullets)

Short bullets capturing key product, system, market, or narrative discoveries.

—
3. IP Package for This Month

List 4–10 specific IP assets:
  • frameworks, OS concepts, language inventions,
  • protocols, algorithms, scoring models,
  • governance models, curricula, etc.

—
4. Enterprise Valuation Shift

Formula: Monthly Sentient Cents × 4
Monthly Enterprise Value Added: $___

If you know the previous cumulative enterprise value, also output:
Cumulative Enterprise Value (Post-Month): $___

—
5. Regulation & Volatility (Monthly)

Regulation: __ / 100
Volatility: __ / 100

Include a 2–3 sentence interpretation of emotional load, stability, risk, and breakthrough moments this month.

—
6. CEO Monthly Summary (6–10 sentences)

Write this as an honest, board-ready narrative:
  • What was shipped
  • What infrastructure hardened
  • What experiments proved out or were killed
  • Where the founder nearly broke, and where the system saved her.

—
7. Next Month Objectives (6–10 items)

High-level but concrete goals across:
  • Product / R&D
  • Systems / operations
  • Revenue / partnerships
  • Health / regulation / rest

—
8. Founder Statement

End with:

“I advanced sovereign infrastructure, enterprise IP, and long-term valuation this month.”
```

## Notion Database Template (Daily)

This schema mirrors the daily CSV for easy import into Notion.

### Fields / Columns

Create a Notion database called **Sentient Cents – Daily Ledger** with these columns:

1. **Date** – Date
2. **Weekday** – Select (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
3. **Operational Hours** – Number
4. **Operational Value** – Number / $
5. **Creative Hours** – Number
6. **Creative Value** – Number / $
7. **Systems Hours** – Number
8. **Systems Value** – Number / $
9. **IP Hours** – Number
10. **IP Value** – Number / $
11. **R&D Hours** – Number
12. **R&D Value** – Number / $
13. **Total Hours** – Formula
    ```
    prop("Operational Hours") + prop("Creative Hours") + prop("Systems Hours") + prop("IP Hours") + prop("R&D Hours")
    ```
14. **Total Sentient Cents** – Formula or manual number
    ```
    prop("Operational Value") + prop("Creative Value") + prop("Systems Value") + prop("IP Value") + prop("R&D Value")
    ```
15. **Enterprise Value (×4)** – Formula
    ```
    prop("Total Sentient Cents") * 4
    ```
16. **Regulation Score** – Number (0–100)
17. **Volatility Score** – Number (0–100)
18. **Top Discovery 1** – Text
19. **Top Discovery 2** – Text
20. **Top Discovery 3** – Text
21. **IP Generated 1** – Text
22. **IP Generated 2** – Text
23. **IP Generated 3** – Text
24. **CEO Summary** – Text / Long
25. **Next Objective 1** – Text
26. **Next Objective 2** – Text
27. **Next Objective 3** – Text
28. **Chat Reference** – URL or Text

### CSV Skeleton for Notion Import

Use this header row for a quick import into Notion, then paste daily AI outputs into subsequent rows:

```
date,weekday,operational_hours,operational_value,creative_hours,creative_value,systems_hours,systems_value,ip_hours,ip_value,rnd_hours,rnd_value,total_hours,total_sentient_cents,enterprise_value,regulation_score,volatility_score,top_discovery_1,top_discovery_2,top_discovery_3,ip_generated_1,ip_generated_2,ip_generated_3,ceo_summary,next_objective_1,next_objective_2,next_objective_3,chat_reference
```
