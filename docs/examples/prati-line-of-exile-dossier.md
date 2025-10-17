# Prati “Line of Exile” Dossier PDF

This example shows how to mirror the historical dossier that has circulated with
internal MWRA glossary discussions.  The Python script lives alongside this
file and produces a styled PDF using the [ReportLab](https://www.reportlab.com/)
engine.

## Prerequisites

- Python 3.10+
- The `reportlab` package (`pip install reportlab`)

## Usage

```bash
cd docs/examples
python prati-line-of-exile-dossier.py
```

The script writes `Prati_Line_of_Exile_Dossier.pdf` in the same directory and
prints the output path when generation succeeds.

The resulting document contains:

- Title and subtitle framing the “Line of Exile” theme
- Narrative sections covering Roberto Prati’s exile, a potential American branch
  of the family, and the modern creative lineage
- A footer citing the 1887 newspaper sources that inspired the dossier

Feel free to edit the text blocks in `prati-line-of-exile-dossier.py` if you
need to adapt the story or translate it for another locale.
