#!/usr/bin/env python3
"""Post-hoc analyzer for blind comparison results.

This script compares winning/losing skills and transcripts to produce structured
JSON analysis and improvement suggestions for the losing skill.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class LoadedDoc:
    path: Path
    text: str
    json_data: dict[str, Any] | list[Any] | None


def load_doc(path: Path) -> LoadedDoc:
    text = path.read_text(encoding="utf-8")
    json_data: dict[str, Any] | list[Any] | None = None
    try:
        json_data = json.loads(text)
    except json.JSONDecodeError:
        json_data = None
    return LoadedDoc(path=path, text=text, json_data=json_data)


def to_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, (list, tuple)):
        return "\n".join(to_text(v) for v in value)
    if isinstance(value, dict):
        return "\n".join(f"{k}: {to_text(v)}" for k, v in value.items())
    return str(value)


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def first_sentence(text: str, limit: int = 220) -> str:
    cleaned = normalize_whitespace(text)
    if not cleaned:
        return ""
    end = re.search(r"[.!?]", cleaned)
    if end and end.start() < limit:
        return cleaned[: end.start() + 1]
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[:limit].rstrip() + "..."


def extract_reasoning(comparison: LoadedDoc) -> str:
    if isinstance(comparison.json_data, dict):
        for key in (
            "reasoning",
            "rationale",
            "summary",
            "winner_reason",
            "analysis",
            "notes",
        ):
            if key in comparison.json_data:
                return first_sentence(to_text(comparison.json_data[key]), limit=320)
    return first_sentence(comparison.text, limit=320)


def extract_winner(comparison: LoadedDoc, cli_winner: str | None) -> str:
    if cli_winner in {"A", "B"}:
        return cli_winner
    if isinstance(comparison.json_data, dict):
        for key in ("winner", "winning_side", "selected", "choice"):
            value = comparison.json_data.get(key)
            if isinstance(value, str) and value.upper() in {"A", "B"}:
                return value.upper()
    match = re.search(r"\bwinner\b\s*[:=-]?\s*([AB])\b", comparison.text, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return "A"


def extract_steps(skill_text: str) -> list[str]:
    steps: list[str] = []
    for line in skill_text.splitlines():
        stripped = line.strip()
        if re.match(r"^(?:\d+\.|[-*])\s+", stripped):
            item = re.sub(r"^(?:\d+\.|[-*])\s+", "", stripped)
            steps.append(item)
    return steps


def coverage_score(steps: list[str], transcript_text: str) -> float:
    if not steps:
        return 0.6
    transcript = transcript_text.lower()
    covered = 0
    for step in steps:
        key_tokens = [t for t in re.findall(r"[a-zA-Z]{4,}", step.lower()) if t not in {"with", "that", "from", "this", "then", "when", "into", "your", "must", "should", "always"}]
        if not key_tokens:
            continue
        if any(token in transcript for token in key_tokens[:3]):
            covered += 1
    return covered / max(len(steps), 1)


def detect_issues(skill_text: str, transcript_text: str) -> list[str]:
    issues: list[str] = []
    lower_skill = skill_text.lower()
    lower_transcript = transcript_text.lower()

    if "validate" in lower_skill and "validat" not in lower_transcript:
        issues.append("Missed explicit validation guidance from the skill.")
    if "template" in lower_skill and "template" not in lower_transcript:
        issues.append("Did not appear to use the skill's template-oriented workflow.")
    if ("error" in lower_skill or "fallback" in lower_skill) and not (
        "fallback" in lower_transcript or "retry" in lower_transcript or "recover" in lower_transcript
    ):
        issues.append("Did not demonstrate the skill's fallback/error-recovery behavior.")

    error_hits = len(re.findall(r"\berror\b|\bfailed\b|\bfail\b", lower_transcript))
    if error_hits >= 2:
        issues.append("Encountered multiple errors/failures during execution.")

    if not issues:
        issues.append("No major instruction-following gaps detected from available transcript evidence.")
    return issues


def instruction_following(skill_text: str, transcript_text: str) -> tuple[int, list[str]]:
    steps = extract_steps(skill_text)
    coverage = coverage_score(steps, transcript_text)
    issues = detect_issues(skill_text, transcript_text)

    score = round(4 + 6 * coverage)
    if any("multiple errors" in i.lower() for i in issues):
        score -= 1
    score = max(1, min(10, score))
    return score, issues


def text_snippet(text: str, keyword: str, radius: int = 90) -> str:
    lower = text.lower()
    idx = lower.find(keyword.lower())
    if idx == -1:
        return ""
    start = max(0, idx - radius)
    end = min(len(text), idx + len(keyword) + radius)
    return normalize_whitespace(text[start:end])


def detect_strengths(skill: LoadedDoc, transcript: LoadedDoc) -> list[str]:
    strengths: list[str] = []
    stext = skill.text
    ttext = transcript.text

    if len(extract_steps(stext)) >= 4:
        strengths.append("Skill provides a clearly structured multi-step workflow, which likely reduced execution ambiguity.")
    if "example" in stext.lower():
        snippet = text_snippet(stext, "example")
        strengths.append(f"Skill includes examples that likely guided output shape and decisions (evidence: '{first_sentence(snippet, 140)}').")
    if "validate" in stext.lower() and "validat" in ttext.lower():
        strengths.append("Transcript shows validation behavior aligned with skill guidance, improving output reliability.")
    if ("fallback" in stext.lower() or "retry" in stext.lower()) and (
        "fallback" in ttext.lower() or "retry" in ttext.lower()
    ):
        strengths.append("Skill's fallback guidance appears to have been used during execution, supporting recovery from issues.")

    if not strengths:
        strengths.append("Winner showed tighter alignment between skill instructions and execution transcript.")
    return strengths[:5]


def detect_weaknesses(skill: LoadedDoc, transcript: LoadedDoc) -> list[str]:
    weaknesses: list[str] = []
    stext = skill.text.lower()
    ttext = transcript.text.lower()

    if len(extract_steps(skill.text)) < 3:
        weaknesses.append("Skill instructions are lightly structured; limited step-by-step guidance increases execution variance.")
    if "validate" not in stext:
        weaknesses.append("No explicit validation/check step is defined, making output errors harder to catch pre-delivery.")
    if "example" not in stext:
        weaknesses.append("Skill lacks concrete examples, reducing guidance for edge cases and formatting consistency.")
    if "fallback" not in stext and "error" not in stext:
        weaknesses.append("Skill does not provide explicit fallback/error-handling instructions for failed attempts.")
    if re.search(r"\berror\b|\bfailed\b", ttext) and "retry" not in ttext:
        weaknesses.append("Transcript shows failures without clear recovery behavior, indicating missing recovery guidance.")

    if not weaknesses:
        weaknesses.append("Loser output appears constrained by weaker execution alignment rather than a single explicit missing section.")
    return weaknesses[:5]


def build_suggestions(weaknesses: list[str]) -> list[dict[str, str]]:
    suggestions: list[dict[str, str]] = []

    def add(priority: str, category: str, suggestion: str, impact: str) -> None:
        suggestions.append(
            {
                "priority": priority,
                "category": category,
                "suggestion": suggestion,
                "expected_impact": impact,
            }
        )

    weak_text = "\n".join(weaknesses).lower()

    if "structured" in weak_text or "step-by-step" in weak_text:
        add(
            "high",
            "instructions",
            "Rewrite core procedure into explicit numbered steps (input review -> execution -> validation -> final check) with required checkpoints.",
            "Reduces ambiguity and increases instruction-following consistency across runs.",
        )
    if "validation" in weak_text:
        add(
            "high",
            "tools",
            "Add a lightweight validation script/checklist and require running it before final output.",
            "Catches preventable mistakes and aligns behavior with comparator quality criteria.",
        )
    if "example" in weak_text:
        add(
            "medium",
            "examples",
            "Add one strong positive example and one failure-recovery example with expected outputs.",
            "Improves transfer to edge cases and stabilizes formatting/output completeness.",
        )
    if "fallback" in weak_text or "recovery" in weak_text or "error-handling" in weak_text:
        add(
            "high",
            "error_handling",
            "Document fallback sequence for common failures (retry strategy, alternate method, escalation threshold).",
            "Prevents early exits and improves robustness when first-pass execution fails.",
        )

    if not suggestions:
        add(
            "medium",
            "structure",
            "Reorganize SKILL.md into: prerequisites, step-by-step workflow, validation, failure handling, examples.",
            "Makes critical guidance discoverable and easier to follow under time pressure.",
        )

    return suggestions[:6]


def execution_pattern(transcript: LoadedDoc) -> str:
    text = transcript.text.lower()
    segments: list[str] = []

    if "skill" in text or "read" in text:
        segments.append("Read skill context")
    if "step" in text or "plan" in text:
        segments.append("Followed procedural steps")
    if "validat" in text:
        segments.append("Performed validation")
    if "error" in text or "failed" in text:
        if "retry" in text or "fallback" in text:
            segments.append("Recovered from errors with retries/fallbacks")
        else:
            segments.append("Encountered errors with limited recovery")
    segments.append("Produced final output")
    return " -> ".join(dict.fromkeys(segments))


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze blind comparison winner/loser behavior.")
    parser.add_argument("--winner", choices=["A", "B"], default=None)
    parser.add_argument("--winner_skill_path", required=True)
    parser.add_argument("--winner_transcript_path", required=True)
    parser.add_argument("--loser_skill_path", required=True)
    parser.add_argument("--loser_transcript_path", required=True)
    parser.add_argument("--comparison_result_path", required=True)
    parser.add_argument("--output_path", required=True)
    args = parser.parse_args()

    comparison = load_doc(Path(args.comparison_result_path))
    winner_skill = load_doc(Path(args.winner_skill_path))
    winner_transcript = load_doc(Path(args.winner_transcript_path))
    loser_skill = load_doc(Path(args.loser_skill_path))
    loser_transcript = load_doc(Path(args.loser_transcript_path))

    winner_side = extract_winner(comparison, args.winner)
    comparator_reasoning = extract_reasoning(comparison)

    winner_score, winner_issues = instruction_following(winner_skill.text, winner_transcript.text)
    loser_score, loser_issues = instruction_following(loser_skill.text, loser_transcript.text)

    winner_strengths = detect_strengths(winner_skill, winner_transcript)
    loser_weaknesses = detect_weaknesses(loser_skill, loser_transcript)

    output = {
        "comparison_summary": {
            "winner": winner_side,
            "winner_skill": str(Path(args.winner_skill_path)),
            "loser_skill": str(Path(args.loser_skill_path)),
            "comparator_reasoning": comparator_reasoning,
        },
        "winner_strengths": winner_strengths,
        "loser_weaknesses": loser_weaknesses,
        "instruction_following": {
            "winner": {
                "score": winner_score,
                "issues": winner_issues,
            },
            "loser": {
                "score": loser_score,
                "issues": loser_issues,
            },
        },
        "improvement_suggestions": build_suggestions(loser_weaknesses),
        "transcript_insights": {
            "winner_execution_pattern": execution_pattern(winner_transcript),
            "loser_execution_pattern": execution_pattern(loser_transcript),
        },
    }

    output_path = Path(args.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
