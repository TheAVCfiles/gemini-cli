# Planetary–Market Correlation Index

This repository now includes a helper script for rebuilding the
**Planetary–Market Correlation Index** by merging the historical
`astro_market_alignment.xlsx` workbook with the November 2025 astro calendar.
The output is an updated Excel workbook plus a PNG chart that visualises the
rolling index across the combined timeline.

## Prerequisites

Install the Python dependencies (e.g. inside a virtual environment):

```bash
pip install pandas matplotlib openpyxl xlsxwriter
```

## Usage

Run the script from the repository root. By default it expects the data files
in `/mnt/data`, mirroring the original notebooks:

```bash
python scripts/planetary_market_correlation.py
```

Optional arguments let you override the data sources, rolling-window length,
and output locations:

```bash
python scripts/planetary_market_correlation.py \
  --previous path/to/astro_market_alignment.xlsx \
  --november path/to/astro_nov2025_calendar.xlsx \
  --output /tmp/planetary_market_index.xlsx \
  --chart /tmp/planetary_market_index.png \
  --window 5
```

The script validates that the required columns are available in both workbooks.
It then generates a smoothed rolling average of the confluence scores and saves
both the combined dataset and a visual chart of the correlation trend.
