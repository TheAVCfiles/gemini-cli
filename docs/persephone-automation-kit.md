# Persephone Reading Automation Kit

This document captures the complete automation blueprint for delivering Persephone / Samhain ritual readings using Typeform, Zapier, Google Workspace, SendGrid, Slack, and Notion. It consolidates immediate artifacts, automation steps, and operational procedures so the flow can be launched in under an hour.

## A. Immediate Artifacts

### Typeform Form Definition

Create a new Typeform configured for mobile with the following fields (names must match for Zapier mapping):

1. **Full name** – Short text – required
2. **Email** – Email – required
3. **Gumroad receipt ID** – Short text – required – placeholder: `Paste your Gumroad receipt ID (e.g. G-12345)`
4. **Birth date** – Date (YYYY-MM-DD) – required
5. **Birth time** – Short text (HH:MM or `unknown`) – optional
6. **Birth place** – Short text (City, Country) – required
7. **Intention** – Long text – optional – hint: `One-line intent: what you bring to the ritual`
8. **Consent** – Yes/No – required – label: `I consent to storage of my birth data for the reading` (must be Yes)
9. **Hidden field** (optional) `campaign`
10. **Thank-you page** copy: `Thanks — your ritual will arrive by email in ~10 minutes.`

Enable Typeform email notifications for debugging if desired.

### Google Doc Template

Create a Google Doc named `Persephone_Reading_Template` with Merriweather headings, Inter body text, and an optional header image. Paste the following template, which Zapier will populate:

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

### SendGrid Transactional Email

* **Subject:** `Your Persephone Samhain Reading — {{name}}`
* **HTML body:**

```html
<p>Dear {{name}},</p>

<p>Thank you — your Persephone / Samhain reading is ready. Download your ritual PDF here:</p>
<p><a href="{{pdf_link}}">Download Persephone Reading (PDF)</a></p>

{{#if mp3_link}}
<p>Audio narration: <a href="{{mp3_link}}">Download MP3</a></p>
{{/if}}

<p>If you have any trouble, reply to this email and we’ll help.</p>
<p>— Allison Claire, Decrypt the Girl ( @decrypt_the_girl )</p>
```

Provide the plain-text fallback `Your reading is ready: {{pdf_link}}`.

### Google Sheet Ledger

Create a sheet named `DecryptTheGirl_Ledger` and import the CSV below. After import, add a `Settings` sheet to host constants.

```
Timestamp,GumroadReceipt,Name,Email,Price,StripeFee,VariableCost,FixedAlloc,TotalCost,NetProfit,CumulativeNet,Payout50%
,, , , , , , , , , ,
```

`Settings` sheet values:

* `Settings!A1 = FixedCost`
* `Settings!A2 = 200`
* `Settings!B1 = 10`
* `Settings!C1 = VariableCostFull`
* `Settings!C2 = 0.79`

Formulas for row 2 of the ledger (copy downward for future rows):

* `StripeFee (F2): =ROUND(E2*0.029 + 0.30, 2)` (use Gumroad rate `=ROUND(E2*0.085 + 0.30,2)` if applicable)
* `VariableCost (G2): =Settings!C2`
* `FixedAlloc (H2): =ROUND(Settings!A2/Settings!B1,2)`
* `TotalCost (I2): =F2 + G2 + H2`
* `NetProfit (J2): =E2 - I2`
* `CumulativeNet (K2): =IF(ROW()=2, J2, K1 + J2)`
* `Payout50% (summary cell): =IF(COUNTA(A:A)>=Settings!B1, ROUND(SUM(J2:J11)*0.5,2), "pending")`

Pre-fill formulas for as many rows as needed so Zapier appends into prepared cells.

## B. Zapier Build Recipe

Create a Zap named **Persephone Reading Fulfillment** following the steps below.

1. **Trigger – Typeform / New Entry**
   * Select the Samhain form and test with sample data.

2. **Code by Zapier (JavaScript) – Compute Sun Sign**
   * Input: `dob` → Typeform `Birth date`
   * Code:

```javascript
const dob = inputData.dob; // YYYY-MM-DD
const parts = dob.split('-');
const m = parseInt(parts[1],10);
const d = parseInt(parts[2],10);

function getSunSign(month, day){
  const signs = [
    {name:"Capricorn", start:[12,22], end:[1,19]},
    {name:"Aquarius", start:[1,20], end:[2,18]},
    {name:"Pisces", start:[2,19], end:[3,20]},
    {name:"Aries", start:[3,21], end:[4,19]},
    {name:"Taurus", start:[4,20], end:[5,20]},
    {name:"Gemini", start:[5,21], end:[6,20]},
    {name:"Cancer", start:[6,21], end:[7,22]},
    {name:"Leo", start:[7,23], end:[8,22]},
    {name:"Virgo", start:[8,23], end:[9,22]},
    {name:"Libra", start:[9,23], end:[10,22]},
    {name:"Scorpio", start:[10,23], end:[11,21]},
    {name:"Sagittarius", start:[11,22], end:[12,21]}
  ];
  for (const s of signs) {
    const [sm, sd] = s.start;
    const [em, ed] = s.end;
    if (sm <= em) {
      if ((m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em)) return s.name;
    } else {
      if ((m === sm && d >= sd) || (m === em && d <= ed) || (m > sm || m < em)) return s.name;
    }
  }
  return "Capricorn";
}

output = { sun_sign: getSunSign(m,d) };
```

3. **Formatter – Text Template**
   * Template:

