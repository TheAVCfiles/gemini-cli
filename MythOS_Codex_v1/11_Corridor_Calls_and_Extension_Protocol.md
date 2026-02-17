# Corridor Calls & Extension Protocol

Corridor Calls = controlled dialogues with outside systems. They protect canon while enabling extension.

## Call Types

- **Inquiry** – read-only access to public-safe excerpts, metrics, and model versions.
- **Credential Check** – verify StageCred validity, revocation status, and issuer signature.
- **Score Request** – submit a routine for scoring; requires consent artifact + sensor bundle hash.
- **Narrative Release** – request redacted excerpts for press/legal; requires multi-sig approval.

## Protocol Rules

- Every call routes through an API gateway with clearance bands: Public → Trusted Partner → Faculty → Operator.
- No direct calls to Physics layer; all go through StagePort Core contracts.
- All responses include: request id, model version, ledger pointer, expiration timestamp.
- Panic stop switch invalidates outstanding tokens and halts new corridor calls until cleared.

## Extension Kit

- **Skins** register via manifest: `name`, `owner`, `contact`, `data_types`, `revocation_uri`.
- **Adapters** must publish mapping tables: external field → StagePort canonical field.
- **Sandbox** mirror exists for R&D; never use live survivor data for training without explicit revocation-friendly contracts.
- **Observability**: Every extension emits metrics to Ledger + Ops dashboard (latency, error rate, override count).
