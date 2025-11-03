# Allison Van Cura — Glossary of Works

The glossary collects the key programs, experiences, and vocabulary that define Allison Van Cura's practice.  The canonical version of the artifact is a styled PDF that can be regenerated using the `generate_avc_glossary_pdf.py` helper script.

## Generating the PDF

```bash
python scripts/generate_avc_glossary_pdf.py
```

When run without flags the helper streams a stage-by-stage preview in the terminal before writing the PDF.  The framing mirrors a rehearsal session so collaborators can watch each section “perform” before it is finalized.

The command writes `docs/AllisonVanCura_Glossary_of_Works.pdf` by default.  Provide the `--output` flag to save the file elsewhere.

```bash
python scripts/generate_avc_glossary_pdf.py --output /tmp/avc-glossary.pdf
```

Use `--preview-only` to rehearse the glossary without rendering the PDF, or `--no-preview` for a silent render suitable for automation.

```bash
python scripts/generate_avc_glossary_pdf.py --preview-only
```

```bash
python scripts/generate_avc_glossary_pdf.py --output /tmp/avc-glossary.pdf --no-preview
```

The script requires the [ReportLab](https://www.reportlab.com/dev/docs/) package.  Install it with `pip install reportlab` if it is not already available in your Python environment.

## Contents

The glossary highlights:

- **Core entities** such as AVC Systems Studios, Decrypt the Girl, and Intuition Labs.
- **Curriculum and creative frameworks** including the APop Allstars curriculum pack and Kinetic Cipher Log.
- **Narrative texts and strategy artifacts** like *Decrypt the American Dream* and the NYC metro commerce blueprint.
- **Interactive experiences** across web, game, and AI-assisted platforms.
- **Philosophical vocabulary**—terms like Myth-Tech, Legacy Systems, and the Law of 3 that anchor the creative worldview.

Run the generator whenever updates are made to keep the PDF synchronized with the latest language.
