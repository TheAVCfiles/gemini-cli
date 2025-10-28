# DCI Wellness Intake → CRM Sync

This guide captures the Make (formerly Integromat) scenario that turns inbound wellness check submissions into CRM records while maintaining audience tagging inside Mailchimp. Use it when you need to bridge the DCI wellness microsite with the central CRM workspace in under five minutes.

## Scenario summary

- **Scenario name:** `DCI_Wellness_To_CRM`
- **Primary objective:** ensure every completed wellness survey is tagged for lifecycle email follow-up and logged in the DCI Notion CRM.
- **Automation surface:** Make scenario receiving webhooks, pushing to Mailchimp, and logging to Notion.

## Trigger configuration

1. In Make, create a new scenario and add the **Webhook → Custom webhook** module.
2. Name the webhook `DCI Wellness Intake` and copy the unique URL that Make generates.
3. Replace `YOUR_MAKE_WEBHOOK_URL` in the application code or form handler so that completed wellness check submissions `POST` to the Make webhook using the following JSON payload:

```json
{
  "email": "participant@example.com",
  "score": 8,
  "handle": "@participant"
}
```

> The webhook payload must provide `email`, `score`, and `handle`. Additional fields can be ignored or mapped later.

## Step 1 — Mailchimp audience tag

Use the **Mailchimp → Add or update subscriber** module directly after the webhook.

- **Audience/List ID:** `DCI_LIST`
- **Subscriber email:** map to `{{Webhook.email}}`
- **Tags to add:** include the literal tag `WellnessCheck` (the module accepts an array, so a single-element array is sufficient).

This step both creates net-new records and updates existing subscribers, ensuring the `WellnessCheck` tag is set for segmentation rules.

## Step 2 — Notion CRM logging

Append a **Notion → Create a database item** module to capture the contact in the CRM database.

- **Database ID:** `CRM_DCI`
- **Properties:**
  - **Email (email property):** `{{Webhook.email}}`
  - **EchoRisk (number or select property):** `{{Webhook.score}}`
  - **Handle (text property):** `{{Webhook.handle}}`
  - **Source (select or text property):** constant `WellnessApp`

> Ensure the Notion integration used in Make has at least `insert` permissions on the `CRM_DCI` database. If `EchoRisk` is a select property, pre-create the allowable values (e.g., `0–3`, `4–7`, `8–10`) so the scenario can set the correct option.

## Complete Make blueprint

For reference, the minimal JSON blueprint of the scenario is shown below. Import it through **Scenario → Import blueprint** if you prefer bootstrapping the modules rather than configuring them manually.

```json
{
  "name": "DCI_Wellness_To_CRM",
  "triggers": [
    {
      "app": "Webhook",
      "event": "CatchHook",
      "params": {
        "url": "YOUR_MAKE_WEBHOOK_URL"
      }
    }
  ],
  "steps": [
    {
      "app": "Mailchimp",
      "action": "AddOrUpdateSubscriber",
      "params": {
        "list_id": "DCI_LIST",
        "email": "{{Webhook.email}}",
        "tags": [
          "WellnessCheck"
        ]
      }
    },
    {
      "app": "Notion",
      "action": "CreateDatabaseItem",
      "params": {
        "db_id": "CRM_DCI",
        "fields": {
          "Email": "{{Webhook.email}}",
          "EchoRisk": "{{Webhook.score}}",
          "Handle": "{{Webhook.handle}}",
          "Source": "WellnessApp"
        }
      }
    }
  ]
}
```

## Testing checklist

1. Send a test payload with a unique email via **Webhook → Redetermine data structure** or an HTTP client like `curl`.
2. Confirm the contact appears in Mailchimp with the `WellnessCheck` tag applied.
3. Verify a new page exists in the Notion `CRM_DCI` database with all mapped fields populated.
4. Enable the scenario and set error notifications so operations receives alerts if either downstream API returns a non-2xx response.

Once the validation passes, flip the scenario to **ON** to begin processing real submissions from the wellness app.
