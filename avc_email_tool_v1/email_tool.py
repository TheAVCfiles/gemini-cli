import csv
from pathlib import Path

CAMPAIGNS_CSV = Path("campaigns.csv")
CURRENT_ID = "2025-12-19-weekly"  # change per send


def load_campaign(campaign_id: str):
    with CAMPAIGNS_CSV.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("id") == campaign_id:
                return row
    raise ValueError(f"Campaign id {campaign_id} not found in {CAMPAIGNS_CSV}")


def build_plaintext(c):
    bullets = [
        f"• {(c.get('bullet_1', '') or '').strip()}",
        f"• {(c.get('bullet_2', '') or '').strip()}",
        f"• {(c.get('bullet_3', '') or '').strip()}",
    ]
    cta_url = ((c.get("cta_url") or "")).strip()
    cta_block = f"\nMore here: {cta_url}\n" if cta_url else ""

    body = f"""Hi you,

{bullets[0]}

{bullets[1]}

{bullets[2]}
{cta_block}
— AVC
"""
    return body.strip() + "\n"


def build_html(c):
    subject = ((c.get("subject") or "")).strip()
    bullet_1 = ((c.get("bullet_1") or "")).strip()
    bullet_2 = ((c.get("bullet_2") or "")).strip()
    bullet_3 = ((c.get("bullet_3") or "")).strip()

    cta_url = ((c.get("cta_url") or "")).strip()
    cta_label = ((c.get("cta_label") or "Learn more")).strip()
    cta_html = f'<p><a href="{cta_url}">{cta_label}</a></p>' if cta_url else ""

    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
</head>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111;">
  <p>Hi you,</p>

  <ul>
    <li>{bullet_1}</li>
    <li>{bullet_2}</li>
    <li>{bullet_3}</li>
  </ul>

  {cta_html}

  <p>— AVC</p>
</body>
</html>
"""
    return html


if __name__ == "__main__":
    campaign = load_campaign(CURRENT_ID)

    subject = (campaign.get("subject") or "").strip()
    preheader = (campaign.get("preheader") or "").strip()

    txt = build_plaintext(campaign)
    html = build_html(campaign)

    Path("out_subject.txt").write_text(subject + "\n", encoding="utf-8")
    Path("out_preheader.txt").write_text(preheader + "\n", encoding="utf-8")
    Path("out_body.txt").write_text(txt, encoding="utf-8")
    Path("out_body.html").write_text(html, encoding="utf-8")

    print("Written: out_subject.txt, out_preheader.txt, out_body.txt, out_body.html")
