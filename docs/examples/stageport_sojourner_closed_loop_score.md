# StagePort / Sojourner — Closed Loop Score (PDF)

Generate the one-page Closed Loop Score as a clean PDF using ReportLab.

## Prerequisites

- Python 3.10+
- The `reportlab` package (`pip install reportlab`)

## Usage

```bash
cd docs/examples
python stageport_sojourner_closed_loop_score.py
```

The script writes `StagePort_Sojourner_Closed_Loop_Score.pdf` next to itself using
letter page dimensions and generous margins so the score fits on a single page.
