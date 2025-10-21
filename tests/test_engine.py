import pytest

from glisse_engine import (
    Cue,
    GlisseConfig,
    GlisseEngine,
    GlisseInputs,
    State,
    eff_deadline,
    mk_inputs,
)


def test_eff_deadline_balanchine_law():
    cfg = GlisseConfig()
    assert eff_deadline(4, 4.6, -8.0, config=cfg) == 4
    assert eff_deadline(4, 5.2, -2.0, config=cfg) == 5
    assert eff_deadline(4, 3.0, -9.0, config=cfg) == 3


def test_integrity_gate_blocks_when_structure_low():
    engine = GlisseEngine(GlisseConfig())
    inputs = mk_inputs(price=4655.6, angle_90=4655.6, structure=80.0, perm_p=0.01, ticks_left=4)
    assert engine.step(1, inputs) is None


def test_arming_logic_transitions_to_prep():
    engine = GlisseEngine(GlisseConfig())
    inputs = mk_inputs(
        price=4655.6,
        angle_90=4655.7,
        structure=88.0,
        perm_p=0.03,
        ticks_left=4,
        tri=4.9,
        tau_star=-2.0,
    )
    event = engine.step(1, inputs)
    assert event is not None
    assert event.state is State.PREP
    assert event.cue is Cue.GLISSADE
    assert engine.deadline == 5  # deadline stretched by high TRI*


def test_prep_to_jete_on_glitch_confirm():
    engine = GlisseEngine(GlisseConfig())
    prep_inputs = mk_inputs(
        price=4655.6,
        angle_90=4655.6,
        structure=88.0,
        perm_p=0.02,
        ticks_left=4,
        tri=4.0,
        tau_star=-2.0,
    )
    engine.step(1, prep_inputs)

    wick_inputs = mk_inputs(
        price=4656.0,
        angle_90=4655.6,
        structure=88.0,
        perm_p=0.02,
        ticks_left=3,
        tri=4.0,
        tau_star=-2.0,
        glitch_signals={"wick": True},
    )
    event = engine.step(2, wick_inputs)
    assert event is not None
    assert event.cue is Cue.JETE
    assert engine.state is State.JETE


def test_disqualification_resets_on_adverse_conditions():
    engine = GlisseEngine(GlisseConfig())
    prep_inputs = mk_inputs(
        price=4655.6,
        angle_90=4655.6,
        structure=90.0,
        perm_p=0.02,
        ticks_left=4,
        tri=4.0,
        tau_star=-2.0,
    )
    engine.step(1, prep_inputs)

    disqual_inputs = mk_inputs(
        price=4654.0,
        angle_90=4655.6,
        structure=90.0,
        perm_p=0.02,
        ticks_left=3,
        tri=4.0,
        tau_star=-2.0,
    )
    event = engine.step(2, disqual_inputs)
    assert event is not None
    assert event.cue is Cue.CORPS_RESET
    assert engine.state is State.IDLE


def test_fermata_pause_and_resume_updates_deadline():
    engine = GlisseEngine(GlisseConfig())
    prep_inputs = mk_inputs(
        price=4655.6,
        angle_90=4655.6,
        structure=90.0,
        perm_p=0.02,
        ticks_left=4,
        tri=4.0,
        tau_star=-2.0,
    )
    engine.step(1, prep_inputs)
    engine.step(2, mk_inputs(price=4656.0, angle_90=4655.6, structure=90.0, perm_p=0.02, ticks_left=3, glitch_signals={"wick": True}))

    pause_event = engine.step(
        3,
        mk_inputs(
            price=4656.5,
            angle_90=4655.6,
            structure=90.0,
            perm_p=0.02,
            ticks_left=2,
            glitch_signals={"fermata": True},
        ),
    )
    assert pause_event is not None and pause_event.cue is Cue.FERMATA
    resume_event = engine.step(
        4,
        mk_inputs(
            price=4656.2,
            angle_90=4655.6,
            structure=90.0,
            perm_p=0.02,
            ticks_left=2,
            glitch_signals={"resume": True},
        ),
    )
    assert resume_event is not None
    assert resume_event.cue is Cue.JETE
    assert engine.state is State.JETE


def test_corps_reset_on_negate_signal():
    engine = GlisseEngine(GlisseConfig())
    prep_inputs = mk_inputs(
        price=4655.6,
        angle_90=4655.6,
        structure=88.0,
        perm_p=0.02,
        ticks_left=4,
        tri=4.0,
        tau_star=-2.0,
    )
    engine.step(1, prep_inputs)
    engine.step(
        2,
        mk_inputs(
            price=4656.0,
            angle_90=4655.6,
            structure=88.0,
            perm_p=0.02,
            ticks_left=3,
            glitch_signals={"wick": True},
        ),
    )
    event = engine.step(
        3,
        mk_inputs(
            price=4656.0,
            angle_90=4655.6,
            structure=88.0,
            perm_p=0.02,
            ticks_left=2,
            glitch_signals={"negate": True},
        ),
    )
    assert event is not None
    assert event.cue is Cue.CORPS_RESET
    assert engine.state is State.IDLE
