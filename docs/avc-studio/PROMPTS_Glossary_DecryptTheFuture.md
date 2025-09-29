# Prompts — Glossary (*Glissé*) and Decrypt the Future

## Glossary auto-ops
"Convert every module folder into a *Glissé* entry using `GLISSE_TEMPLATE.md` and generate a combined `docs/glossary.md`. For each service, fill Inputs/Outputs and Dependencies based on code imports and route usage. Flag missing DRIs."

"Create a `scripts/mk-glisse.mjs` that scans `src/` and `docs/` to auto-fill Glissé stubs with detected components, routes, and JSON schemas. Output diffs only."

## Decrypt the Future — viewer & logic
"Extend `DecryptTheFuture_Viewer.html` to support time-range filters, aspect filters, and export of filtered transits to `.csv`. Add keyboard navigation and a11y labels."

"Implement a local scoring pipeline: given transits (date, aspect, planet, to), compute `daily.pos/neg` using a simple weighting table, and write back to JSON. Provide a 'Recalculate' button."

"Add a `rituals` recommender that maps planet/aspect combos to suggested practices. Keep it transparent: show the rule that triggered the suggestion."

## Data hygiene & privacy
"Add a redaction step that removes precise location and birth time from exported public datasets, replacing with coarse timezones and windowed ranges."

## FinOps hooks
"Instrument viewer events (`filter_change`, `export_clicked`, `ritual_applied`) to a local log JSON for later analytics, no network calls."
