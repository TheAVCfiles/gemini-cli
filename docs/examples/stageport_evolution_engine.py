"""Utility for fine-tuning the StagePort guidance persona from curated feedback.

This module keeps the footprint light so it can live inside the repo as a
reference script. It is intentionally defensive: it filters the feedback to
MASTER-level, biomechanically safe entries before building a tiny causal LM
dataset.
"""

from dataclasses import dataclass
from importlib.util import find_spec
import json
import os
from typing import Any, Dict, List, Optional

if find_spec("transformers"):
    from transformers import (  # type: ignore
        AutoModelForCausalLM,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )
    TRANSFORMERS_AVAILABLE = True
else:
    TRANSFORMERS_AVAILABLE = False


@dataclass
class FeedbackExample:
    input_text: str
    target_text: str


class StagePortEvolutionEngine:
    """Local fine-tuning loop for the StagePort guidance persona."""

    def __init__(
        self,
        model_name: str = "gpt2",
        storage_path: str = "stageport_feedback.jsonl",
        output_dir: str = "stageport_checkpoints",
        master_threshold: float = 0.9,
    ) -> None:
        self.model_name = model_name
        self.storage_path = storage_path
        self.output_dir = output_dir
        self.master_threshold = master_threshold

        self.tokenizer = None
        self.model = None

    def collect_feedback(self, credentialed_item: Dict[str, Any]) -> None:
        """Append a single credentialed feedback item to local JSONL storage."""

        os.makedirs(os.path.dirname(self.storage_path) or ".", exist_ok=True)
        with open(self.storage_path, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(credentialed_item, ensure_ascii=False) + "\n")

    def evolve(self, max_examples: Optional[int] = None, num_train_epochs: int = 1) -> Dict[str, Any]:
        """Fine-tune on MASTER-level, biomechanically safe feedback only."""

        if not TRANSFORMERS_AVAILABLE:
            return {
                "status": "simulation_only",
                "reason": "transformers is not installed. Install via `pip install transformers datasets`.",
            }

        if not os.path.exists(self.storage_path):
            return {
                "status": "no_data",
                "reason": f"No feedback file found at {self.storage_path}.",
            }

        all_items: List[Dict[str, Any]] = []
        with open(self.storage_path, "r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    all_items.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

        filtered: List[Dict[str, Any]] = []
        for item in all_items:
            level = item.get("credential_level", "").upper()
            sickle_flag = bool(item.get("sickle_flag", False))
            master_score = item.get("overall_score")

            if sickle_flag:
                continue

            if level != "MASTER":
                continue

            if master_score is not None and master_score < self.master_threshold:
                continue

            filtered.append(item)

        if not filtered:
            return {
                "status": "no_master_data",
                "reason": "No MASTER-level, safe feedback found to train on.",
            }

        if max_examples is not None:
            filtered = filtered[:max_examples]

        training_examples: List[FeedbackExample] = []
        for item in filtered:
            original_prompt = item.get("original_prompt", "")
            original_guidance = item.get("original_guidance", "")
            user_correction = item.get("user_correction", "")
            improved_guidance = item.get("improved_guidance") or user_correction

            input_text = (
                "SYSTEM: STAGEPORT kinesthetic guidance persona.\n"
                f"ORIGINAL_PROMPT: {original_prompt}\n"
                f"ORIGINAL_GUIDANCE: {original_guidance}\n"
                f"USER_FEEDBACK: {user_correction}\n"
                "TASK: Rewrite the guidance to be biomechanically safe, "
                "avoid any sickling actions, and respect classical alignment.\n"
                "IMPROVED_GUIDANCE:"
            )

            training_examples.append(
                FeedbackExample(input_text=input_text, target_text=str(improved_guidance))
            )

        if self.tokenizer is None:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

        if self.model is None:
            self.model = AutoModelForCausalLM.from_pretrained(self.model_name)

        class FeedbackDataset:
            def __init__(self, examples: List[FeedbackExample], tokenizer, max_length: int = 512):
                self.examples = examples
                self.tokenizer = tokenizer
                self.max_length = max_length

            def __len__(self) -> int:
                return len(self.examples)

            def __getitem__(self, idx: int) -> Dict[str, Any]:
                example = self.examples[idx]
                full_text = example.input_text + " " + example.target_text
                encoded = self.tokenizer(
                    full_text,
                    truncation=True,
                    max_length=self.max_length,
                    padding="max_length",
                )
                input_ids = encoded["input_ids"]
                attention_mask = encoded["attention_mask"]
                labels = input_ids.copy()
                return {
                    "input_ids": input_ids,
                    "attention_mask": attention_mask,
                    "labels": labels,
                }

        train_dataset = FeedbackDataset(training_examples, self.tokenizer)

        os.makedirs(self.output_dir, exist_ok=True)
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            overwrite_output_dir=True,
            num_train_epochs=num_train_epochs,
            per_device_train_batch_size=1,
            gradient_accumulation_steps=4,
            learning_rate=5e-5,
            weight_decay=0.01,
            logging_steps=10,
            save_steps=50,
            save_total_limit=3,
            fp16=False,
            report_to=[],
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
        )

        train_result = trainer.train()
        trainer.save_model(self.output_dir)
        self.tokenizer.save_pretrained(self.output_dir)

        return {
            "status": "ok",
            "trained_examples": len(training_examples),
            "output_dir": self.output_dir,
            "train_metrics": train_result.metrics,
        }


__all__ = ["StagePortEvolutionEngine", "FeedbackExample", "TRANSFORMERS_AVAILABLE"]
