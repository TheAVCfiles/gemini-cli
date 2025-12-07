# Stageport bundle — JPEGs to PDF

This example recreates the Stageport still-image bundle using ReportLab. Place
the JPEGs in `docs/examples/stageport-bundle-images/` (filenames match the
original bundle) and run the helper script to produce a single PDF.

## Prerequisites

- Python 3.10+
- The `reportlab` package (`pip install reportlab`)

## Usage

```bash
cd docs/examples
python stageport_bundle_pdf.py
```

By default the script looks for the named JPEGs inside
`stageport-bundle-images/`, scales each one to fit within a letter page, and
writes `stageport_bundle.pdf` next to the script. Missing images are skipped
with a console notice; if every file is missing the script raises a helpful
error.

You can edit `DEFAULT_IMAGE_NAMES` in `stageport_bundle_pdf.py` or point
`image_dir` to a different folder if your bundle uses new filenames.
