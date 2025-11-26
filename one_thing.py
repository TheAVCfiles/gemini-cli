#!/usr/bin/env python3
"""Summarize one notable fact about the bundled glossary dataset."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, Tuple

GLOSSARY_PATH = Path("web/glossary.json")


def load_glossary(path: Path) -> list[dict[str, object]]:
    """Load glossary entries from *path*.

    Raises a descriptive ``RuntimeError`` if the dataset is missing or malformed.
    """

    if not path.exists():
        raise RuntimeError(
            "Expected glossary data at 'web/glossary.json', but the file is missing."
        )

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive guard
        raise RuntimeError(
            "Glossary file is not valid JSON: {error}".format(error=exc)
        ) from exc

    if not isinstance(data, list):
        raise RuntimeError("Glossary JSON must be a list of term objects.")

    return data


def find_longest_definition(entries: Iterable[dict[str, object]]) -> Tuple[str, int]:
    """Return the term with the longest definition and its character count."""

    best_term = ""
    best_length = -1

    for entry in entries:
        term = str(entry.get("term", ""))
        definition = str(entry.get("definition", ""))
        length = len(definition)
        if length > best_length:
            best_term = term
            best_length = length

    if best_length < 0:
        raise RuntimeError("Glossary contained no definitions to analyze.")

    return best_term, best_length


def main() -> None:
    entries = load_glossary(GLOSSARY_PATH)

    total_terms = len(entries)
    unique_sources = {
        str(entry.get("sources", "")).strip()
        for entry in entries
        if str(entry.get("sources", "")).strip()
    }

    longest_term, longest_length = find_longest_definition(entries)

    print("MWRA Glossary quick stats:\n")
    print(f" • Total terms: {total_terms}")
    print(f" • Unique citation sources: {len(unique_sources)}")
    print(
        " • Longest definition: '{term}' with {length} characters".format(
            term=longest_term, length=longest_length
        )
    )


if __name__ == "__main__":
    main()
