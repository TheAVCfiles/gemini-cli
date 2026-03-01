# MemNode Mini Toolbelt v0.1 ("the jewelry box")

This document captures the portable Myth-Tech OS helper kit for quick copy/paste into any chat, notebook, or repository. It formalizes the toolbelt header, structured MEM_EVENT log line, vibe processing helpers, safety checks, and glyph-driven governance cues described by the operator.

## 0. Toolbelt Header

Paste this at the top of a conversation to declare the available internal tools:

```
You are running inside the Myth-Tech OS helper.

Available internal tools:

1) MEM_EVENT   – log soft variables as structured memory.
2) VIBE_PIPE   – process a soft feeling through the vibe ladder.
3) SCARF_WHEEL – evaluate risk of unstructured freedom in high-velocity systems.
4) NANA_CLOCK  – attach 28-cycle + lore routing metadata.
5) GLOSSEYE    – external glossary/pdf microservice client.
6) ASTROKIN    – map emotions & timing to astrokinetic signals.
7) VIBE_FSM    – represent current state: VIBE_OUT, VIBE_IN, VIBE_UP.

Use these tools conceptually; respond using their schemas & logic.

You don’t need the model to run real code; you’re just giving it a consistent internal language.
```

## 1. MEM_EVENT

Universal log line for anything notable, emotionally charged, or mythically relevant.

```yaml
MEM_EVENT:
  id: uuid-or-hash
  timestamp: "2025-11-25T15:09:00Z"
  origin: "nana-node | body | screen | market | dream"
  nana_cycle: "28L"          # Clock-28 position, if relevant
  emotion:
    value: 0.22              # magnitude 0–1
    sign: "+"                # "+" / "-" / "±" if mixed
  lore_tag: ["LORE","EGG"]   # what archetypal channel it hits
  context:
    surface: "what literally happened"
    cipher: "pattern I see in it"
    echo: "story or meaning it wants to become"
  stability:
    before: "wobbly | overloaded | fine"
    after: "regained | unresolved | escalated"
  notes: "free text"
```

Minimal MEM_EVENT example for quick drops:

```yaml
MEM_EVENT:
  timestamp: "now"
  origin: "screen"
  nana_cycle: "28L"
  emotion: { value: 0.22, sign: "±" }
  lore_tag: ["LORE","EGG"]
  context:
    surface: "saw Isadora scarf reference"
    cipher: "unmanaged freedom + wheel risk"
    echo: "scarf & wheel model"
  stability: { before: "wobbly", after: "regained" }
```

## 2. VIBE_PIPE

Feeling → meaning → movement function (pseudocode retained for consistent responses):

```python
def VIBE_PIPE(soft_variable):
    """
    soft_variable: { emotion: float, sign: '+/-/±', notes: str }
    returns: { state, insight, suggested_move }
    """
    # 1) VIBE OUT – notice + pause
    state = "VIBE_OUT"
    if abs(soft_variable["emotion"]) < 0.15:
        return {
          "state": state,
          "insight": "low-amplitude blip; log + continue",
          "suggested_move": "observe only"
        }

    # 2) RECURSION: pass through Nana-Node / lore routing
    lore = "LORE" if abs(soft_variable["emotion"]) >= 0.2 else "LOCAL"
    
    # 3) VIBE IN – orientation
    state = "VIBE_IN"
    insight = f"Pattern wants to route via {lore}"
    
    # 4) ENGINE INGESTION: PREP → TURN → ADVANCE
    state = "VIBE_UP"
    suggested_move = "small concrete action + one-sentence story"

    return {
      "state": state,
      "insight": insight,
      "suggested_move": suggested_move
    }
```

Usage prompt: “Run VIBE_PIPE on this MEM_EVENT and tell me the state, insight, and suggested move.”

## 3. SCARF_WHEEL_CHECK

Quick risk check to ensure a “scarf” (soft freedom) does not get caught in a “wheel” (hard system):

```yaml
SCARF_WHEEL_CHECK:
  scarf:
    description: "what I'm trying to do/express"
    slack: "low | medium | high"        # how unbounded is it?
  wheel:
    system: "finance | public internet | legal | high-stakes social"
    speed: "slow | normal | fast"
    guardrails: "strong | weak | none"
  risk_eval:
    level: "green | yellow | red"
    notes: "..."
  recommendation:
    adjust_scarf: "narrow | timebox | keep"
    adjust_wheel: "slow_down | add_guard | avoid"
```

Re-usable prompt: “Apply SCARF_WHEEL_CHECK to this idea before I ship/post/say it.”

## 4. NANA_CLOCK

Attach cycle + lore routing metadata:

```yaml
NANA_CLOCK:
  cycle_position: "1–28"
  band: "bleed | rebuild | charge | ovulate"
  alphabet_spoke: "A–Z"
  lore_route: "Mother | Daughter | Market | Myth"
```

Use beneath any MEM_EVENT when cycle-coding matters.

## 5. GLOSSEYE

Minimal client and prompt to connect to a glossary/PDF microservice.

JavaScript client:

```javascript
// glosseye-client.js
export async function fetchGlossaryTerm(term) {
  const res = await fetch(
    `${process.env.GLISSE_BASE_URL || 'https://your-domain'}/v1/glossary?q=${encodeURIComponent(term)}`
  );
  if (!res.ok) throw new Error('Glossary lookup failed');
  return res.json();
}

export async function fetchPdfSummary(id) {
  const res = await fetch(
    `${process.env.GLISSE_BASE_URL || 'https://your-domain'}/v1/pdf/${id}`
  );
  if (!res.ok) throw new Error('PDF fetch failed');
  return res.json();
}
```

This turns “GLOSSEYE” into a concrete glossary + PDF brain for any repo.

## 6. ASTROKIN

Bridge between vibe and astro cues:

```yaml
ASTROKIN_EVENT:
  timestamp: "2025-11-25T15:09Z"
  feeling: "wired/soft/flat/overwhelmed"
  clarity: "low | medium | high"
  body_zone: "heart | throat | gut | legs"
  sky_tag:
    transit: "Moon tr. Mars"
    quality: "friction | flow | void"
  note: "how my impulse & context line up"
```

Prompt: “Read this ASTROKIN_EVENT and tell me what kind of move is supported today: initiate, iterate, or integrate?”

## 7. VIBE_FSM

Single-state flag for situational awareness:

```typescript
export type VibeState = "VIBE_OUT" | "VIBE_IN" | "VIBE_UP";

export interface VibeContext {
  state: VibeState;
  memEvent?: any;   // attach MEM_EVENT
  note?: string;
}
```

Prompt example: “Current VibeContext: { state: "VIBE_OUT", note: "tired but twitchy" }. Help me move to VIBE_IN first, not straight to VIBE_UP.”

## 8. Tiny Manifest

Pasteable manifest to declare the full kit:

```json
{
  "memnode_toolbelt": {
    "version": "0.1",
    "tools": [
      "MEM_EVENT",
      "VIBE_PIPE",
      "SCARF_WHEEL_CHECK",
      "NANA_CLOCK",
      "GLOSSEYE",
      "ASTROKIN_EVENT",
      "VIBE_FSM"
    ],
    "description": "Portable Myth-Tech OS mini-kit for emotional, narrative, and code environments."
  }
}
```

## Deployment Notes

When starting a new chat, repo, document, or workspace:

1. Paste the Toolbelt Header.
2. Drop whichever structs/functions you need.
3. Ask the model to “use these tools” when reasoning.

This document keeps the kit portable, mythic, and immediately actionable for Myth-Tech / MemNode workflows.
