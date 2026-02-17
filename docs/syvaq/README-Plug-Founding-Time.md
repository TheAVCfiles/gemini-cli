# README — Finalizing Astro Runs for Lilly / SYVAQ

## 1. Confirm Natal & Founding Datetimes

- Replace `<<FOUNDING_DATETIME>>` with exact date, time, timezone, and location.
- Confirm founder natal data (date, time, timezone, location).
- Log both values in the secure roster (`/data/private/founding_log.yml`).

## 2. Run the Engine

1. Ensure Python 3.9+ is available.
2. Install dependencies: `pip install swisseph pandas numpy pytz python-dateutil`.
3. Place `29_protocol_engine.py` in your working folder.
4. Edit the `__main__` block placeholders with timezone-aware datetime objects.
5. Run `python 29_protocol_engine.py`.
6. Outputs:
   - CSV: `lilly_syvaq_astro_series_20250701_20270131.csv`
   - JSON (optional): `lilly_syvaq_astro_series_20250701_20270131.json`

## 3. Import to Notion

- Import the CSV into the **Astro Engine** database.
- Link each date row to corresponding **Delivery Project** entries.
- Attach Guardian notes where red/amber triggers appear.

## 4. Re-run and Publish

- After inserting accurate founding time, delete placeholder outputs and rerun the script.
- Replace CSV/Notion rows with updated values.
- Update `version_log.md` with date, runtime parameters, and change summary.

## 5. Maintenance & Safety

- If natal time changes, rerun immediately and archive the prior CSV with version notes.
- Maintain a changelog referencing the Guardian roster.
- Store raw outputs in `/data/private/astro_runs/YYYYMMDD/` with restricted permissions.
- Send Guardian summary memo within 24 hours of every red-flag day.
