# Persephone Samhain Reading Automation Kit

This document captures the full automation kit for delivering Persephone-themed readings using Typeform, Zapier, Google Docs, SendGrid, Google Sheets, Slack, and Notion.

## A. Immediate Artifacts

### Typeform Fields

Create a mobile-first Typeform with the following fields (names must match exactly for Zapier mapping):

1. **Full name** — Short text — required
2. **Email** — Email — required
3. **Gumroad receipt ID** — Short text — required — placeholder: “Paste your Gumroad receipt ID (e.g. G-12345)”
4. **Birth date** — Date (YYYY-MM-DD) — required
5. **Birth time** — Short text (HH:MM or “unknown”) — optional
6. **Birth place** — Short text (City, Country) — required
7. **Intention** — Long text — optional — hint: “One-line intent: what you bring to the ritual”
8. **Consent** — Yes/No — required — label: “I consent to storage of my birth data for the reading” (must be Yes)
9. **Hidden field** (optional) `campaign` — populate later for tracking
10. **Thank you** page text: “Thanks — your ritual will arrive by email in ~10 minutes.”

> Turn on Typeform email notifications for debugging while Zapier remains the primary flow.

### Google Doc Template (`Persephone_Reading_Template`)

Create a Google Doc named `Persephone_Reading_Template` and paste the following content. Map the placeholders in Zapier’s “Create document from template” step.

```
{{title}}

NATAL SUMMARY
{{natal}}

PERSEPHONE & SAMHAIN THEME
{{persephone_theme}}

RITUAL STEPS
1) {{ritual1}}
2) {{ritual2}}
3) {{ritual3}}

MOVEMENT PROMPT
{{movement_prompt}}

DECRYPTION DECK
{{deck_title}} — {{deck_glyph}}
Upright: {{deck_upright}}
Inverted: {{deck_inverted}}

—
This reading is by Decrypt the Girl. For support: decryptthegirl+support@gmail.com
```

Style the document with Merriweather headings, Inter body text, and optionally add a header image.

### SendGrid Transactional Email

- **Subject:** `Your Persephone Samhain Reading — {{name}}`
- **HTML body:**

```html
<p>Dear {{name}},</p>

<p>
  Thank you — your Persephone / Samhain reading is ready. Download your ritual
  PDF here:
</p>
<p><a href="{{pdf_link}}">Download Persephone Reading (PDF)</a></p>

{{#if mp3_link}}
<p>Audio narration: <a href="{{mp3_link}}">Download MP3</a></p>
{{/if}}

<p>If you have any trouble, reply to this email and we’ll help.</p>
<p>— Allison Claire, Decrypt the Girl ( @decrypt_the_girl )</p>
```

- **Plain-text fallback:** `Your reading is ready: {{pdf_link}}`

### Google Sheet Ledger (`DecryptTheGirl_Ledger`)

Import the following CSV into a new Google Sheet:

```
Timestamp,GumroadReceipt,Name,Email,Price,StripeFee,VariableCost,FixedAlloc,TotalCost,NetProfit,CumulativeNet,Payout50%
,, , , , , , , , , ,
```

Create a `Settings` sheet with:

- `Settings!A1 = FixedCost`
- `Settings!A2 = 200`
- `Settings!B1 = 10`
- `Settings!C1 = VariableCostFull`
- `Settings!C2 = 0.79`

Use these formulas starting at row 2 of the ledger:

- StripeFee (F2): `=ROUND(E2*0.029 + 0.30, 2)` _(use Gumroad fees if applicable)_
- VariableCost (G2): `=Settings!C2`
- FixedAlloc (H2): `=ROUND(Settings!A2/Settings!B1,2)`
- TotalCost (I2): `=F2 + G2 + H2`
- NetProfit (J2): `=E2 - I2`
- CumulativeNet (K2): `=IF(ROW()=2, J2, K1 + J2)`
- Payout50% (summary cell): `=IF(COUNTA(A:A)>=Settings!B1, ROUND(SUM(J2:J11)*0.5,2), "pending")`

Pre-fill formulas down the sheet so appended Zapier rows inherit the calculations.

## B. Zapier Build Recipe

Create a Zap named **Persephone Reading Fulfillment** with the following steps:

