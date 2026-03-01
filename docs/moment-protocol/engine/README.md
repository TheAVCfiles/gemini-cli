# MomentProtocol_ENGINE_v2 (LINE)

Purpose: the kitchen where assistants and engineers find specs, schemas, scoring logic, telemetry, and fire exits.

## Folder outline
- `README.md` — navigation and quick-start.
- `00_specs/` — Moment Protocol spec, Founding Faculty OS spec, PrimaStack OS spec.
- `01_data_models/` — `moments_schema.json`, routine scoring stub, events and ledger schemas, AK statement structure.
- `02_engines/` — Py.rouette scoring spec, StagePort evolution interfaces, ledger events processor notes.
- `03_routines_and_scoring/` — routine stub examples (MQ/TR/PP/CO/IM), GOE notes, pedagogical interpretations.
- `04_telemetry_and_billing/` — pay-meter rules, invoice item codes, event samples.
- `05_failure_modes_and_fire_exits/` — safety checklists for studios and AI deploys, incident playbooks.

## Anchors already in this repo
- `../moments_schema.json` and `../examples/tween_piece_template.json` capture the “every dancer gets a moment” contract.
- Existing StagePort, Py.rouette, and events docs can be mirrored here as authoritative copies when packaging the zip.

## Implementation notes
- No piece is complete until every dancer is mapped to a defined `moment_id` that meets the schema.
- Telemetry should increment meters when moments are assigned/delivered and emit invoice items when blueprint boxes ship.
- Fire exits stay visible: define shut-down steps for injured teachers, student safety disclosures, or harmful AI outputs.
