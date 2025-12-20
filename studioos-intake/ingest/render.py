from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

from ingest.license import sha256_file, verify_license

ROOT = Path(__file__).resolve().parents[1]
RENDERS_DIR = ROOT / "renders"


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _safe(text: str) -> str:
    return html.escape(text or "", quote=True)


def _provenance_block(node_path: Path, lic: dict) -> dict:
    """
    Compute a stable provenance payload we can embed in HTML+PDF.
    """
    node_hash = sha256_file(node_path)

    return {
        "license_id": lic["license_id"],
        "issued_at": lic["issued_at"],
        "issuer_name": lic["issuer"]["name"],
        "issuer_contact": lic["issuer"]["contact"],
        "license_hash_sha256": lic["audit"]["license_hash_sha256"],
        "signature": lic["audit"]["signature"],
        "node_hash_sha256": node_hash,
        "node_path": str(node_path),
        "artifact_id": lic["node"]["artifact_id"],
        "rights": lic["grant"]["rights"],
        "channels": lic["grant"]["channels"],
        "term": lic["grant"]["term"],
        "exclusivity": lic["grant"]["exclusivity"],
    }


def render_html(node: dict, prov: dict) -> str:
    """
    Minimal, luxe-ish, deterministic HTML with embedded provenance footer.
    """
    title = node.get("title") or node.get("artifact_id") or prov.get("artifact_id") or "System Node"
    summary = node.get("summary") or node.get("surface") or ""
    cipher = node.get("cipher") or ""
    echo = node.get("echo") or ""
    tags = node.get("tags") or []
    tags_str = ", ".join(tags) if isinstance(tags, list) else str(tags)

    prov_json = json.dumps({"provenance": prov}, indent=2, ensure_ascii=False)

    return f"""<!doctype html>
<html lang=\"en\">
<head>
<meta charset=\"utf-8\" />
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
<title>{_safe(title)}</title>
<style>
:root {{
  --noir:#050509;
  --ivory:#F7F3EE;
  --ink:#151821;
  --mauve:#C3AEC9;
  --rose:#E7C2C0;
  --gold:#D8B989;
  --muted: rgba(247,243,238,.70);
  --card: rgba(255,255,255,.05);
  --border: rgba(255,255,255,.10);
  --radius: 18px;
}}
html,body{{height:100%;}}
body{{
  margin:0;
  background: radial-gradient(1200px 600px at 20% 10%, rgba(195,174,201,.16), transparent 55%),
              radial-gradient(900px 500px at 80% 20%, rgba(216,185,137,.10), transparent 55%),
              var(--noir);
  color:var(--ivory);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  letter-spacing:.01em;
}}
.wrap{{max-width:980px;margin:0 auto;padding:48px 22px;}}
.card{{
  background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  border:1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  box-shadow: inset 0 0 28px rgba(231,194,192,.06);
}}
.kicker{{
  font-size:11px; letter-spacing:.28em; text-transform:uppercase;
  color: rgba(216,185,137,.85);
  margin-bottom:10px;
}}
h1{{margin:0;font-size:34px;line-height:1.08;}}
.meta{{margin-top:10px;color:var(--muted);font-size:13px;}}
.grid{{display:grid;grid-template-columns:1fr;gap:14px;margin-top:18px;}}
.block{{
  background: rgba(0,0,0,.18);
  border:1px solid rgba(255,255,255,.08);
  border-radius:14px;
  padding:14px 16px;
}}
.block .label{{
  font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(247,243,238,.55);
  margin-bottom:8px;
}}
.block .text{{font-size:14px;line-height:1.55;color:rgba(247,243,238,.82);white-space:pre-wrap;}}
.footer{{
  margin-top:20px;
  font-size:11px;
  color: rgba(247,243,238,.60);
  border-top:1px solid rgba(255,255,255,.10);
  padding-top:14px;
  display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;
}}
.badge{{
  display:inline-block;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(216,185,137,.40);
  color: rgba(216,185,137,.95);
}}
code{{color:#a5b4fc;}}
</style>
</head>
<body>
<div class=\"wrap\">
  <div class=\"card\">
    <div class=\"kicker\">Licensed Node Render</div>
    <h1>{_safe(title)}</h1>
    <div class=\"meta\">
      <span class=\"badge\">{_safe(prov[\"term\"])} · {_safe(prov[\"exclusivity\"])}</span>
      &nbsp;&nbsp;Rights: {_safe(", ".join(prov[\"rights\"]))} · Channels: {_safe(", ".join(prov[\"channels\"]))}
      <br/>
      Tags: {_safe(tags_str)}
    </div>

    <div class=\"grid\">
      <div class=\"block\">
        <div class=\"label\">Surface</div>
        <div class=\"text\">{_safe(summary)}</div>
      </div>
      <div class=\"block\">
        <div class=\"label\">Cipher</div>
        <div class=\"text\">{_safe(cipher)}</div>
      </div>
      <div class=\"block\">
        <div class=\"label\">Echo</div>
        <div class=\"text\">{_safe(echo)}</div>
      </div>
    </div>

    <div class=\"footer\">
      <div>
        <div><b>License</b>: <code>{_safe(prov[\"license_id\"])}</code></div>
        <div><b>Node Hash</b>: <code>{_safe(prov[\"node_hash_sha256\"])}</code></div>
      </div>
      <div>
        <div><b>Issuer</b>: {_safe(prov[\"issuer_name\"])} ({_safe(prov[\"issuer_contact\"])})</div>
        <div><b>Issued</b>: {_safe(prov[\"issued_at\"])}</div>
      </div>
    </div>
  </div>

  <script type=\"application/json\" id=\"provenance\">
{prov_json}
  </script>
</div>
</body>
</html>
"""