```
Sun: {{steps.sun_sign}}
Birth place: {{Typeform Birth place}}
Birth time: {{Typeform Birth time}}
Intention: {{Typeform Intention}}
```

   * Output field name: `chart_summary`.

4. **OpenAI – Create Chat Completion**
   * Model: `gpt-4o-mini` (or `gpt-3.5-turbo`)
   * System prompt:

```
You are a lyrical astrological interpreter and ritual designer. Produce a Samhain / Persephone-themed natal reading that blends poetic myth with an actionable ritual. Output JSON only with keys: "title","natal","persephone_theme","ritual_steps" (array of 3), "movement_prompt","deck_card" (object with title,glyph,upright,inverted). Tone: intimate & mythic. Avoid medical claims. Use the provided "sun_sign" and "intention".
```

   * User message:

```
Name: {{Full name}}
Sun sign: {{sun_sign}}
Birth place: {{Birth place}}
Birth time: {{Birth time}}
Intention: {{Intention}}
ChartSummary: {{chart_summary}}

Return JSON only.
```

   * Temperature: 0.85, Max tokens: 900. Ensure the output is valid JSON.

5. **Code by Zapier – Parse JSON**
   * Input: `ai_output` → OpenAI response text
   * Code:

```javascript
const parsed = JSON.parse(inputData.ai_output);
return {
  title: parsed.title || "",
  natal: parsed.natal || "",
  persephone_theme: parsed.persephone_theme || "",
  ritual1: parsed.ritual_steps?.[0] || "",
  ritual2: parsed.ritual_steps?.[1] || "",
  ritual3: parsed.ritual_steps?.[2] || "",
  movement_prompt: parsed.movement_prompt || "",
  deck_title: parsed.deck_card?.title || "",
  deck_glyph: parsed.deck_card?.glyph || "",
  deck_upright: parsed.deck_card?.upright || "",
  deck_inverted: parsed.deck_card?.inverted || ""
};
```

6. **Google Docs – Create Document from Template**
   * Template: `Persephone_Reading_Template`
   * Map placeholders to parsed fields (`title`, `natal`, `persephone_theme`, etc.).

7. **Google Docs – Export Document**
   * Export the generated doc as PDF.

8. **Google Drive – Upload File** (optional if attaching directly to email)
   * Upload the PDF to a `Persephone_Readings` folder for archival.

9. **SendGrid – Send Email**
   * To: Typeform email
   * From: configured sender
   * Subject and HTML body per template above
   * Attach the PDF or include the Drive link.

10. **Google Sheets – Create Spreadsheet Row**
    * Append a new row with timestamp, receipt, name, email, price, and cost data (raw values only if sheet handles formulas).

11. **Slack – Send Channel Message**
    * Channel: `#ops`
    * Message:

```
✅ Delivered Reading
Name: {{Full name}}
Email: {{Email}}
Sun sign: {{sun_sign}}
PDF: {{pdf_link}}
Gumroad receipt: {{Gumroad receipt ID}}
```

12. **Notion – Create Database Item**
    * Database: `Deliveries`
    * Fields: name, email, PDF link, status (Delivered), sun sign, delivery timestamp, Typeform ID, price.

Add an error path that reports failures to a Slack `#ops-alerts` channel with Typeform entry details and the error payload.

## C. Slack, Notion, and Daily Digest Automation

### Slack Alerts

* Primary delivery message handled in Zapier step 11.
* Error alert template:

```
:rotating_light: PERSEPHONE DELIVERY ERROR
Typeform ID: {{typeform_id}}
Step: {{failed_step}}
Error: {{error_message}}
```

### Notion Deliveries Database

Configure properties:

| Property | Type | Notes |
| --- | --- | --- |
| Name | Title | Recipient full name |
| Email | Email | |
| Price | Number | Sale price |
| PDF Link | URL | Generated document link |
| Status | Select | `Pending`, `Delivered`, or `Error` |
| Sun Sign | Text/Select | Value from code step |
| Typeform ID | Text | For debugging |
| Delivered At | Date | Zap meta timestamp |

### Daily Digest Zap

1. **Trigger – Schedule / Every Day at 08:00**
2. **Action – Google Sheets Lookup** to compute deliveries and revenue for the prior 24 hours and fetch ledger totals.
3. **Action – Slack Message** to `#ops-daily`:

```
Daily Digest — Decrypt the Girl
New deliveries (24h): X
Revenue (24h): $Y
Deliveries pending: Z
Total net profit (so far): $NNN
First 10 sale progress: M/10
```

## D. Testing and Launch SOP

1. Submit a Typeform test entry using your own email.
2. Test each Zap step to ensure the OpenAI response is valid JSON. If prose appears, reinforce "Return JSON only."
3. Confirm the Google Doc and PDF are generated correctly.
4. Verify the SendGrid email arrives with the attachment or link.
5. Check that the Google Sheet row and Slack notification are created.
6. Launch Gumroad redirect to the Typeform, run soft tests with friends, and monitor Slack.
7. After ten paid deliveries, reconcile the ledger and execute the 50/50 payout.

## E. Example Ledger Row

| Timestamp | GumroadReceipt | Name | Email | Price | StripeFee | VariableCost | FixedAlloc | TotalCost | NetProfit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2025-10-21 19:10 | G-TEST-0001 | Allison | allison@example.com | 45 | 1.61 | 0.79 | 20 | 22.40 | 22.60 |

## F. Optional Support

If a fully mapped Zap import, finalized Google Sheet with formulas, or Notion database template is required, request "Do the Zap + Sheet now" to receive additional ready-to-import assets and a worked JSON example for testing.
