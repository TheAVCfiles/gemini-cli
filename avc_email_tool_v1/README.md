# AVC Email Tool v1 (Provider-agnostic)

A tiny “compose kit” that turns one row in `campaigns.csv` into:
- `out_subject.txt`
- `out_preheader.txt`
- `out_body.txt` (plain text)
- `out_body.html` (HTML)

You paste those into ConvertKit / MailerLite / etc. to send.

## Files
- `campaigns.csv` — your campaign sheet export
- `email_tool.py` — the composer
- `templates/` — reference templates

## Quickstart
1) Edit `campaigns.csv` (or export from Sheets/Notion into this exact structure).
2) In `email_tool.py`, set `CURRENT_ID` to your campaign row id.
3) Run:
```bash
python3 email_tool.py
```
4) Copy/paste outputs into your ESP:
- Subject: `out_subject.txt`
- Preheader: `out_preheader.txt`
- Plain text: `out_body.txt`
- HTML: `out_body.html`

## CSV columns
id,date,subject,preheader,bullet_1,bullet_2,bullet_3,cta_label,cta_url
