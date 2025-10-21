"""Finite-state controller coordinating Glissé trade sequences."""

from __future__ import annotations

from typing import Optional

from .config import GlisseConfig
from .models import Cue, GlisseEvent, GlisseInputs, State


def eff_deadline(
    base_deadline: int,
    tri: float,
    tau: float,
    *,
    config: Optional[GlisseConfig] = None,
) -> int:
    """Compute the elastic traversal deadline described in the docs.

    The law is ``clip(D0 + 𝟙[tri ≥ 4.5] − 𝟙[τ* ≤ −7], 2, 12)``.  The clip bounds
    and thresholds are taken from :class:`GlisseConfig` so tests can override
    them easily.
    """

    cfg = config or GlisseConfig()
    delta = 0
    if tri >= cfg.tri_expand_threshold:
        delta += 1
    if tau <= cfg.tau_compress_threshold:
        delta -= 1
    adjusted = base_deadline + delta
    adjusted = max(cfg.deadline_min, min(cfg.deadline_max, adjusted))
    return int(adjusted)


class GlisseEngine:
    """Implements the PREP→JETÉ choreography with narrated cues."""

    def __init__(self, config: Optional[GlisseConfig] = None) -> None:
        self.config = config or GlisseConfig()
        self.state = State.IDLE
        self._arming_price: Optional[float] = None
        self._deadline = self.config.base_deadline
        self._paused_ticks: Optional[int] = None

    @property
    def deadline(self) -> int:
        """Current traversal deadline in ticks."""

        return self._deadline

    def reset(self) -> None:
        """Return to :class:`State.IDLE` without emitting a cue."""

        self.state = State.IDLE
        self._arming_price = None
        self._deadline = self.config.base_deadline
        self._paused_ticks = None

    # ------------------------------------------------------------------
    # Core state machine
    def step(self, sequence: int, inputs: GlisseInputs) -> Optional[GlisseEvent]:
        """Advance the engine with the provided market snapshot."""

        handler = {
            State.IDLE: self._step_idle,
            State.PREP: self._step_prep,
            State.JETE: self._step_jete,
            State.FERMATA: self._step_fermata,
        }[self.state]
        return handler(sequence, inputs)

    # ------------------------------------------------------------------
    def _passes_integrity_gate(self, inputs: GlisseInputs) -> bool:
        if not inputs.regime_open:
            return False
        if inputs.structure < self.config.structure_threshold:
            return False
        if not inputs.ci_excludes_zero:
            return False
        if inputs.perm_p > self.config.perm_probability_cap:
            return False
        if abs(inputs.price - inputs.angle_90) > self.config.epsilon:
            return False
        return True

    def _make_event(
        self,
        sequence: int,
        *,
        state: State,
        cue: Cue,
        narration: str,
    ) -> GlisseEvent:
        return GlisseEvent(sequence=sequence, state=state, cue=cue, narration=narration, deadline=self._deadline)

    def _emit_reset(self, sequence: int, narration: str) -> GlisseEvent:
        self.reset()
        return GlisseEvent(
            sequence=sequence,
            state=State.IDLE,
            cue=Cue.CORPS_RESET,
            narration=narration,
            deadline=self._deadline,
        )

    # ------------------------------------------------------------------
    def _step_idle(self, sequence: int, inputs: GlisseInputs) -> Optional[GlisseEvent]:
        if not self._passes_integrity_gate(inputs):
            return None
        self.state = State.PREP
        self._arming_price = inputs.price
        self._deadline = eff_deadline(
            self.config.base_deadline,
            inputs.tri,
            inputs.tau_star,
            config=self.config,
        )
        narration = (
            f"[PREP] Glissade: structure {inputs.structure:.0f}/100, p={inputs.perm_p:.2f}. "
            f"Angle90={inputs.angle_90:.1f}, cap={self.config.cap_bps:.0f}bps."
        )
        return self._make_event(sequence, state=self.state, cue=Cue.GLISSADE, narration=narration)

    def _step_prep(self, sequence: int, inputs: GlisseInputs) -> Optional[GlisseEvent]:
        if inputs.tau_star <= self.config.adverse_tau_cutoff:
            return self._emit_reset(sequence, "Adverse τ* regime; disarm.")
        if self._arming_price is not None:
            invalid_level = self._arming_price - self.config.price_invalid_tolerance
            if inputs.price < invalid_level:
                return self._emit_reset(sequence, "Price invalidation; below arming level.")
        if inputs.ticks_left <= 0:
            return self._emit_reset(sequence, "Traversal window expired.")

        if inputs.glitch_signals.get("wick"):
            self.state = State.JETE
            narration = (
                "[JETÉ] Glitch confirm (wick). Short; stop tightened; guard engaged."
            )
            return self._make_event(sequence, state=self.state, cue=Cue.JETE, narration=narration)

        narration = f"[PREP] Glitch_Scan: {inputs.ticks_left} ticks left."
        return self._make_event(sequence, state=self.state, cue=Cue.GLITCH_SCAN, narration=narration)

    def _step_jete(self, sequence: int, inputs: GlisseInputs) -> Optional[GlisseEvent]:
        if inputs.glitch_signals.get("fermata"):
            self.state = State.FERMATA
            self._paused_ticks = inputs.ticks_left
            narration = "[FERMATA] Vol spike. Pause; tighten stops."
            return self._make_event(sequence, state=self.state, cue=Cue.FERMATA, narration=narration)
        if inputs.negate or inputs.glitch_signals.get("negate"):
            return self._emit_reset(sequence, "Corps reset on negate.")
        if inputs.target_hit:
            narration = "[CODA_PROFIT] Target touch; scale exit."
            return self._make_event(sequence, state=self.state, cue=Cue.CODA_PROFIT, narration=narration)
        if inputs.ticks_left <= 0:
            return self._emit_reset(sequence, "Traversal window expired.")
        narration = f"[JETÉ] Advance; {inputs.ticks_left} ticks remain."
        return self._make_event(sequence, state=self.state, cue=Cue.JETE, narration=narration)

    def _step_fermata(self, sequence: int, inputs: GlisseInputs) -> Optional[GlisseEvent]:
        if inputs.negate or inputs.glitch_signals.get("negate"):
            return self._emit_reset(sequence, "Corps reset while paused.")
        if inputs.glitch_signals.get("fermata"):
            # Stay paused; maintain the stored ticks.
            narration = "[FERMATA] Holding; awaiting stabilization."
            return self._make_event(sequence, state=self.state, cue=Cue.FERMATA, narration=narration)
        # resume
        self.state = State.JETE
        if inputs.ticks_left > 0:
            self._deadline = min(self._deadline, inputs.ticks_left)
        narration = "[JETÉ] Release; resume phrase."
        return self._make_event(sequence, state=self.state, cue=Cue.JETE, narration=narration)
