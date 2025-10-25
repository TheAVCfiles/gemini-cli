# Redaction-friendly satire PDF generator

The `redaction_text_pdf.py` example shows how to blend
[pdfplumber](https://github.com/jsvine/pdfplumber) with
[ReportLab](https://www.reportlab.com/dev/docs/reportlab-userguide.pdf)
so that the Gemini CLI can produce satire-friendly, redacted PDF reports.

```bash
python docs/examples/redaction_text_pdf.py IncidentOverview.pdf \
  IncidentOverview_satire_redacted.pdf
```

The script will:

- Apply a small library of satirical name substitutions.
- Redact any email addresses and North American phone numbers that appear in
  the document.
- Write a brand-new PDF with the transformed text content.

Bring your own `IncidentOverview.pdf` source file—the example does not ship
with one to keep the repository lightweight.
