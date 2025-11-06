# Folio 001 – Lilith Loop (6/8)

This folio houses the Lilith Lineage choreography simulation discussed in the LilithLoop.rouette session. The focus is on codifying fragmentary visibility through the `witness_window` meta-rule.

## Files

- `LilithLoop.rouette` – Primary choreography script containing loop logic, triggers, and loop choreography declarations.
- `witness_window.meta` – Meta-rule definition for conditional visibility.
- `glyph_map.json` – Symbolic glyph references used by the folio.
- `flowchart_access_logic.svg` – SVG flowchart describing the perception gate pipeline.

## Witness Log Recommendation

Create a `witness_log.json` alongside these files when running the folio live. Append entries every time the window grants access:

```json
{
  "timestamp": "2025-07-29T15:31:02Z",
  "event": "cue.fracture",
  "observer": "Aurora",
  "visibility": "GRANTED"
}
```

## GitHub Publication Steps

1. Copy the entire `Folio_001_LilithLoop` directory into your new GitHub repository.
2. Commit with a message such as `Add Folio 001 (Lilith Loop)`.
3. Tag the commit `folio-001` if you want a permanent reference point.

## GCP Mirror Integration

After deploying the `gcp-mirror` service (see adjacent folder), add an entry to `sample-config.yaml` or your live config that points to this folio. The service will surface metadata and optionally serve the SVG flowchart for front-end consumption.
