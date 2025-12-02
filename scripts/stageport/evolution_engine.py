"""StagePort self-improving guidance persona.

This module converts the original StagePort evolution engine notes into a
runnable implementation.  It integrates tightly with
:class:`scripts.stageport.credential_validator.KinestheticCredential` to
credential feedback before it is used for fine-tuning.

When the ``transformers`` library is unavailable the module gracefully falls
back to simulation mode so that feedback collection still works.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import torch
from torch.utils.data import Dataset

try:  # pragma: no cover - optional dependency
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        DataCollatorForLanguageModeling,
        Trainer,
        TrainingArguments,
    )

    TRANSFORMERS_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    TRANSFORMERS_AVAILABLE = False
    print("⚠️  Transformers not installed. Evolution engine running in simulation mode.")

try:  # pragma: no cover - optional dependency
    from scripts.stageport.credential_validator import KinestheticCredential
except Exception:  # pragma: no cover - optional dependency
    KinestheticCredential = None
    print("⚠️  Credential validator not found. Validation disabled.")


@dataclass
class FeedbackEntry:
    """Structured representation for collected feedback."""

    timestamp: str
    input: str
    output: str
    rating: int
    corrections: Optional[str]
    tags: List[str]
    credential_score: Optional[Dict]
    generation: int

    def to_json(self) -> Dict:
        return {
            "timestamp": self.timestamp,
            "input": self.input,
            "output": self.output,
            "rating": self.rating,
            "corrections": self.corrections,
            "tags": self.tags,
            "credential_score": self.credential_score,
            "generation": self.generation,
        }


class FeedbackDataset(Dataset):
    """Simple dataset wrapper for transformer fine-tuning."""

    def __init__(self, examples: Iterable[Dict], tokenizer, max_length: int = 512):
        self.examples = list(examples)
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self) -> int:
        return len(self.examples)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        example = self.examples[idx]
        text = f"Input: {example['input']}\nOutput: {example['output']}"

        encoding = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )

        return {
            "input_ids": encoding["input_ids"].flatten(),
            "attention_mask": encoding["attention_mask"].flatten(),
            "labels": encoding["input_ids"].flatten(),
        }


class SelfImprovingGuidance:
    """Evolutionary AI system that improves through usage feedback."""

    def __init__(
        self,
        model_path: str | Path = "./offline_ai_assets/models/language_models/gpt2-medium",
        feedback_log_path: str | Path = "./evolution_feedback.json",
        evolution_history_path: str | Path = "./evolution_history.json",
    ) -> None:
        self.model_path = Path(model_path)
        self.feedback_log_path = Path(feedback_log_path)
        self.evolution_history_path = Path(evolution_history_path)

        self.feedback_log: List[Dict] = self._load_json(self.feedback_log_path)
        self.evolution_history: List[Dict] = self._load_json(self.evolution_history_path)

        self.credential_validator = KinestheticCredential() if KinestheticCredential else None

        if TRANSFORMERS_AVAILABLE:
            self._load_model()
        else:
            self.model = None
            self.tokenizer = None
            print("Running in simulation mode. Install transformers for full functionality.")

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _load_json(path: Path) -> List[Dict]:
        if path.exists():
            with path.open("r", encoding="utf-8") as file:
                return json.load(file)
        return []

    @staticmethod
    def _save_json(path: Path, data: List[Dict]) -> None:
        with path.open("w", encoding="utf-8") as file:
            json.dump(data, file, indent=2)

    def _load_model(self) -> None:
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            self.model = AutoModelForCausalLM.from_pretrained(self.model_path)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            print(f"✓ Model loaded from {self.model_path}")
        except Exception as exc:  # pragma: no cover - dependent on environment
            print(f"Error loading model: {exc}")
            self.model = None
            self.tokenizer = None

    # ------------------------------------------------------------------
    # Feedback collection
    # ------------------------------------------------------------------
    def collect_feedback(
        self,
        input_prompt: str,
        generated_output: str,
        user_rating: int,
        corrections: Optional[str] = None,
        tags: Optional[Iterable[str]] = None,
    ) -> FeedbackEntry:
        if not 1 <= user_rating <= 5:
            raise ValueError("user_rating must be between 1 and 5")

        credential_score: Optional[Dict] = None
        if self.credential_validator:
            content_for_scoring = corrections if corrections else generated_output
            credential_score = self.credential_validator.score_output(content_for_scoring)

        entry = FeedbackEntry(
            timestamp=datetime.now().isoformat(),
            input=input_prompt,
            output=generated_output,
            rating=user_rating,
            corrections=corrections,
            tags=list(tags or []),
            credential_score=credential_score,
            generation=len(self.evolution_history),
        )

        self.feedback_log.append(entry.to_json())
        self._save_json(self.feedback_log_path, self.feedback_log)
        return entry

    # ------------------------------------------------------------------
    # Analytics
    # ------------------------------------------------------------------
    def get_validated_examples(
        self,
        min_rating: int = 4,
        min_credential_score: float = 0.85,
    ) -> List[Dict]:
        validated: List[Dict] = []
        for entry in self.feedback_log:
            if entry["rating"] < min_rating:
                continue

            credential_score = entry.get("credential_score") or {}
            total_score = credential_score.get("total_score", 0)
            if credential_score and total_score < min_credential_score:
                continue

            output_text = entry.get("corrections") or entry["output"]
            validated.append(
                {
                    "input": entry["input"],
                    "output": output_text,
                    "quality_score": entry["rating"] / 5.0,
                    "credential_score": total_score,
                }
            )

        return validated

    def analyze_feedback_patterns(self) -> Dict:
        if not self.feedback_log:
            return {"message": "No feedback collected yet"}

        total_entries = len(self.feedback_log)
        avg_rating = sum(entry["rating"] for entry in self.feedback_log) / total_entries

        rating_distribution: Dict[int, int] = defaultdict(int)
        for entry in self.feedback_log:
            rating_distribution[entry["rating"]] += 1

        tag_frequency: Dict[str, int] = defaultdict(int)
        for entry in self.feedback_log:
            for tag in entry.get("tags", []):
                tag_frequency[tag] += 1

        credential_scores = [
            entry["credential_score"]["total_score"]
            for entry in self.feedback_log
            if entry.get("credential_score")
        ]
        avg_credential = sum(credential_scores) / len(credential_scores) if credential_scores else 0

        weak_dimensions: Dict[str, List[float]] = defaultdict(list)
        for entry in self.feedback_log:
            if entry.get("credential_score"):
                for dimension, score in entry["credential_score"]["scores"].items():
                    if score < 0.7:
                        weak_dimensions[dimension].append(score)

        avg_weak_scores = {
            dimension: sum(scores) / len(scores)
            for dimension, scores in weak_dimensions.items()
        }

        return {
            "total_feedback_entries": total_entries,
            "average_rating": round(avg_rating, 2),
            "rating_distribution": dict(rating_distribution),
            "average_credential_score": round(avg_credential, 3),
            "weak_dimensions": avg_weak_scores,
            "top_tags": dict(sorted(tag_frequency.items(), key=lambda item: item[1], reverse=True)[:10]),
            "high_quality_examples": len(self.get_validated_examples()),
            "evolution_generation": len(self.evolution_history),
        }

    def prepare_training_data(self, validated_examples: Iterable[Dict]) -> List[Dict]:
        training_data: List[Dict] = []
        for example in validated_examples:
            weight = (example["quality_score"] + example["credential_score"]) / 2
            repetitions = 1
            if weight >= 0.95:
                repetitions = 3
            elif weight >= 0.85:
                repetitions = 2

            for _ in range(repetitions):
                training_data.append({"input": example["input"], "output": example["output"]})

        return training_data

    def evolve(
        self,
        min_examples: int = 10,
        epochs: int = 3,
        batch_size: int = 2,
        learning_rate: float = 2e-5,
    ) -> Dict:
        if not TRANSFORMERS_AVAILABLE or not self.model or not self.tokenizer:
            return {"error": "Transformers library not available", "mode": "simulation"}

        validated_examples = self.get_validated_examples()
        if len(validated_examples) < min_examples:
            return {
                "error": f"Insufficient validated examples. Need {min_examples}, have {len(validated_examples)}",
                "validated_count": len(validated_examples),
            }

        training_data = self.prepare_training_data(validated_examples)

        print("\n🧬 EVOLUTION INITIATED")
        print(f"   Generation: {len(self.evolution_history) + 1}")
        print(f"   Validated examples: {len(validated_examples)}")
        print(f"   Training examples (with repetition): {len(training_data)}")
        print(f"   Epochs: {epochs}\n")

        dataset = FeedbackDataset(training_data, self.tokenizer)

        output_dir = self.model_path.parent / f"evolution_gen_{len(self.evolution_history) + 1}"
        training_args = TrainingArguments(
            output_dir=str(output_dir),
            overwrite_output_dir=True,
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            learning_rate=learning_rate,
            save_steps=100,
            save_total_limit=2,
            logging_steps=10,
            prediction_loss_only=True,
        )

        data_collator = DataCollatorForLanguageModeling(tokenizer=self.tokenizer, mlm=False)

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=dataset,
            data_collator=data_collator,
        )

        try:
            train_result = trainer.train()
            trainer.save_model(output_dir)
            self.tokenizer.save_pretrained(output_dir)
            self.model_path = output_dir

            evolution_record = {
                "generation": len(self.evolution_history) + 1,
                "timestamp": datetime.now().isoformat(),
                "validated_examples": len(validated_examples),
                "training_examples": len(training_data),
                "epochs": epochs,
                "learning_rate": learning_rate,
                "model_path": str(output_dir),
                "train_loss": getattr(train_result, "training_loss", None),
            }

            self.evolution_history.append(evolution_record)
            self._save_json(self.evolution_history_path, self.evolution_history)

            print("\n✓ EVOLUTION COMPLETE")
            print(f"   New model saved: {output_dir}")
            print(f"   Generation: {evolution_record['generation']}")

            return evolution_record
        except Exception as exc:  # pragma: no cover - training side effects
            return {
                "error": f"Training failed: {exc}",
                "validated_examples": len(validated_examples),
            }

    def get_evolution_stats(self) -> Dict:
        if not self.evolution_history:
            return {"message": "No evolution events yet. Collect feedback and call evolve()."}

        return {
            "current_generation": len(self.evolution_history),
            "total_evolutions": len(self.evolution_history),
            "evolution_history": self.evolution_history,
            "current_model": str(self.model_path),
            "feedback_collected": len(self.feedback_log),
            "validated_examples": len(self.get_validated_examples()),
        }


# ----------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="StagePort Self-Improving Evolution Engine")
    parser.add_argument("--feedback", action="store_true", help="Collect feedback (requires --input, --output, --rating)")
    parser.add_argument("--input", help="Input prompt")
    parser.add_argument("--output", help="Generated output")
    parser.add_argument("--rating", type=int, choices=[1, 2, 3, 4, 5], help="Rating 1-5")
    parser.add_argument("--corrections", help="Corrected/improved version")
    parser.add_argument("--tags", nargs="*", help="Optional tags to associate with the feedback")
    parser.add_argument("--evolve", action="store_true", help="Trigger evolution (retraining)")
    parser.add_argument("--stats", action="store_true", help="Show evolution statistics")
    parser.add_argument("--analyze", action="store_true", help="Analyze feedback patterns")
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    engine = SelfImprovingGuidance()

    if args.stats:
        stats = engine.get_evolution_stats()
        print("\n=== EVOLUTION STATISTICS ===")
        print(json.dumps(stats, indent=2))
        return

    if args.analyze:
        analysis = engine.analyze_feedback_patterns()
        print("\n=== FEEDBACK ANALYSIS ===")
        print(json.dumps(analysis, indent=2))
        return

    if args.feedback or (args.input and args.output and args.rating):
        if not all([args.input, args.output, args.rating]):
            print("Error: --feedback requires --input, --output, and --rating")
            return

        feedback = engine.collect_feedback(
            input_prompt=args.input,
            generated_output=args.output,
            user_rating=args.rating,
            corrections=args.corrections,
            tags=args.tags,
        )

        print("\n✓ Feedback recorded")
        print(f"  Rating: {feedback.rating}/5")
        if feedback.credential_score:
            print(f"  Credential: {feedback.credential_score['credential']}")
            print(f"  Score: {feedback.credential_score['total_score']:.1%}")
        return

    if args.evolve:
        print("\n🧬 Initiating evolutionary training...")
        result = engine.evolve()
        if "error" in result:
            print(f"\n⚠️  Evolution not possible: {result['error']}")
        else:
            print("\n✓ Evolution successful!")
            print(f"  Generation: {result['generation']}")
            print(f"  Training examples: {result['training_examples']}")
            print(f"  Model: {result['model_path']}")
        return

    parser.print_help()


if __name__ == "__main__":
    main()
