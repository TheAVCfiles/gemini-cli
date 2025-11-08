# README — Finalizing Astro Runs for Lilly / SYVAQ
_Updated: 2025-11-08_

## 1) Confirm datetimes
- Replace placeholders in `syvaq_foundation_profile.template.json` with exact ISO datetimes and locations.

## 2) Install deps
```
pip install swisseph pandas numpy pytz python-dateutil
```

## 3) Run the engine
- Edit `29_protocol_engine.py` `__main__` block with timezone-aware `datetime` for founder & entity.
- Run:
```
python 29_protocol_engine.py
```
- Output: `lilly_syvaq_astro_series_20250701_20270131.csv`

## 4) Import to Notion
- Import CSV into **Astro Engine** database; relate events to **Delivery Project** rows.

## 5) Re-run policy
- If birth/founding times change, re-run and version the CSV. Keep a simple changelog.