1. **Trigger:** Typeform → New Entry (select the Samhain form).
2. **Code (JavaScript):** Compute sun sign from the submitted birth date.

   ```javascript
   const dob = inputData.dob; // YYYY-MM-DD
   const parts = dob.split('-');
   const m = parseInt(parts[1], 10);
   const d = parseInt(parts[2], 10);

   function getSunSign(month, day) {
     const signs = [
       { name: 'Capricorn', start: [12, 22], end: [1, 19] },
       { name: 'Aquarius', start: [1, 20], end: [2, 18] },
       { name: 'Pisces', start: [2, 19], end: [3, 20] },
       { name: 'Aries', start: [3, 21], end: [4, 19] },
       { name: 'Taurus', start: [4, 20], end: [5, 20] },
       { name: 'Gemini', start: [5, 21], end: [6, 20] },
       { name: 'Cancer', start: [6, 21], end: [7, 22] },
       { name: 'Leo', start: [7, 23], end: [8, 22] },
       { name: 'Virgo', start: [8, 23], end: [9, 22] },
       { name: 'Libra', start: [9, 23], end: [10, 22] },
       { name: 'Scorpio', start: [10, 23], end: [11, 21] },
       { name: 'Sagittarius', start: [11, 22], end: [12, 21] },
     ];
     for (let s of signs) {
       const sm = s.start[0],
         sd = s.start[1],
         em = s.end[0],
         ed = s.end[1];
       if (sm <= em) {
         if (
           (month === sm && day >= sd) ||
           (month === em && day <= ed) ||
           (month > sm && month < em)
         )
           return s.name;
       } else {
         if (
           (month === sm && day >= sd) ||
           (month === em && day <= ed) ||
           month > sm ||
           month < em
         )
           return s.name;
       }
     }
     return 'Capricorn';
   }

   output = { sun_sign: getSunSign(m, d) };
   ```

3. **Formatter (Text → Template):** Build `chart_summary` string with sun sign, birthplace, birth time, and intention.
4. **OpenAI:** Create chat completion with system prompt instructing JSON output containing title, natal, Persephone theme, ritual steps, movement prompt, and deck card fields. Use the Typeform data and computed sun sign in the user message.
5. **Code (JavaScript):** Parse the JSON response and expose individual fields (`title`, `natal`, `persephone_theme`, `ritual1`, `ritual2`, `ritual3`, `movement_prompt`, `deck_title`, `deck_glyph`, `deck_upright`, `deck_inverted`).
6. **Google Docs:** Create document from the template using the parsed fields.
7. **Google Docs:** Export the created document to PDF.
8. **Google Drive or SendGrid:** Upload the PDF to Drive or pass it directly to SendGrid as an attachment.
9. **SendGrid:** Send the transactional email to the respondent with the PDF link or attachment.
10. **Google Sheets:** Append a row to the ledger capturing timestamp, receipt ID, contact info, and pricing data (allow in-sheet formulas to calculate fees and profit).
11. **Slack:** Post a delivery confirmation message to `#ops` with key details.
12. **Notion:** Create a database entry in the `Deliveries` database recording the fulfillment.

Include an error-handling path that posts to `#ops-alerts` with the Typeform ID and error payload if any step fails.

## C. Slack, Notion, and Daily Digest

- **Slack (`#ops`):** Delivery message template

  ```
  ✅ Delivered Reading
  Name: {{Full name}}
  Email: {{Email}}
  Sun sign: {{sun_sign}}
  PDF: {{pdf_link}}
  Gumroad receipt: {{Gumroad receipt}}
  ```

- **Slack (`#ops-alerts`):** Error notification template

  ```
  :rotating_light: PERSEPHONE DELIVERY ERROR
  Typeform ID: {{typeform_id}}
  Step: {{failed_step}}
  Error: {{error_message}}
  ```

- **Notion `Deliveries` Database Properties:** Name (title), Email (email), Price (number), PDF Link (URL), Status (select), Sun Sign (select/text), Typeform ID (text), Delivered At (date).

- **Daily Digest Zap:** Scheduled daily at 08:00 to read the ledger, compute totals for the last 24 hours, and post a summary to `#ops-daily` with counts of deliveries, revenue, pending work, total net profit, and progress toward the first 10 sales.

## D. Test Checklist and Go-Live SOP

1. Submit a Typeform test entry (use your own email).
2. Test each Zap step to ensure OpenAI returns valid JSON; tighten prompts if prose appears.
3. Confirm Google Doc creation and PDF export.
4. Verify the SendGrid email arrives with the PDF link or attachment.
5. Ensure the Google Sheet ledger updates and Slack notification posts.
6. Mark the Typeform sample as successful.

**Go-live sequence:**

1. Configure Gumroad to redirect purchasers to the Typeform.
2. Run a soft launch with a handful of trusted testers.
3. Monitor Slack for successful deliveries and errors.
4. After 10 paid deliveries, reconcile the ledger and execute the 50/50 payout per SOP.

## E. Example Ledger Row

Example data to validate formulas:

| Timestamp        | GumroadReceipt | Name    | Email               | Price | StripeFee | VariableCost | FixedAlloc | TotalCost | NetProfit |
| ---------------- | -------------- | ------- | ------------------- | ----- | --------- | ------------ | ---------- | --------- | --------- |
| 2025-10-21 19:10 | G-TEST-0001    | Allison | allison@example.com | 45    | 1.61      | 0.79         | 20         | 22.40     | 22.60     |

## F. Additional Support

On request, provide the fully mapped Zap configuration, completed Google Sheet with formulas prefilled, Notion database template, and a worked example JSON output for Zapier testing.
