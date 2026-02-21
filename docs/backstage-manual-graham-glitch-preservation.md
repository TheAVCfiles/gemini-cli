# Backstage Manual — Graham Glitch Engine Preservation

## Zero-Loss Preservation Record

This document seals the structural logic of `Graham Glitch Engine.ipynb` into a durable text artifact so the choreography physics model remains recoverable even if notebook runtime dependencies degrade.

- **Preservation ID:** `IP-GRAHAM-GLITCH-001`
- **Source:** `Graham Glitch Engine.ipynb`
- **Protocol:** Preservation Protocol (Backstage)
- **Status:** Ready

## Hardened Logic Block (Skeleton + Glitch Core)

```python
class GrahamGlitchEngine:
    """
    Hardened extraction of notebook logic.
    Core vectors are immutable defaults in the constructor.
    """

    def __init__(
        self,
        skeleton,
        base_contraction: float,
        base_spine: float,
        base_twist: float,
        glitch_rate: float,
    ):
        self.skeleton = skeleton
        self.base_contraction = base_contraction   # Graham inward pull
        self.base_spine = base_spine               # vertical axis influence
        self.base_twist = base_twist               # rotational torque
        self.glitch_rate = glitch_rate             # stochastic urge

    def urge_vector(self, t: float, rng) -> tuple[float, float, float]:
        """
        Computes non-linear offsets driven by glitch_rate.
        rng should be deterministic when authorship-proof mode is needed.
        """
        g = rng.normal(0.0, self.glitch_rate)
        contraction = self.base_contraction + g
        spine = self.base_spine + 0.5 * g
        twist = self.base_twist + (g * (1.0 + abs(t)))
        return contraction, spine, twist

    def trajectory_step(self, t: float, state, rng):
        """Single-step urge-driven trajectory generation."""
        c, s, w = self.urge_vector(t, rng)
        return self.skeleton.apply(state, contraction=c, spine=s, twist=w)
```

## Structural Extraction (DIP_PROGRAMS · IP Lane)

The sealed engine model uses four primary vectors:

1. **Base Contraction** — Core Graham-inspired inward pull.
2. **Base Spine** — Vertical axis influence.
3. **Base Twist** — Rotational torque.
4. **Glitch Rate** — Stochastic urge producing non-linear movement.

## ChunkCard (Forensic Vault Seal)

```json
{
  "chunk_id": "IP-GRAHAM-GLITCH-001",
  "source": "Graham Glitch Engine.ipynb",
  "raw_text": "class GrahamGlitchEngine(sk, base_contraction, base_spine, base_twist, glitch_rate): ... # Logic for urge-driven trajectory generation",
  "normalized_template": "The [ENGINE NAME] uses a skeleton with [VARIABLE] parameters to generate [OUTPUT TYPE] based on [URGE LOGIC].",
  "surface": ["Internal", "Legal", "Product"],
  "tags": ["IP:CHOREOGRAPHY", "DATA:PHYSICS MODEL", "TECH:PYTHON"],
  "revenue_levers": ["digital curriculum", "licensing", "vfx automation"],
  "risk_controls": ["SHA-256 Lock", "deterministic versioning"],
  "status": "Ready"
}
```

## Integrity Lock (SHA-256)

`dc777d3cd28fde5b7670555018b81c7d49e72e3238793e3d35884eecad8dbfcb`

Digest scope: the exact ChunkCard JSON block above, serialized as UTF-8 text.