def render_pdf(node: dict, prov: dict, out_path: Path) -> None:
    """
    Deterministic PDF via reportlab (installed). No fonts required.
    """
    from reportlab.lib.pagesizes import LETTER
    from reportlab.pdfgen import canvas

    title = node.get("title") or node.get("artifact_id") or prov.get("artifact_id") or "System Node"
    surface = node.get("summary") or node.get("surface") or ""
    cipher = node.get("cipher") or ""
    echo_txt = node.get("echo") or ""

    c = canvas.Canvas(str(out_path), pagesize=LETTER)
    width, height = LETTER

    left = 54
    top = height - 54
    line = 14

    def draw_wrapped(text: str, x: int, y: int, max_chars: int = 95) -> int:
        for para in (text or "").splitlines() or [""]:
            remainder = para
            while len(remainder) > max_chars:
                chunk = remainder[:max_chars]
                c.drawString(x, y, chunk)
                y -= line
                remainder = remainder[max_chars:]
            c.drawString(x, y, remainder)
            y -= line
        return y

    c.setFont("Helvetica-Bold", 18)
    c.drawString(left, top, title)

    c.setFont("Helvetica", 10)
    c.drawString(
        left,
        top - 22,
        f"Licensed Node Render · Term: {prov['term']} · Exclusivity: {prov['exclusivity']}",
    )
    c.drawString(
        left,
        top - 36,
        f"Rights: {', '.join(prov['rights'])} · Channels: {', '.join(prov['channels'])}",
    )

    y = top - 64

    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, "Surface")
    y -= 18
    c.setFont("Helvetica", 10)
    y = draw_wrapped(surface, left, y)

    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, "Cipher")
    y -= 18
    c.setFont("Helvetica", 10)
    y = draw_wrapped(cipher, left, y)

    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, "Echo")
    y -= 18
    c.setFont("Helvetica", 10)
    y = draw_wrapped(echo_txt, left, y)

    c.setFont("Helvetica", 8)
    footer_y = 42
    c.line(left, footer_y + 18, width - left, footer_y + 18)
    c.drawString(left, footer_y + 6, f"LICENSE_ID: {prov['license_id']}")
    c.drawString(left + 220, footer_y + 6, f"NODE_HASH_SHA256: {prov['node_hash_sha256']}")
    c.drawString(
        left,
        footer_y - 6,
        f"ISSUER: {prov['issuer_name']} · {prov['issuer_contact']} · ISSUED_AT: {prov['issued_at']}",
    )
    c.showPage()
    c.save()


def main() -> None:
    ap = argparse.ArgumentParser(
        prog="render",
        description="Render HTML + PDF from (node + license), with provenance footer.",
    )
    ap.add_argument("node_path", help="Path to node JSON (output/nodes/*.json)")
    ap.add_argument("license_path", help="Path to license JSON (licenses/*.json)")
    ap.add_argument("--outbase", default="", help="Optional base name for outputs (no extension).")
    args = ap.parse_args()

    node_path = Path(args.node_path).resolve()
    license_path = Path(args.license_path).resolve()

    if not verify_license(license_path):
        raise SystemExit("✖ License verification FAILED. Render refused.")

    node = _read_json(node_path)
    lic = _read_json(license_path)

    prov = _provenance_block(node_path, lic)

    RENDERS_DIR.mkdir(parents=True, exist_ok=True)
    base = args.outbase.strip() or node_path.stem
    html_out = (RENDERS_DIR / f"{base}.html").resolve()
    pdf_out = (RENDERS_DIR / f"{base}.pdf").resolve()

    html_out.write_text(render_html(node, prov), encoding="utf-8")
    render_pdf(node, prov, pdf_out)

    print(f"✔ HTML: {html_out}")
    print(f"✔ PDF : {pdf_out}")


if __name__ == "__main__":
    main()
