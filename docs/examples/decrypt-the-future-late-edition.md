# Decrypt the Future — Late Edition generator

`docs/examples/decrypt_the_future_late_edition.py` bundles an HTML template and a
ReportLab layout so you can ship a self-contained "Late Edition" preview.

> **Dependency:** install ReportLab first — `pip install reportlab`

```bash
python docs/examples/decrypt_the_future_late_edition.py --output-dir build/late-edition
```

The script will:

- Copy the committed HTML preview (or fall back to the embedded template) into
  your chosen output directory.
- Render a matching PDF handbill with ReportLab—complete with ticker tape,
  featured story, café advertisement, and horoscope grid.
- Confirm the paths for both deliverables in the terminal output.

Point the generated assets at a kiosk, print station, or offline bundle to give
clients a tactile "Decrypt the Future" touchpoint without reaching for a
browser.
