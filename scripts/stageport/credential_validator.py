"""StagePort Kinesthetic Credentialing System.

This module provides a :class:`KinestheticCredential` class capable of rating
textual curriculum content across five embodied-intelligence dimensions.  The
implementation is a cleaned and fully runnable version of the specification
shared in the StagePort design notes.  The original notes used smart quotes and
contained pseudo-code artefacts, so the logic here standardises them for real
execution.

Key concepts
============

* **Bug = Sickle** – Any movement description that would cause a dancer to
  sickle (break alignment) should reduce the kinesthetic validity score.
* **Translation layers** – Ballet terminology needs to be explained through
  kinesthetic and conceptual language to maintain etymological integrity.
* **Embodied assessment** – Scores are averaged to determine a credential
  level, ranging from ``NEEDS_FOUNDATION`` to ``MASTER``.

The module also exposes a small command line interface so that content can be
credentialled from files, and a helper ``generate_improvement_notes`` function
that summarises shortcomings in the analysed text.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


@dataclass(frozen=True)
class CredentialLevel:
    """Represents a credential classification."""

    name: str
    threshold: float
    description: str


class KinestheticCredential:
    """Validate outputs against embodied intelligence standards.

    Scoring dimensions (0–1 scale)
    ------------------------------
    * **Etymological Integrity** – Language preserves meaning through
      translation layers.
    * **Kinesthetic Validity** – Movement mappings are anatomically sound.
    * **Temporal Coherence** – Timing aligns with musical/cognitive development.
    * **Spatial Accuracy** – Relationships correctly map to physical space.
    * **Execution Quality** – No "sickles" (errors that break the line).
    """

    DEFAULT_CREDENTIAL_LEVELS: Tuple[CredentialLevel, ...] = (
        CredentialLevel(
            name="MASTER",
            threshold=0.85,
            description="CREDENTIALED — Can dance. No sickles detected.",
        ),
        CredentialLevel(
            name="APPRENTICE",
            threshold=0.70,
            description="PROVISIONAL — Needs refinement. Minor alignment issues.",
        ),
        CredentialLevel(
            name="STUDENT",
            threshold=0.50,
            description="DEVELOPMENTAL — Fundamental structure present, needs work.",
        ),
        CredentialLevel(
            name="NEEDS_FOUNDATION",
            threshold=0.0,
            description="NOT CREDENTIALED — Fundamental alignment issues. Cannot execute.",
        ),
    )

    def __init__(self, credentials_path: str | Path = "./credentials_log.json") -> None:
        self.credentials_path = Path(credentials_path)
        self.history: List[Dict] = []
        self.load_credentials_history()

        # Ballet terminology validation (etymological layer)
        self.ballet_terms: Dict[str, Dict[str, str]] = {
            "plié": {
                "etymology": "bent",
                "kinesthetic": "knee flexion with turnout",
            },
            "tendu": {
                "etymology": "stretched",
                "kinesthetic": "pointed extension maintaining floor contact",
            },
            "relevé": {
                "etymology": "raised",
                "kinesthetic": "rising onto ball of foot",
            },
            "sus_sous": {
                "etymology": "under-over",
                "kinesthetic": "feet tight fifth position on relevé",
            },
            "arabesque": {
                "etymology": "arabian",
                "kinesthetic": "one leg extended behind, arms forming line",
            },
            "glissade": {
                "etymology": "glide",
                "kinesthetic": "traveling step, brush-leap-brush",
            },
            "passé": {
                "etymology": "passed",
                "kinesthetic": "foot passes knee of standing leg",
            },
            "grand_jete": {
                "etymology": "big throw",
                "kinesthetic": "split leap through space",
            },
            "pirouette": {
                "etymology": "whirl",
                "kinesthetic": "turn on one leg, spotting head",
            },
        }

        # STEM concepts (validation corpus)
        self.stem_concepts: Tuple[str, ...] = (
            "molecular_bonding",
            "angular_momentum",
            "projectile_motion",
            "electromagnetic_fields",
            "structural_engineering",
            "thermodynamics",
            "fluid_dynamics",
            "wave_propagation",
            "quantum_mechanics",
        )

        # Neurolinguistic patterns (corporate validation)
        self.nlp_patterns: Tuple[str, ...] = (
            "spatial_awareness",
            "temporal_processing",
            "kinesthetic_anchoring",
            "visual_mapping",
            "auditory_patterning",
        )

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------
    def load_credentials_history(self) -> None:
        """Load historical credentialing data from disk."""

        if self.credentials_path.exists():
            with self.credentials_path.open("r", encoding="utf-8") as file:
                self.history = json.load(file)
        else:
            self.history = []

    def save_credential(self, credential_record: Dict) -> None:
        """Persist a credential record to the history log."""

        self.history.append(credential_record)
        with self.credentials_path.open("w", encoding="utf-8") as file:
            json.dump(self.history, file, indent=2)

    # ------------------------------------------------------------------
    # Scoring helpers
    # ------------------------------------------------------------------
    def check_etymological_integrity(self, text: str) -> float:
        """Validate that language preserves meaning through translation layers."""

        score = 0.0
        checks = 0
        text_lower = text.lower()

        for term, data in self.ballet_terms.items():
            plain_term = term.replace("_", " ")
            hyphen_term = term.replace("_", "-")
            if plain_term in text_lower or hyphen_term in text_lower:
                checks += 1
                kinesthetic = data["kinesthetic"].lower()
                if kinesthetic in text_lower or self._contains_any(
                    text_lower, kinesthetic.split()[:3]
                ):
                    score += 1.0
                else:
                    score += 0.5  # Term present but not fully explained

        for concept in self.stem_concepts:
            plain_concept = concept.replace("_", " ")
            if plain_concept in text_lower:
                checks += 1
                if self._contains_any(
                    text_lower,
                    ("movement", "kinesthetic", "embodied", "body", "dance"),
                ):
                    score += 1.0
                else:
                    score += 0.3  # Concept present but not embodied

        return (score / checks) if checks > 0 else 0.5

    def validate_kinesthetic_validity(self, text: str) -> float:
        """Verify that movement mappings are anatomically sound."""

        score = 1.0
        sickle_indicators = (
            "force the position",
            "ignore pain",
            "push through discomfort",
            "doesn't matter if it hurts",
            "just do it harder",
        )

        for indicator in sickle_indicators:
            if indicator in text.lower():
                score -= 0.2

        sound_indicators = (
            "alignment",
            "natural range",
            "individual variation",
            "muscular engagement",
            "core support",
            "proper technique",
            "breathing",
            "gradual progression",
            "safety",
        )

        present = sum(1 for indicator in sound_indicators if indicator in text.lower())
        anatomical_score = min(1.0, present / 5)

        return max(0.0, min(1.0, score * 0.5 + anatomical_score * 0.5))

    def assess_temporal_coherence(self, text: str) -> float:
        """Validate timing structure for musical/cognitive alignment."""

        temporal_markers = (
            "timing",
            "rhythm",
            "tempo",
            "duration",
            "sequence",
            "progression",
            "pacing",
            "developmental",
            "age-appropriate",
            "gradual",
            "step-by-step",
            "phase",
            "stage",
        )
        checks = sum(1 for marker in temporal_markers if marker in text.lower())
        temporal_density = min(1.0, checks / 6)

        musical_elements = ("count", "beat", "measure", "phrase", "music")
        musical_bonus = 0.2 if self._contains_any(text.lower(), musical_elements) else 0.0

        return min(1.0, temporal_density + musical_bonus)

    def verify_spatial_relationships(self, text: str) -> float:
        """Validate that spatial relationships correctly map to physical space."""

        spatial_terms = (
            "forward",
            "backward",
            "left",
            "right",
            "up",
            "down",
            "diagonal",
            "circular",
            "parallel",
            "perpendicular",
            "distance",
            "proximity",
            "orientation",
            "direction",
            "center",
            "periphery",
            "vertical",
            "horizontal",
        )
        checks = sum(1 for term in spatial_terms if term in text.lower())
        spatial_density = min(1.0, checks / 8)

        dimensional_markers = ("plane", "axis", "dimension", "space", "volume")
        dimensional_present = sum(
            1 for marker in dimensional_markers if marker in text.lower()
        )
        dimensional_score = min(0.3, dimensional_present * 0.1)

        return min(1.0, spatial_density + dimensional_score)

    def test_for_glitches(self, text: str) -> float:
        """Ensure the output can be executed without placeholders or glitches."""

        score = 1.0
        critical_errors = (
            r"\[PLACEHOLDER\]",
            r"\[TODO\]",
            r"\[INSERT.*?\]",
            r"<FILL.*?>",
            "undefined",
            "tbd",
            "coming soon",
        )

        for pattern in critical_errors:
            if re.search(pattern, text, re.IGNORECASE):
                score -= 0.3

        has_headers = bool(re.search(r"#+\s+\w+", text))
        actionable = self._contains_any(
            text.lower(), ("step", "action", "exercise", "activity", "practice")
        )
        has_assessment = self._contains_any(
            text.lower(), ("assess", "evaluate", "measure", "rubric", "criteria")
        )

        completeness_score = sum((has_headers, actionable, has_assessment)) / 3
        return max(0.0, min(1.0, score * 0.6 + completeness_score * 0.4))

    # ------------------------------------------------------------------
    # High level scoring and reporting
    # ------------------------------------------------------------------
    def score_output(self, generated_content: str, metadata: Dict | None = None) -> Dict:
        """Perform a full credentialing assessment on the provided content."""

        scores = {
            "etymological_integrity": self.check_etymological_integrity(generated_content),
            "kinesthetic_validity": self.validate_kinesthetic_validity(generated_content),
            "temporal_coherence": self.assess_temporal_coherence(generated_content),
            "spatial_accuracy": self.verify_spatial_relationships(generated_content),
            "execution_quality": self.test_for_glitches(generated_content),
        }

        total_score = sum(scores.values()) / len(scores)
        credential, level = self._determine_credential(total_score)
        feedback = self.generate_improvement_notes(scores)

        credential_record = {
            "timestamp": datetime.now().isoformat(),
            "content_hash": hashlib.sha256(generated_content.encode()).hexdigest()[:16],
            "scores": scores,
            "total_score": round(total_score, 3),
            "credential": credential,
            "level": level,
            "feedback": feedback,
            "metadata": metadata or {},
        }

        self.save_credential(credential_record)
        return credential_record

    def generate_improvement_notes(self, scores: Dict[str, float]) -> List[str]:
        """Generate specific improvement recommendations based on scores."""

        notes: List[str] = []
        if scores["etymological_integrity"] < 0.7:
            notes.append(
                "⚠️ ETYMOLOGY: Strengthen the language bridges. Ballet terms → "
                "kinesthetic descriptions → conceptual mappings must maintain coherent "
                "translation layers."
            )

        if scores["kinesthetic_validity"] < 0.7:
            notes.append(
                "⚠️ ANATOMY: Check for 'sickles' (misalignments). Ensure movement "
                "descriptions are anatomically sound and safe."
            )

        if scores["temporal_coherence"] < 0.7:
            notes.append(
                "⚠️ TIMING: Add temporal structure. Include rhythm, pacing, "
                "developmental progression, and musical/cognitive timing cues."
            )

        if scores["spatial_accuracy"] < 0.7:
            notes.append(
                "⚠️ SPACE: Clarify spatial relationships. Add directional vocabulary, "
                "dimensional awareness, and physical orientation details."
            )

        if scores["execution_quality"] < 0.7:
            notes.append(
                "⚠️ EXECUTION: Remove placeholders and incomplete sections. Ensure "
                "clean, actionable content that can be performed without hesitation."
            )

        if not notes:
            notes.append("✓ EXCELLENT: All dimensions meet credentialing standards. This can dance.")

        return notes

    def batch_credential(self, content_list: Iterable[Tuple[str, Dict]]) -> List[Dict]:
        """Credential multiple outputs in batch."""

        results = []
        for content, metadata in content_list:
            results.append(self.score_output(content, metadata))
        return results

    def get_credential_stats(self) -> Dict:
        """Analyse credentialing history and compute aggregate statistics."""

        if not self.history:
            return {"total": 0, "message": "No credentials issued yet"}

        total = len(self.history)
        by_level: Dict[str, int] = {}
        avg_scores = {
            "etymological_integrity": 0.0,
            "kinesthetic_validity": 0.0,
            "temporal_coherence": 0.0,
            "spatial_accuracy": 0.0,
            "execution_quality": 0.0,
        }

        for record in self.history:
            level = record.get("level", "UNKNOWN")
            by_level[level] = by_level.get(level, 0) + 1
            for dimension, score in record["scores"].items():
                avg_scores[dimension] += score

        for dimension in avg_scores:
            avg_scores[dimension] = round(avg_scores[dimension] / total, 3)

        overall_average = round(sum(avg_scores.values()) / len(avg_scores), 3)

        return {
            "total_credentialed": total,
            "by_level": by_level,
            "average_scores": avg_scores,
            "overall_average": overall_average,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _contains_any(text: str, words: Iterable[str]) -> bool:
        return any(word in text for word in words)

    def _determine_credential(self, total_score: float) -> Tuple[str, str]:
        for level in self.DEFAULT_CREDENTIAL_LEVELS:
            if total_score >= level.threshold:
                return level.description, level.name
        # Fallback (should not happen because NEEDS_FOUNDATION has threshold 0)
        lowest = self.DEFAULT_CREDENTIAL_LEVELS[-1]
        return lowest.description, lowest.name


# ----------------------------------------------------------------------
# Auxiliary mock validator (used for quick heuristic scoring)
# ----------------------------------------------------------------------

import random


def analyze_curriculum_text(curriculum_text: str) -> Dict[str, float]:
    """Generate heuristic dimension scores for the provided curriculum text."""

    scores: Dict[str, float] = {}
    is_mastery_movement = "fouetté" in curriculum_text.lower() or "grand jeté" in curriculum_text.lower()

    base_integrity = random.uniform(90.0, 98.0)
    if "angular momentum" in curriculum_text.lower() and "pirouette" in curriculum_text.lower():
        scores["etymological_integrity"] = base_integrity
    else:
        scores["etymological_integrity"] = random.uniform(75.0, 85.0)

    base_validity = random.uniform(90.0, 95.0)
    if is_mastery_movement:
        scores["kinesthetic_validity"] = max(75.0, base_validity - random.uniform(0, 5))
    else:
        scores["kinesthetic_validity"] = base_validity

    scores["temporal_coherence"] = random.uniform(88.0, 94.0)
    scores["spatial_accuracy"] = random.uniform(87.0, 93.0)

    if "[omitted for brevity]" in curriculum_text.lower():
        scores["execution_quality"] = random.uniform(60.0, 70.0)
    else:
        scores["execution_quality"] = random.uniform(90.0, 95.0)

    return scores


def get_credential_report(raw_scores: Dict[str, float]) -> Dict[str, object]:
    """Convert raw heuristic scores into a credential report."""

    overall_score = sum(raw_scores.values()) / len(raw_scores)
    if raw_scores["kinesthetic_validity"] < 80.0:
        level = "NEEDS_FOUNDATION"
        message = "CRITICAL SICKLE DETECTED. Kinesthetic Validity failure requires immediate foundation work."
    else:
        level = "NEEDS_FOUNDATION"
        message = "Cannot execute. Critical sickle detected."
        ordered_levels = sorted(
            KinestheticCredential.DEFAULT_CREDENTIAL_LEVELS,
            key=lambda record: record.threshold,
            reverse=True,
        )
        for credential_level in ordered_levels:
            if overall_score / 100 >= credential_level.threshold:
                level = credential_level.name
                message = credential_level.description
                break

    return {
        "overall_score": round(overall_score, 1),
        "credential_level": level,
        "credential_message": message,
        "dimension_scores": {key: round(value, 1) for key, value in raw_scores.items()},
    }


def validate(curriculum_text: str) -> Dict[str, object]:
    """Public helper that combines heuristic analysis and reporting."""

    raw_scores = analyze_curriculum_text(curriculum_text)
    return get_credential_report(raw_scores)


# ----------------------------------------------------------------------
# CLI entry point
# ----------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="StagePort Kinesthetic Credentialing System",
    )
    parser.add_argument("content_file", help="File containing content to credential")
    parser.add_argument("--metadata", help="JSON file with metadata")
    parser.add_argument("--stats", action="store_true", help="Show credentialing statistics")
    return parser


def main() -> None:
    """CLI interface for credentialing."""

    parser = _build_parser()
    args = parser.parse_args()

    validator = KinestheticCredential()

    if args.stats:
        stats = validator.get_credential_stats()
        print("\n=== CREDENTIALING STATISTICS ===")
        print(json.dumps(stats, indent=2))
        return

    with open(args.content_file, "r", encoding="utf-8") as file:
        content = file.read()

    metadata = {}
    if args.metadata:
        with open(args.metadata, "r", encoding="utf-8") as file:
            metadata = json.load(file)

    result = validator.score_output(content, metadata)

    print("\n" + "=" * 60)
    print("STAGEPORT KINESTHETIC CREDENTIAL")
    print("=" * 60)
    print(f"\nTimestamp: {result['timestamp']}")
    print(f"Content Hash: {result['content_hash']}")
    print(f"\n{result['credential']}")
    print(f"Level: {result['level']}")
    print(f"Overall Score: {result['total_score']:.1%}")

    print("\n--- Dimension Scores ---")
    for dimension, score in result["scores"].items():
        bar = "█" * int(score * 20)
        print(f"{dimension:25s} {score:.1%} {bar}")

    print("\n--- Improvement Notes ---")
    for note in result["feedback"]:
        print(f"  {note}")

    print("\n" + "=" * 60)
    print("Bug = Sickle. If you can tendu, you can dance. 🩰")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
