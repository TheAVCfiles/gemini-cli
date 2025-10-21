from __future__ import annotations

import pytest

from glisse_engine import ElasticDeadlineSpec, GlisseEngine, GlisseState


def test_happy_path_with_elastic_deadlines():
    engine = GlisseEngine()

    assert engine.state == GlisseState.IDLE

    assert engine.advance(
        GlisseState.PREP,
        timestamp=1.0,
        reason="warming the corps",
        deadline=ElasticDeadlineSpec(duration=1.0, tolerance=0.2),
    )

    assert engine.advance(
        GlisseState.JETE,
        timestamp=2.2,
        reason="launch sequence",
        deadline=ElasticDeadlineSpec(duration=1.2, tolerance=0.25),
    )

    assert engine.advance(
        GlisseState.FERMATA,
        timestamp=4.7,
        reason="hold the line",
        deadline=ElasticDeadlineSpec(duration=2.5, tolerance=0.1),
    )

    assert engine.advance(
        GlisseState.CODA,
        timestamp=6.0,
        reason="release",
    )

    assert engine.state == GlisseState.CODA
    history = engine.history
    assert [entry.kind for entry in history] == ["transition"] * 4
    last = history[-1]
    assert "release" in last.message
    assert last.deadline is None


def test_glitch_gating_for_out_of_sequence():
    engine = GlisseEngine()

    success = engine.advance(
        GlisseState.JETE,
        timestamp=0.5,
        reason="skip ahead",
    )
    assert not success
    assert engine.state == GlisseState.IDLE
    entry = engine.history[-1]
    assert entry.kind == "glitch"
    assert "expected PREP" in entry.message


def test_glitch_gating_for_time_regression():
    engine = GlisseEngine()
    assert engine.advance(GlisseState.PREP, timestamp=1.0, reason="init")

    success = engine.advance(
        GlisseState.JETE,
        timestamp=0.5,
        reason="rewind",
    )

    assert not success
    assert engine.state == GlisseState.PREP
    entry = engine.history[-1]
    assert entry.kind == "glitch"
    assert "timeline regressed" in entry.message


def test_deadline_classification_reports_late_arrival():
    engine = GlisseEngine()
    assert engine.advance(GlisseState.PREP, timestamp=1.0, reason="begin")

    assert engine.advance(
        GlisseState.JETE,
        timestamp=2.3,
        reason="delayed",
        deadline=ElasticDeadlineSpec(duration=1.0, tolerance=0.05),
    )

    entry = engine.history[-1]
    assert entry.deadline_status == "late"
    assert "arrived late" in entry.message
    assert pytest.approx(entry.metadata["deadline_delta"], rel=1e-5) == 0.3


def test_reset_requires_monotonic_time():
    engine = GlisseEngine()
    assert engine.advance(GlisseState.PREP, timestamp=1.0, reason="warm")
    assert engine.advance(GlisseState.JETE, timestamp=2.0, reason="jump")
    assert engine.advance(GlisseState.FERMATA, timestamp=3.0, reason="hold")
    assert engine.advance(GlisseState.CODA, timestamp=4.0, reason="resolve")

    success = engine.reset(timestamp=3.5, reason="retrograde")
    assert not success
    entry = engine.history[-1]
    assert entry.kind == "glitch"
    assert "reset attempted" in entry.message

    assert engine.reset(timestamp=5.0, reason="cycle complete")
    assert engine.state == GlisseState.IDLE
    entry = engine.history[-1]
    assert entry.kind == "reset"
    assert "cycle complete" in entry.message

