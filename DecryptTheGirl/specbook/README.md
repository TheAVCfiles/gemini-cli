# Specbook & Glitch Deck Generator

This folder packages a Python script that recreates the Specbook PDF workflow and
print-ready Glitch Deck assets referenced in the AVC Systems Studio notes.  The
script mirrors the behaviour of the original prototype while adding a small
configuration layer so you can tweak links, assets, copy, and the card catalogue
without editing code.

## Requirements

```bash
pip install reportlab pillow
# Optional: pip install pyyaml   # enable YAML configuration files
```

The generator will attempt to register a nicer typeface if `font_path` is
provided in the configuration (or if the system has DejaVu Sans installed).
Otherwise it falls back to Helvetica.

## Quickstart

```bash
cd DecryptTheGirl/specbook
python build_specbook.py
```

Running the script with no arguments writes three files to
`output_specbook/`:

- `Specbook_Vol_II_Genesis_and_MythOS_Birthchart_AVC_Systems_Studio.pdf`
- `Glitch_Deck_Printable_3x3.pdf`
- `Glitch_Deck_SingleCardPages.pdf`

The defaults match the narrative supplied in the brief: a seven-section
Specbook with a true table of contents, Gumroad and Calendly links, an optional
birthchart spread, and signature page.  The deck generator produces both the
3×3 print sheet and a single-card-per-page edition with glyph placeholders.

## Customisation

Pass a JSON or YAML configuration file with `--config` to override the defaults.
An example stub is included below – copy it to `config.yaml` and adjust fields
as needed.  Relative paths are resolved against the configuration file.

```yaml
output_dir: output_specbook
specbook_filename: Specbook_Vol_II_Genesis_and_MythOS_Birthchart_AVC_Systems_Studio.pdf
deck_sheet_filename: Glitch_Deck_Printable_3x3.pdf
deck_single_filename: Glitch_Deck_SingleCardPages.pdf
gumroad_url: https://gumroad.com/l/yourproduct
calendly_url: https://calendly.com/your-calendar-link
birthchart_path: ./assets/birthchart.png
signature_path: ./assets/signature.png
font_path: ./assets/Inter-Regular.ttf
author: Allison Van Cura
signature_name: Allison Van Cura
sections:
  - title: 1. The Signal and The Static
    body: >-
      Origin narrative and system voice...
  - title: 2. MythOS Architecture
    body: |
      High-level OS mapping: Surface / Cipher / Echo.
      Node types, boot sequence, and the Decryption Engine.
deck_cards:
  - Card 1: Glyph 1
  - Card 2: Glyph 2
deck_text:
  - Short ritual instruction or poetic line here.
  - Another instruction line.
```

You can also override individual assets from the command line:

```bash
python build_specbook.py --config config.yaml \
  --birthchart ~/Pictures/aurora_chart.png \
  --signature ~/Desktop/autograph.png \
  --font ~/Library/Fonts/Inter-Regular.ttf
```

## Output

After the run completes the script prints the generated file locations.  The
PDFs include headers/footers, watermark, clickable links, and automatically
populated TOC entries.
