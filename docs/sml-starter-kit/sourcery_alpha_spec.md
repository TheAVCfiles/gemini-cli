# Sourcery Markup Language (SML) — v0.1

Purpose: turn text into tempo, tone into state change, and ritual phrases into functional cues.
Design goals: human-readable, dependency-free, deterministic.

## Block Structure
Each spell is a **block**:

```
[Cast: Bloom.In.Quiet]
Domain: Aura
Form: Verse
Phase: PREP -> JETÉ
Intent: Stabilize Structure
Trigger:
    when tri_score > 4.5 and structure_ok = true
Effect:
    -> narrate("Structure confirmed.")
    -> cue_state("GlisséEngineFSM", to="PREP")
Tone: Adagio, Elastic
Timing: when CompositeScore > 1.2
Medium: TextFade
Gesture: Soft Pulse
```

### Required fields
- `Cast:` unique spell id (letters, dots, dashes)
- `Effect:` one or more actions, each starting with `->`
- `Tone:` one or more comma-separated descriptors

### Optional fields
`Domain, Form, Phase, Intent, Trigger, Timing, Medium, Gesture`

## Effects (v0.1 built-ins)
- `narrate("...")` — emits text to the console/renderer
- `cue_state("EngineName", to="STATE")` — passes a state cue to an engine
- `display("...")` — show text in renderer
- `animate(key=value, ...)` — for tiny 2D renderer (opacity, duration_ms, size, x, y)
- `emit(key=value, ...)` — attach arbitrary event data

## Notes
- Indentation under `Trigger:` and `Effect:` is meaningful but free-form; lines beginning with `->` are actions.
- Comments start with `#` at line start.
- Whitespace lines are ignored.

## Output
The parser produces JSON events per block, e.g.
```
{
  "cast": "Bloom.In.Quiet",
  "fields": {...},
  "effects": ["display(...)"],
  "timestamp": "2025-11-08T00:00:00Z"
}
```
You can pipe these events to your own engines, or use the included tiny renderer.
