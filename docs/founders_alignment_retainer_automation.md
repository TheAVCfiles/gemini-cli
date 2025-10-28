# Founders Alignment Retainer Offer Automation

This playbook delivers a 24-hour follow-up email inviting qualified founders to reserve a monthly retainer slot after they receive a "Launch Alignment Report." It assumes the team already sends the initial report manually from Gmail with a Stripe Checkout link available via the CRM or finance stack.

## A. Automation Snapshot

- **Trigger App:** Gmail — `Attachment Sent` (requires a paid Zapier plan or equivalent automation platform scope).
- **Trigger Filter:** Subject line contains `Launch Alignment Report` to ensure the automation only runs for deliverables, not day-to-day correspondence.
- **Delay:** Wait for 24 hours to allow the founder to read the report before nudging them about the retainer.
- **Follow-up Email:** Gmail — Send a templated message that includes the personalized Stripe Checkout link.

### Required Data Points

| Data | Source | Notes |
| --- | --- | --- |
| Recipient email (`{{Gmail.to}}`) | Gmail trigger | Comes from the original report delivery |
| Stripe checkout link (`{{Stripe.checkout_link}}`) | CRM/ops tool | Add as a custom field on the contact or pull from the original email draft |
| Sender alias | Gmail action | Match the consultant's usual sending identity |

## B. Gmail Template

Configure the Gmail action with HTML mode enabled. Recommended subject and body:

- **Subject:** `Continue Alignment — Reserve Your Retainer Slot`
- **HTML Body:**

```html
<p>Based on our session, you qualify for a monthly retainer. Secure your access → <a href="{{Stripe.checkout_link}}">Enroll</a>.</p>
```

Adjust the sender name and signature inside the Gmail action if needed. The template is intentionally concise; you can expand it with call scheduling links or additional social proof once the automation is tested.

## C. Step-by-Step Build (Zapier Example)

1. **Trigger — Gmail: Attachment Sent**
   - Account: connect the shared consulting Gmail inbox.
   - Label: optional; use if the report emails are tagged (e.g., `LaunchAlignment/Reports`).

2. **Filter — Only continue if Subject contains `Launch Alignment Report`**
   - Condition: `Subject (Text)` → `Contains` → `Launch Alignment Report`.
   - Purpose: blocks false positives when attachments are sent for other reasons.

3. **Delay — Wait for 24 hours**
   - Action: Delay for a set time → `24h`.
   - Prevents immediate follow-ups and gives founders space to digest the report.

4. **Action — Gmail: Send Email**
   - To: `{{Gmail.To}}` (from the trigger step).
   - Subject: `Continue Alignment — Reserve Your Retainer Slot`.
   - Body Type: HTML.
   - Body: paste the snippet from section B. Insert the Stripe Checkout URL merge field.
   - From Name / Reply-To: match the primary consultant.
   - Attachments: none.

### Testing Checklist

- Send a test "Launch Alignment Report" email with an attachment to yourself to fire the trigger.
- Confirm the filter passes when the subject matches exactly and fails when it does not.
- Verify the delay shows the expected execution time in Zapier's task history.
- Inspect the follow-up email for formatting, correct Stripe link, and sender identity.

## D. Operational Notes

- **Stripe Checkout URL:** If the link is not embedded in the originating Gmail message, store it in a CRM field and fetch it via a preceding lookup step (e.g., Airtable, HubSpot). Map the lookup output to the Gmail action instead of relying solely on trigger data.
- **Opt-Out Handling:** Add a secondary filter to bypass the email when the original thread contains phrases like "no retainer" or when a corresponding CRM status equals `Closed - Not Interested`.
- **Scaling:** Once validated, duplicate the automation for other report types by updating the subject filter and email copy.
- **Audit:** Review Zapier task history weekly to ensure the delay queue is healthy and founders receive follow-ups as expected.

