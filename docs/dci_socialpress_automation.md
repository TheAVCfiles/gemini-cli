# DCI SocialPress & Leak Response Automations

These Zapier-style blueprints coordinate social publishing, rapid incident response, and logging for the Digital Content Integrity (DCI) program. Both workflows assume the workspace already has OAuth connections to Google Drive, Buffer, Google Sheets, YouTube, Webflow, and Mailchimp.

## 1. DCI_SocialPress_Rollout

**Purpose:** Auto-publish synchronized announcement posts across LinkedIn and Twitter (X) whenever a new asset is approved for launch.

**Trigger:**
- `GoogleDrive → NewFile` scoped to folder ID `DCI_LAUNCH_SOCIALS`.

**Steps:**
1. `Buffer → CreateUpdate`
   - **Profile:** `LinkedIn`
   - **Text:** `We’re harmonizing the digital ecosystem. Read the Charter. #ContentIntegrity`
   - **Media URL:** `{{GoogleDrive.fileUrl}}`
   - **Link:** `https://thefeedgroup.org`
2. `Buffer → CreateUpdate`
   - **Profile:** `Twitter`
   - **Text:** `We’re harmonizing the digital ecosystem. #DCI #ContentWellness`
   - **Media URL:** `{{GoogleDrive.fileUrl}}`
   - **Link:** `https://thefeedgroup.org`
3. `GoogleSheets → AppendRow`
   - **Sheet ID:** `PRESS_LOG`
   - **Row payload:** `[{{now}}, "asset_published", {{GoogleDrive.fileName}}, {{GoogleDrive.fileUrl}}]`

**Operational notes:**
- The trigger fires for *any* new file in the folder. Use Google Drive naming conventions or additional Zapier filters if you only want specific asset types.
- Buffer attachments expect public URLs. Verify that the Drive file is shared appropriately (e.g., “Anyone with the link can view”) or that you use a Drive-to-public proxy.
- The Google Sheets step assumes the target sheet has headers in row 1: `timestamp`, `event`, `asset_name`, `asset_url`.

**Reference JSON:**
```json
{
  "name": "DCI_SocialPress_Rollout",
  "triggers": [
    {"app": "GoogleDrive", "event": "NewFile", "params": {"folder_id": "DCI_LAUNCH_SOCIALS"}}
  ],
  "steps": [
    {
      "app": "Buffer",
      "action": "CreateUpdate",
      "params": {
        "profile": "LinkedIn",
        "text": "We’re harmonizing the digital ecosystem. Read the Charter. #ContentIntegrity",
        "media_url": "{{GoogleDrive.fileUrl}}",
        "link": "https://thefeedgroup.org"
      }
    },
    {
      "app": "Buffer",
      "action": "CreateUpdate",
      "params": {
        "profile": "Twitter",
        "text": "We’re harmonizing the digital ecosystem. #DCI #ContentWellness",
        "media_url": "{{GoogleDrive.fileUrl}}",
        "link": "https://thefeedgroup.org"
      }
    },
    {
      "app": "GoogleSheets",
      "action": "AppendRow",
      "params": {
        "sheet_id": "PRESS_LOG",
        "row": ["{{now}}", "asset_published", "{{GoogleDrive.fileName}}", "{{GoogleDrive.fileUrl}}"]
      }
    }
  ]
}
```

## 2. DCI_Leak_Drop

**Purpose:** Escalate possible leaks by immediately flagging the site banner and emailing the internal response list when a sensitive training video appears on the corporate YouTube channel.

**Trigger:**
- `YouTube → NewVideoOnChannel`

**Filter:**
- Proceed only if `{{YouTube.title}}` contains `DCI_Training_Module_01`.

**Steps:**
1. `Webflow → UpdateCMSItem`
   - **Collection:** `banners`
   - **Fields:**
     - `title`: `Internal training module leaked`
     - `link`: `{{YouTube.url}}`
     - `active`: `true`
2. `Mailchimp → CampaignSend`
   - **Audience:** `DCI_LIST`
   - **Subject:** `Internal: DCI Module Leak`
   - **HTML:**
     ```html
     <p>We regret the breach. Our alignment processes ensure a healthy ecosystem.</p>
     <p>Watch: {{YouTube.url}}</p>
     ```

**Operational notes:**
- The Webflow step expects an existing CMS item reference ID or slug depending on the Zapier integration; map accordingly so the banner toggles “active” without creating duplicates.
- Mailchimp requires a pre-built campaign or use of the “Create campaign draft” step before `CampaignSend` if the template does not exist.
- Add a secondary notification (e.g., Slack or SMS) if executives need real-time alerts beyond the Mailchimp send.

**Reference JSON:**
```json
{
  "name": "DCI_Leak_Drop",
  "triggers": [
    {"app": "YouTube", "event": "NewVideoOnChannel"}
  ],
  "filters": [
    {"if": "{{YouTube.title}} contains 'DCI_Training_Module_01'"}
  ],
  "steps": [
    {
      "app": "Webflow",
      "action": "UpdateCMSItem",
      "params": {
        "collection": "banners",
        "fields": {
          "title": "Internal training module leaked",
          "link": "{{YouTube.url}}",
          "active": true
        }
      }
    },
    {
      "app": "Mailchimp",
      "action": "CampaignSend",
      "params": {
        "audience": "DCI_LIST",
        "subject": "Internal: DCI Module Leak",
        "html": "<p>We regret the breach. Our alignment processes ensure a healthy ecosystem.</p><p>Watch: {{YouTube.url}}</p>"
      }
    }
  ]
}
```

---

**Change management tips:**
- Use Zapier’s built-in `Test` mode with dummy files/videos before enabling the automations in production.
- Enable error notifications (Zapier task history email summaries or Slack alerts) to catch API permission expirations early.
- Document API keys and folder/channel IDs in a separate runbook so replacements can be made without editing the entire workflow.
