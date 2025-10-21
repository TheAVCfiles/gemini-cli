# Regime Gate Signals Helper

The following Python snippet illustrates a lightweight helper for combining structural, glitch, and volatility signals into a single gate decision. It aims to mirror the terminology used by the live regime writer tooling while remaining dependency-free so it can be embedded inside notebooks or ad-hoc checklists.

```python
from dataclasses import dataclass


@dataclass
class StructureSignal:
    score: int  # structural weight 0..100


@dataclass
class GlitchSignal:
    wick_rejection: bool = False
    micro_divergence: bool = False
    lob_imbalance: bool = False

    def confirmed(self) -> bool:
        return self.wick_rejection or self.micro_divergence or self.lob_imbalance


@dataclass
class VolSignal:
    spike: bool = False


@dataclass
class GateDecision:
    structure: StructureSignal
    glitch: GlitchSignal
    volume: VolSignal
    min_structure: int = 85

    def open(self) -> bool:
        """Return ``True`` when the structural, glitch, and volatility filters agree."""
        if self.structure.score < self.min_structure:
            return False
        if not self.glitch.confirmed():
            return False
        if self.volume.spike:
            return False
        return True

    def diagnostics(self) -> dict[str, object]:
        return {
            "structure_score": self.structure.score,
            "glitch_confirmed": self.glitch.confirmed(),
            "vol_spike": self.volume.spike,
            "gate_open": self.open(),
        }
```

Example usage:

```python
structure = StructureSignal(score=90)
glitch = GlitchSignal(wick_rejection=True)
vol = VolSignal(spike=False)

gate = GateDecision(structure, glitch, vol)
print(gate.open())          # -> True
print(gate.diagnostics())   # -> {'structure_score': 90, 'glitch_confirmed': True, ...}
```
