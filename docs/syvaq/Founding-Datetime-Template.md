# Founding Datetime Template & Local AI Intake Protocol

This template packages the founding moment data so it can be ingested by a self-hosted AI assistant ("Local Secretary") that runs retrieval-augmented generation (RAG) over SYVAQ’s professional knowledge base.

## 1. Structured Record (YAML)
Store the authoritative founding moment in a version-controlled, encrypted location.

```yaml
syvaq:
  entity_name: "SYVAQ"
  founding_datetime_utc: "<<FOUNDING_DATETIME_UTC>>"  # ISO 8601 with timezone offset
  founding_location:
    city: "<<CITY>>"
    region: "<<REGION/STATE>>"
    country: "<<COUNTRY>>"
    coordinates:
      lat: <<LATITUDE_DECIMAL>>
      lon: <<LONGITUDE_DECIMAL>>
  recorded_by: "<<RECORDED_BY>>"
  verified_on: "<<YYYY-MM-DD>>"
  source_document: "<<LINK_OR_PATH>>"
  verification_status: "pending | verified | superseded"
  change_log:
    - date: "<<YYYY-MM-DD>>"
      action: "initial-entry | correction | supersede"
      notes: "<<WHAT_CHANGED_AND_WHY>>"
```

## 2. Embedding Notes for RAG
1. Generate a markdown brief summarizing the founding moment, context, and significance.  
2. Convert the YAML + brief into embeddings using your local vector store pipeline (`python scripts/embed.py docs/syvaq`).  
3. Tag the chunk with `founding-datetime`, `syvaq`, and `astro-engine` for quick retrieval.

## 3. Local Secretary Prompt Template
Provide the assistant with a system prompt referencing the YAML file path and Guardian protocol.

```
You are the SYVAQ Local Secretary. Always confirm whether the founding datetime has been verified. If the status is `pending`, instruct the operator to pause astro-engine production runs until verification is complete.
```

## 4. Usage Workflow
1. **Capture:** Enter values into `founding_datetime.yml` using the YAML template above.  
2. **Verify:** Cross-check against official filings or direct testimony; update `verification_status`.  
3. **Embed:** Run the embedding job to refresh the vector store.  
4. **Sync:** Regenerate the Notion `Founding Log` page by importing the YAML via the automation README.  
5. **Audit:** Schedule quarterly verification; any change triggers a full astro rerun.

## 5. Security Checklist
- Restrict repository access to the Guardian roster and mentor.  
- Encrypt at rest using age or sops.  
- Log every access in `audit_log.csv` with timestamp, user, and action.  
- Include founding datetime hash in the `Guardian Protocol` weekly review.

## 6. Meaning Interpretation Stub
Embed the founding moment interpretation (once verified) as a separate markdown file (`Founding-Moment-Interpretation.md`) summarizing:
- Chart highlights relevant to safety + growth.  
- Synastry notes between founder and entity.  
- Key anaretic triggers to monitor.

Link the interpretation file in the YAML `source_document` field for automated retrieval by the Local Secretary.
