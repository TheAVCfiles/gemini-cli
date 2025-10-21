"""Pytest configuration helpers for ensuring local imports succeed."""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure the repository root is available on the import path so that modules such as
# ``risk`` and ``cue_narrator`` can be imported when running tests directly from the
# cloned source tree.
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
