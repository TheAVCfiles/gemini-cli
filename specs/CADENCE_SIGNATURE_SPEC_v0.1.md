# CADENCE SIGNATURE SPEC v0.1

## Scope

Define a minimal, deterministic signature protocol that binds content to cadence-derived features,
with explicit refusal states when provenance quality is insufficient.

## Inputs

Cadence capture input events:
- `keydown`
- `keyup`
- event timestamp (ms precision minimum)
- key category (alpha, numeric, punctuation, modifier, control)

Session metadata:
- `session_id`
- `created_at` (ISO8601)

Content input:
- UTF-8 text payload

## Feature Vector

Normalized cadence feature vector SHOULD include:
- Inter-key interval distribution
- Hold-time distribution
- Burst/pause statistics
- Backspace rhythm metrics

Raw keystroke streams SHOULD NOT be persisted by default.

## Outputs

### 1) Sonification output
- MIDI and/or MusicXML representation generated from normalized cadence signals.

### 2) Signature output
- `content_hash = sha256(text_bytes)`
- `cadence_hash = sha256(serialized_feature_vector)`
- `binding_hash = sha256(content_hash || cadence_hash || session_id)`
- Digital signature over `binding_hash`

### 3) AVC match score
- `avc_match_score` computed as cosine similarity against authorized baseline vector(s).

## Refusal states

Implementations MUST expose refusal states:
- `NO_CADENCE`: paste detected or insufficient typed signal to derive trustworthy cadence.
- `LOW_CONFIDENCE`: timing noise or sample quality below confidence threshold.

## Verification levels (recommended)

- `A`: Full verification (signature valid, high-confidence cadence, no refusal)
- `B`: Signature valid, medium-confidence cadence
- `C`: Signature valid, low-confidence context with warnings
- `D`: Refusal state active or signature/provenance invalid

## Determinism

For a fixed tuple of (`text`, `feature_vector`, `session_id`), output hashes MUST be deterministic.

## Privacy

- Store derived features by default.
- Raw keystroke logs only in explicit audit mode with policy consent.

## Versioning

Schema or verification rule changes MUST bump the spec version and output schema version.
