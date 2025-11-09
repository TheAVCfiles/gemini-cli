"""Generate offline assets for the "Decrypt the Future — Late Edition" preview."""

from __future__ import annotations

import argparse
from pathlib import Path
from textwrap import wrap

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

TEMPLATE_FILENAME = "decrypt-the-future-late-edition.html"
DEFAULT_PDF_NAME = "decrypt-the-future-late-edition.pdf"

TICKER_ITEMS = ["☉SOL: +1.8", "♄SAT: −0.3", "☿MER: volatile", "♃JUP: bullish"]
HOROSCOPE_LINES = [
    "♈ Aries — The market runs on your caffeine today.",
    "♉ Taurus — Invest in pleasure, dividends follow.",
    "♊ Gemini — Trade two truths for one good rumor.",
    "♋ Cancer — Emotional liquidity surges; ride the wave.",
    "♌ Leo — Your spotlight stock is peaking.",
    "♍ Virgo — Audit your dreams before they file themselves.",
    "♎ Libra — Balance sheets and heartbeats align.",
    "♏ Scorpio — Mergers of power and passion imminent.",
    "♐ Sagittarius — Foreign investments, cosmic returns.",
    "♑ Capricorn — Structure your stars for success.",
    "♒ Aquarius — Innovation spikes, volatility follows.",
    "♓ Pisces — Boundaries blur; intuition inflates.",
]

DEFAULT_HTML = """<!DOCTYPE html>
<html lang=\"en\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>Decrypt the Future — The Late Edition</title>
    <style>
      body {
        font-family: 'Playfair Display', serif;
        background: #fdfaf4;
        color: #222;
        margin: 0;
        padding: 0;
      }
      header {
        text-align: center;
        border-bottom: 2px solid #000;
        padding: 1em;
      }
      .ticker {
        background: #000;
        color: #fff;
        font-family: monospace;
        padding: 0.5em;
        overflow: hidden;
        white-space: nowrap;
      }
      .ticker span {
        display: inline-block;
        padding-right: 3em;
      }
      article {
        max-width: 800px;
        margin: auto;
        padding: 2em;
        line-height: 1.6;
      }
      .ad {
        background: #f5efe0;
        border: 1px solid #ccc;
        padding: 1em;
        margin: 2em auto;
        width: 80%;
        text-align: center;
      }
      .horoscope {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
      }
      .sign {
        width: 25%;
        box-sizing: border-box;
        padding: 0.5em;
        text-align: center;
        border-top: 1px solid #ccc;
      }
      .print-button {
        display: block;
        margin: 2em auto;
        padding: 1em 2em;
        background: #000;
        color: #fff;
        border: none;
        cursor: pointer;
        font-family: monospace;
      }
      @media (max-width: 720px) {
        .sign {
          width: 50%;
        }
      }
      @media (max-width: 480px) {
        .sign {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Decrypt the Future — The Late Edition</h1>
      <p><em>Astrological intelligence for unpredictable markets.</em></p>
    </header>
    <div class=\"ticker\">
      <span>☉SOL: +1.8</span><span>♄SAT: −0.3</span><span>☿MER: volatile</span
      ><span>♃JUP: bullish</span>
    </div>
    <article>
      <h2>Zeus and Poseidon Argue Over the Electric Bill</h2>
      <p>
        Uranus sparks volatility in Aquarian tech sectors as Jupiter demands another round of expansion.
        Poseidon, embodying Neptune, blames illusions and liquidity tides. The celestial markets shiver.
      </p>
    </article>
    <div class=\"ad\">
      <h3>Constellations, Capital &amp; Café ☕️</h3>
      <p>
        Today's special: The Mars Macaron — baked under ambition and served with a shot of bold direction.
      </p>
      <button class=\"print-button\" onclick=\"window.print()\">🗞️ Print Edition</button>
    </div>
    <section class=\"horoscope\">
      <div class=\"sign\">♈ Aries — The market runs on your caffeine today.</div>
      <div class=\"sign\">♉ Taurus — Invest in pleasure, dividends follow.</div>
      <div class=\"sign\">♊ Gemini — Trade two truths for one good rumor.</div>
      <div class=\"sign\">♋ Cancer — Emotional liquidity surges; ride the wave.</div>
      <div class=\"sign\">♌ Leo — Your spotlight stock is peaking.</div>
      <div class=\"sign\">♍ Virgo — Audit your dreams before they file themselves.</div>
      <div class=\"sign\">♎ Libra — Balance sheets and heartbeats align.</div>
      <div class=\"sign\">♏ Scorpio — Mergers of power and passion imminent.</div>
      <div class=\"sign\">♐ Sagittarius — Foreign investments, cosmic returns.</div>
      <div class=\"sign\">♑ Capricorn — Structure your stars for success.</div>
      <div class=\"sign\">♒ Aquarius — Innovation spikes, volatility follows.</div>
      <div class=\"sign\">♓ Pisces — Boundaries blur; intuition inflates.</div>
    </section>
  </body>
</html>
"""


