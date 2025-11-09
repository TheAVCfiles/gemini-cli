# DeCrypt The Girl residency / funding submission package

The `scripts/build_residency_package.py` helper produces a reproducible
funding-ready deliverable bundle. It assembles a one-page PDF summary tailored to
residency, partnership, and capital opportunities and zips it alongside the
supporting artefacts you provide.

## Requirements

- Python 3.10+
- [`reportlab`](https://www.reportlab.com/dev/docs/reportlab-userguide.pdf)

Install the dependency into your environment if it is not already available:

```bash
pip install reportlab
```

## Usage

```bash
python scripts/build_residency_package.py \
  --assets-dir DecryptTheGirl \
  --output-dir dist/decrypt_the_girl
```

The command will generate:

- `Residency_Submission_Summary.pdf` – a one-page synopsis that highlights
  alignment, traction, and business-readiness factors.
- `Residency_Submission_Manifest.json` – metadata describing what was included
  in the package and any missing assets.
- `DeCrypt_The_Girl_Residency_Submission_Pack_v1.zip` – a ready-to-share archive
  that bundles the summary, manifest, and all supporting artefacts.

By default, the script looks for the curated deliverables listed below inside the
`DecryptTheGirl/` directory:

- `PROJECT_PORTFOLIO.pdf`
- `PRESS_&_CITATION_SHEET.pdf`
- `C4 Caesarian Shift 2.pdf`
- `Ballet Cipher Theory.pdf`
- `Decrypt_The_Girl_Interactive_Reader 8.html`
- `README.md`
- `requirements.txt`
- `conclusion.html`

Files that are not present are simply reported in the manifest – the ZIP archive
is still produced with the available artefacts.

### Customising the summary

Provide the `--summary-template` flag to reference a text file when you need to
swap in bespoke copy. The file can use `{today}` as a placeholder, which is
replaced with the current date when rendering the PDF.

```bash
python scripts/build_residency_package.py \
  --summary-template my_summary.txt \
  --assets-dir path/to/assets
```

Use `--assets` when you want to override the default deliverable list:

```bash
python scripts/build_residency_package.py \
  --assets-dir DecryptTheGirl \
  --assets PROJECT_PORTFOLIO.pdf deck.pdf
```

Disable the manifest if you only need the PDF and ZIP output:

```bash
python scripts/build_residency_package.py --no-manifest
```