ARTICLE_TITLE = "Zeus and Poseidon Argue Over the Electric Bill"
ARTICLE_BODY = (
    "Uranus sparks volatility in Aquarian tech sectors as Jupiter demands another round of expansion. "
    "Poseidon, embodying Neptune, blames illusions and liquidity tides. The celestial markets shiver."
)
AD_TITLE = "Constellations, Capital & Café ☕️"
AD_BODY = (
    "Today's special: The Mars Macaron — baked under ambition and served with a shot of bold direction."
)


def load_template() -> str:
    """Return the Late Edition HTML template, preferring the committed preview."""

    preview_path = Path(__file__).resolve().parent.parent / "previews" / TEMPLATE_FILENAME
    if preview_path.exists():
        return preview_path.read_text(encoding="utf-8")
    return DEFAULT_HTML


def write_html(destination: Path, html: str) -> Path:
    destination.write_text(html, encoding="utf-8")
    return destination


def write_pdf(destination: Path) -> Path:
    page = canvas.Canvas(str(destination), pagesize=letter)
    width, height = letter

    # Background wash
    page.setFillColorRGB(0.99, 0.98, 0.96)
    page.rect(0, 0, width, height, fill=1, stroke=0)

    # Header
    page.setFillColor(colors.black)
    top = height - 0.9 * inch
    page.setFont("Helvetica-Bold", 20)
    page.drawCentredString(width / 2, top, "Decrypt the Future — The Late Edition")
    top -= 0.35 * inch
    page.setFont("Helvetica-Oblique", 12)
    page.drawCentredString(
        width / 2,
        top,
        "Astrological intelligence for unpredictable markets.",
    )

    # Ticker bar
    top -= 0.55 * inch
    ticker_height = 0.45 * inch
    left_margin = 0.75 * inch
    page.setFillColor(colors.black)
    page.roundRect(
        left_margin,
        top - ticker_height + 0.05 * inch,
        width - 2 * left_margin,
        ticker_height,
        6,
        fill=1,
        stroke=0,
    )
    page.setFillColor(colors.whitesmoke)
    page.setFont("Courier-Bold", 11)
    ticker_x = left_margin + 0.25 * inch
    ticker_y = top - 0.1 * inch
    for item in TICKER_ITEMS:
        page.drawString(ticker_x, ticker_y, item)
        ticker_x += page.stringWidth(item, "Courier-Bold", 11) + 30

    # Article
    top -= 0.75 * inch
    page.setFillColor(colors.black)
    page.setFont("Helvetica-Bold", 16)
    page.drawString(left_margin, top, ARTICLE_TITLE)
    top -= 0.3 * inch
    page.setFont("Helvetica", 12)
    for line in wrap(ARTICLE_BODY, 90):
        page.drawString(left_margin, top, line)
        top -= 14

    # Ad block
    top -= 0.35 * inch
    ad_height = 1.6 * inch
    page.setFillColorRGB(0.96, 0.94, 0.88)
    page.roundRect(
        left_margin,
        top - ad_height + 0.2 * inch,
        width - 2 * left_margin,
        ad_height,
        12,
        fill=1,
        stroke=1,
    )
    page.setFillColor(colors.black)
    page.setFont("Helvetica-Bold", 13)
    page.drawCentredString(width / 2, top + 0.9 * inch, AD_TITLE)
    page.setFont("Helvetica", 11)
    for idx, line in enumerate(wrap(AD_BODY, 70)):
        page.drawCentredString(width / 2, top + 0.65 * inch - idx * 14, line)
    page.setFont("Courier-Bold", 11)
    page.drawCentredString(width / 2, top + 0.2 * inch, "🗞️ Print Edition")

    # Horoscope grid
    top -= ad_height + 0.5 * inch
    page.setFont("Helvetica-Bold", 12)
    page.drawString(left_margin, top, "Horoscope")
    top -= 0.25 * inch
    page.setFont("Helvetica", 10)
    column_width = (width - 2 * left_margin) / 3
    row_height = 16
    for index, line in enumerate(HOROSCOPE_LINES):
        row = index // 3
        col = index % 3
        x = left_margin + col * column_width
        y = top - row * row_height
        page.drawString(x, y, line)

    page.showPage()
    page.save()
    return destination


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path.cwd(),
        help="Directory where the HTML and PDF previews should be written.",
    )
    parser.add_argument(
        "--html-name",
        type=str,
        default=TEMPLATE_FILENAME,
        help="Filename to use for the generated HTML preview.",
    )
    parser.add_argument(
        "--pdf-name",
        type=str,
        default=DEFAULT_PDF_NAME,
        help="Filename to use for the generated PDF preview.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    html_content = load_template()
    html_path = write_html(output_dir / args.html_name, html_content)
    pdf_path = write_pdf(output_dir / args.pdf_name)

    print(f"HTML preview written to {html_path}")
    print(f"PDF preview written to {pdf_path}")


if __name__ == "__main__":
    main()
